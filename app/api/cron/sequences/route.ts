import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { applyMerge } from "@/lib/storage";
import type { CampaignStep, Contact } from "@/lib/types";

export const runtime = "nodejs";

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const AUTO_REPLY_SUBJECTS = [
  "out of office", "automatic reply", "auto-reply", "autoreply",
  "on vacation", "away from", "on annual leave", "on leave",
  "i am away", "i'm away", "i am out", "i'm out", "be back",
];

async function hasReplied(
  gmailEmail: string,
  appPassword: string,
  fromAddress: string,
  since: Date
): Promise<boolean> {
  const client = new ImapFlow({
    host: "imap.gmail.com", port: 993, secure: true,
    auth: { user: gmailEmail, pass: appPassword },
    logger: false,
  });
  try {
    await client.connect();
    const lock = await client.getMailboxLock("INBOX");
    try {
      const uids = await client.search({ from: fromAddress, since });
      if (!Array.isArray(uids) || uids.length === 0) return false;
      for await (const msg of client.fetch(uids, { envelope: true })) {
        const subject = (msg.envelope?.subject ?? "").toLowerCase();
        const isAutoReply = AUTO_REPLY_SUBJECTS.some((s) => subject.includes(s));
        if (!isAutoReply) return true;
      }
      return false;
    } finally {
      lock.release();
    }
  } catch {
    return false;
  } finally {
    await client.logout().catch(() => {});
  }
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

  // Cache: campaign rows and user sent-today counts
  const campaignCache: Record<string, Record<string, unknown>> = {};
  const userSentToday: Record<string, number> = {};

  for (const row of due) {
    try {
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

      // Check per-user daily limit using campaign's emails_per_day setting
      const dailyLimit = (campaignRow.emails_per_day as number) || 25;
      if (!(row.user_id in userSentToday)) {
        const { count } = await db
          .from("email_log")
          .select("*", { count: "exact", head: true })
          .eq("user_id", row.user_id)
          .gte("sent_at", startOfDay.toISOString());
        userSentToday[row.user_id] = count ?? 0;
      }
      if (userSentToday[row.user_id] >= dailyLimit) continue;

      // Get Gmail credentials
      const { data: emailAccount } = await db
        .from("user_email_accounts")
        .select("gmail_email, app_password")
        .eq("user_id", row.user_id)
        .single();

      if (!emailAccount) {
        await db.from("sequence_contacts").update({ status: "error" }).eq("id", row.id);
        continue;
      }

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
        const replied = await hasReplied(
          emailAccount.gmail_email,
          emailAccount.app_password,
          row.contact_email,
          enrolledAt
        );
        if (replied) {
          await db.from("sequence_contacts").update({ status: "replied" }).eq("id", row.id);
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

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: emailAccount.gmail_email, pass: emailAccount.app_password },
      });

      await transporter.sendMail({
        from: emailAccount.gmail_email,
        to: row.contact_email,
        subject,
        text: body,
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
          .update({ status: "completed", current_step: nextStep })
          .eq("id", row.id);
      } else {
        const nextSendAt = new Date(
          Date.now() + steps[nextStepIndex].delay_days * 86400000
        ).toISOString();
        await db
          .from("sequence_contacts")
          .update({ current_step: nextStep, next_send_at: nextSendAt })
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
