import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getGenuineRepliesFrom, sendMessage, textToHtml } from "@/lib/nylas";
import { getSuppressedSet, suppress } from "@/lib/suppression";
import { applyMerge } from "@/lib/storage";
import type { CampaignStep, Contact } from "@/lib/types";

export const runtime = "nodejs";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// A reply containing any of these is an opt-out — honour it automatically.
const OPT_OUT_PATTERNS = [
  "unsubscribe", "stop emailing", "stop contacting", "remove me from",
  "take me off", "don't email me", "do not email me", "opt me out", "no more emails",
];

function isOptOut(replies: { subject: string; snippet: string }[]): boolean {
  return replies.some(r => {
    const text = `${r.subject} ${r.snippet}`.toLowerCase();
    return OPT_OUT_PATTERNS.some(p => text.includes(p));
  });
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
  const { data: due, error } = await db
    .from("sequence_contacts")
    .select("*")
    .eq("status", "active")
    .lte("next_send_at", now.toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!due || due.length === 0) return NextResponse.json({ sent: 0 });

  let sent = 0;
  let failed = 0;

  // Cache: campaign rows, user sent-today counts, per-user suppression lists
  const campaignCache: Record<string, Record<string, unknown>> = {};
  const userSentToday: Record<string, number> = {};
  const suppressedCache: Record<string, Set<string>> = {};
  const accountCache: Record<string, { email: string; nylas_grant_id: string | null; connected_at: string | null } | null> = {};

  for (const row of due) {
    try {
      // Never email anyone on the user's do-not-contact list
      if (!(row.user_id in suppressedCache)) {
        suppressedCache[row.user_id] = await getSuppressedSet(row.user_id);
      }
      if (suppressedCache[row.user_id].has(row.contact_email.toLowerCase())) {
        await db.from("sequence_contacts").update({ status: "suppressed" }).eq("id", row.id);
        continue;
      }
      // Fetch + cache campaign
      if (!campaignCache[row.campaign_id]) {
        const { data: c } = await db
          .from("campaigns")
          .select("subject, body, steps, status, emails_per_day, send_window_start, send_window_end, send_days")
          .eq("id", row.campaign_id)
          .single();
        if (!c) continue;
        campaignCache[row.campaign_id] = c as Record<string, unknown>;
      }
      const campaignRow = campaignCache[row.campaign_id];

      // Skip paused campaigns
      if (campaignRow.status === "paused") continue;

      // Check send window
      const windowStart = (campaignRow.send_window_start as number) ?? 8;
      const windowEnd = (campaignRow.send_window_end as number) ?? 18;
      const sendDays = (campaignRow.send_days as string[]) || ["Mon", "Tue", "Wed", "Thu", "Fri"];
      const currentHour = now.getHours();
      const currentDay = DAY_NAMES[now.getDay()];

      if (!sendDays.includes(currentDay) || currentHour < windowStart || currentHour >= windowEnd) {
        continue; // Outside allowed window — skip this run
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
        continue;
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
        userSentToday[row.user_id] = count ?? 0;
      }
      if (userSentToday[row.user_id] >= dailyLimit) continue;

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
          continue;
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
          continue;
        }
        if (replied) {
          await db.from("sequence_contacts").update({ status: "replied" }).eq("id", row.id);
          // Reply → deal bridge: a genuine reply is a lead — surface it in the
          // pipeline automatically (the dashboard promises exactly this).
          try {
            const { data: existingDeal } = await db
              .from("deals")
              .select("id")
              .eq("user_id", row.user_id)
              .eq("contact_email", row.contact_email.toLowerCase())
              .limit(1);
            if (!existingDeal || existingDeal.length === 0) {
              const nowIso = new Date().toISOString();
              await db.from("deals").insert({
                id: crypto.randomUUID(),
                user_id: row.user_id,
                contact_email: row.contact_email.toLowerCase(),
                contact_name: row.contact_name ?? "",
                company: row.contact_company ?? "",
                status: "replied",
                notes: "Auto-created — replied to your campaign",
                created_at: nowIso,
                updated_at: nowIso,
              });
            }
          } catch {
            // deal creation is best-effort; never block the send loop
          }
          continue;
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
          .update({ current_step: nextStep, next_send_at: nextSendAt, last_message_id: messageId })
          .eq("id", row.id);
      }

      userSentToday[row.user_id] = (userSentToday[row.user_id] ?? 0) + 1;
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}
