import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getGenuineRepliesFrom, sendMessage, textToHtml } from "@/lib/nylas";
import { getSuppressedSet, suppress } from "@/lib/suppression";
import { isOptOut, createDealFromReply } from "@/lib/replies";
import { applyMerge } from "@/lib/storage";
import type { CampaignStep, Contact } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300; // large batches must not hit the default timeout

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Send windows are user-facing times — evaluate them in UK time, not the
// server's UTC clock (which made an 8am window mean 9am for UK users).
function ukTimeParts(d: Date): { hour: number; day: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/London",
    hour: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(d);
  return {
    hour: Number(parts.find(p => p.type === "hour")?.value ?? d.getUTCHours()),
    day: parts.find(p => p.type === "weekday")?.value ?? DAY_NAMES[d.getUTCDay()],
  };
}

// Warm-up ramp: freshly connected inboxes send less while they build
// sender reputation. Weeks since connect → daily cap; null = fully warmed.
const WARMUP_WEEKLY_CAPS = [10, 15, 20];

function warmupCap(connectedAt: string | null): number | null {
  if (!connectedAt) return null;
  const weeks = Math.floor((Date.now() - new Date(connectedAt).getTime()) / (7 * 86400000));
  return weeks >= 0 && weeks < WARMUP_WEEKLY_CAPS.length ? WARMUP_WEEKLY_CAPS[weeks] : null;
}

export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  // Find all active sequence contacts due to send
  const { data: dueActive, error } = await db
    .from("sequence_contacts")
    .select("*")
    .eq("status", "active")
    .lte("next_send_at", now.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Recover rows stuck in "sending" — a previous run died mid-send
  const staleCutoff = new Date(Date.now() - 30 * 60000).toISOString();
  const { data: dueStale } = await db
    .from("sequence_contacts")
    .select("*")
    .eq("status", "sending")
    .lte("next_send_at", staleCutoff);

  const due = [...(dueActive ?? []), ...(dueStale ?? [])];

  let sent = 0;
  let failed = 0;

  // Cache: campaign rows, user sent-today counts, per-user suppression lists
  const campaignCache: Record<string, Record<string, unknown>> = {};
  const userSentToday: Record<string, number> = {};
  const suppressedCache: Record<string, Set<string>> = {};
  const accountCache: Record<string, { email: string; nylas_grant_id: string | null; connected_at: string | null } | null> = {};

  const processRow = async (row: (typeof due)[number]) => {
    let reserved = false;
    try {
      // Never email anyone on the user's do-not-contact list
      if (!(row.user_id in suppressedCache)) {
        suppressedCache[row.user_id] = await getSuppressedSet(row.user_id);
      }
      if (suppressedCache[row.user_id].has(row.contact_email.toLowerCase())) {
        await db.from("sequence_contacts").update({ status: "suppressed" }).eq("id", row.id);
        return;
      }
      // Fetch + cache campaign
      if (!campaignCache[row.campaign_id]) {
        const { data: c } = await db
          .from("campaigns")
          .select("subject, body, steps, status, emails_per_day, send_window_start, send_window_end, send_days")
          .eq("id", row.campaign_id)
          .single();
        if (!c) return;
        campaignCache[row.campaign_id] = c as Record<string, unknown>;
      }
      const campaignRow = campaignCache[row.campaign_id];

      // Skip paused campaigns
      if (campaignRow.status === "paused") return;

      // Check send window
      const windowStart = (campaignRow.send_window_start as number) ?? 8;
      const windowEnd = (campaignRow.send_window_end as number) ?? 18;
      const sendDays = (campaignRow.send_days as string[]) || ["Mon", "Tue", "Wed", "Thu", "Fri"];
      const { hour: currentHour, day: currentDay } = ukTimeParts(now);

      if (!sendDays.includes(currentDay) || currentHour < windowStart || currentHour >= windowEnd) {
        return; // Outside allowed window — skip this run
      }

      // Get the user's connected email account (Nylas grant), cached per run
      if (!(row.user_id in accountCache)) {
        const { data } = await db
          .from("user_email_accounts")
          .select("email, nylas_grant_id, connected_at")
          .eq("user_id", row.user_id)
          .single();
        accountCache[row.user_id] = data ?? null;
      }
      const emailAccount = accountCache[row.user_id];

      if (!emailAccount?.nylas_grant_id) {
        await db.from("sequence_contacts").update({ status: "error" }).eq("id", row.id);
        return;
      }
      const grantId = emailAccount.nylas_grant_id as string;

      // Daily limit: campaign cap, tightened by the warm-up ramp for fresh inboxes
      const campaignCap = (campaignRow.emails_per_day as number) || 25;
      const ramp = warmupCap(emailAccount.connected_at);
      const dailyLimit = ramp !== null ? Math.min(campaignCap, ramp) : campaignCap;
      if (!(row.user_id in userSentToday)) {
        const { count } = await db
          .from("email_log")
          .select("*", { count: "exact", head: true })
          .eq("user_id", row.user_id)
          .gte("sent_at", startOfDay.toISOString());
        // Re-check after the await — another worker may have set it since
        if (!(row.user_id in userSentToday)) userSentToday[row.user_id] = count ?? 0;
      }
      if (userSentToday[row.user_id] >= dailyLimit) return;

      // Resolve email subject + body based on which step we're on
      let subject: string;
      let body: string;
      const steps: CampaignStep[] = (campaignRow.steps as CampaignStep[]) ?? [];

      if (row.current_step === 1) {
        // Initial email — use campaign's main subject/body
        subject = applyMerge(campaignRow.subject as string, {
          name: row.contact_name ?? "",
          email: row.contact_email,
          position: row.contact_position ?? "",
          company: row.contact_company ?? "",
        });
        body = applyMerge(campaignRow.body as string, {
          name: row.contact_name ?? "",
          email: row.contact_email,
          position: row.contact_position ?? "",
          company: row.contact_company ?? "",
        });
      } else {
        const stepIndex = row.current_step - 2; // step 2 → steps[0]
        if (stepIndex < 0 || stepIndex >= steps.length) {
          await db.from("sequence_contacts").update({ status: "completed" }).eq("id", row.id);
          return;
        }

        // Check for a genuine reply before sending follow-up
        const enrolledAt = new Date(row.created_at);
        const replies = await getGenuineRepliesFrom(
          grantId,
          row.contact_email,
          Math.floor(enrolledAt.getTime() / 1000)
        );
        const replied = replies.length > 0;
        if (replied && isOptOut(replies)) {
          // They asked to stop — honour it immediately, no deal created
          await suppress(row.user_id, row.contact_email, "reply opt-out");
          await db.from("sequence_contacts").update({ status: "suppressed" }).eq("id", row.id);
          return;
        }
        if (replied) {
          await db.from("sequence_contacts").update({ status: "replied" }).eq("id", row.id);
          await createDealFromReply(db, row);
          return;
        }

        const step = steps[stepIndex];
        const contact: Contact = {
          name: row.contact_name ?? "",
          email: row.contact_email,
          position: row.contact_position ?? "",
          company: row.contact_company ?? "",
        };
        subject = applyMerge(step.subject || `Re: ${campaignRow.subject ?? ""}`, contact);
        body = applyMerge(step.body, contact);
      }

      // Reserve a daily-cap slot (check+increment is atomic between awaits)
      if ((userSentToday[row.user_id] ?? 0) >= dailyLimit) return;
      userSentToday[row.user_id] = (userSentToday[row.user_id] ?? 0) + 1;
      reserved = true;

      // Claim the row before sending — prevents overlapping cron runs from
      // double-emailing the same contact. If the claim misses, another run
      // (or a concurrent tick) already owns it.
      const { data: claimed } = await db
        .from("sequence_contacts")
        .update({ status: "sending" })
        .eq("id", row.id)
        .in("status", ["active", "sending"])
        .select("id");
      if (!claimed || claimed.length === 0) {
        userSentToday[row.user_id] = Math.max(0, (userSentToday[row.user_id] ?? 1) - 1);
        reserved = false;
        return;
      }

      // Follow-ups thread onto the initial email when we know its message id
      const { messageId } = await sendMessage(grantId, {
        to: { email: row.contact_email, name: row.contact_name ?? undefined },
        subject,
        htmlBody: textToHtml(body),
        replyToMessageId: row.current_step > 1 ? row.last_message_id ?? undefined : undefined,
      });

      // Log to email_log
      await db.from("email_log").insert({
        user_id: row.user_id,
        contact_email: row.contact_email.toLowerCase(),
        subject,
        body,
        campaign_id: row.campaign_id,
        campaign_name: null,
      });

      // Advance to next step or complete
      const nextStep = row.current_step + 1;
      const nextStepIndex = nextStep - 2;
      if (nextStepIndex >= steps.length) {
        await db
          .from("sequence_contacts")
          .update({ status: "completed", current_step: nextStep, last_message_id: messageId })
          .eq("id", row.id);
      } else {
        const nextSendAt = new Date(
          Date.now() + steps[nextStepIndex].delay_days * 86400000
        ).toISOString();
        await db
          .from("sequence_contacts")
          .update({ status: "active", current_step: nextStep, next_send_at: nextSendAt, last_message_id: messageId })
          .eq("id", row.id);
      }

      sent++;
    } catch {
      failed++;
      if (reserved) userSentToday[row.user_id] = Math.max(0, (userSentToday[row.user_id] ?? 1) - 1);
      // Release a claimed-but-unsent row so the next run retries it
      try {
        await db.from("sequence_contacts").update({ status: "active" }).eq("id", row.id).eq("status", "sending");
      } catch { /* best effort */ }
    }
  };

  // Bounded-concurrency worker pool — throughput scales with users while
  // the shared userSentToday reservations keep daily caps exact.
  const CONCURRENCY = 6;
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, due.length) }, async () => {
      while (cursor < due.length) {
        const row = due[cursor++];
        await processRow(row);
      }
    })
  );

  // ── Reply sweep ──────────────────────────────────────────────
  // Most replies arrive AFTER the last step has sent, and single-email
  // campaigns never hit the follow-up reply check at all. Sweep recently
  // completed sequences once an hour so late replies still get flagged,
  // dealt, and opt-outs honoured.
  let sweptReplies = 0;
  if (now.getMinutes() < 15) {
    const sweepCutoff = new Date(Date.now() - 14 * 86400000).toISOString();
    const { count: completedCount } = await db
      .from("sequence_contacts")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("created_at", sweepCutoff);
    const totalCompleted = completedCount ?? 0;
    const sweepOffset = totalCompleted > 40 ? (now.getUTCHours() * 40) % totalCompleted : 0;
    const { data: completedRows } = await db
      .from("sequence_contacts")
      .select("*")
      .eq("status", "completed")
      .gte("created_at", sweepCutoff)
      .order("created_at", { ascending: true })
      .range(sweepOffset, sweepOffset + 39);

    for (const row of completedRows ?? []) {
      try {
        if (!(row.user_id in accountCache)) {
          const { data } = await db
            .from("user_email_accounts")
            .select("email, nylas_grant_id, connected_at")
            .eq("user_id", row.user_id)
            .single();
          accountCache[row.user_id] = data ?? null;
        }
        const acct = accountCache[row.user_id];
        if (!acct?.nylas_grant_id) continue;

        const replies = await getGenuineRepliesFrom(
          acct.nylas_grant_id,
          row.contact_email,
          Math.floor(new Date(row.created_at).getTime() / 1000)
        );
        if (replies.length === 0) continue;

        if (isOptOut(replies)) {
          await suppress(row.user_id, row.contact_email, "reply opt-out");
          await db.from("sequence_contacts").update({ status: "suppressed" }).eq("id", row.id);
        } else {
          await db.from("sequence_contacts").update({ status: "replied" }).eq("id", row.id);
          await createDealFromReply(db, row);
        }
        sweptReplies++;
      } catch {
        // best-effort; a single bad row must not kill the sweep
      }
    }
  }

  return NextResponse.json({ sent, failed, sweptReplies });
}
