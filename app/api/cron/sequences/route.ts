import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import nodemailer from "nodemailer";
import { ImapFlow } from "imapflow";
import { applyMerge } from "@/lib/storage";
import type { CampaignStep, Contact } from "@/lib/types";

export const runtime = "nodejs";

const DAILY_LIMIT = 25;

const AUTO_REPLY_SUBJECTS = [
  "out of office", "automatic reply", "auto-reply", "autoreply",
  "on vacation", "away from", "on annual leave", "on leave",
  "i am away", "i'm away", "i am out", "i'm out", "be back",
];

async function hasReplied(gmailEmail: string, appPassword: string, fromAddress: string, since: Date): Promise<boolean> {
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

      // Fetch subjects to filter out OOF / auto-replies
      for await (const msg of client.fetch(uids, { envelope: true })) {
        const subject = (msg.envelope?.subject ?? "").toLowerCase();
        const isAutoReply = AUTO_REPLY_SUBJECTS.some(s => subject.includes(s));
        if (!isAutoReply) return true; // At least one genuine reply
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

  // Find all sequence contacts due to receive their next step
  const { data: due, error } = await db
    .from("sequence_contacts")
    .select("*")
    .eq("status", "active")
    .lte("next_send_at", new Date().toISOString());

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!due || due.length === 0) return NextResponse.json({ sent: 0 });

  let sent = 0;
  let failed = 0;

  // Track how many emails each user has sent today (manual + sequence)
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const userSentToday: Record<string, number> = {};

  for (const row of due) {
    try {
      // Check daily limit for this user
      if (!(row.user_id in userSentToday)) {
        const { count } = await db
          .from("email_log")
          .select("*", { count: "exact", head: true })
          .eq("user_id", row.user_id)
          .gte("sent_at", startOfDay.toISOString());
        userSentToday[row.user_id] = count ?? 0;
      }
      if (userSentToday[row.user_id] >= DAILY_LIMIT) continue;
      // Get campaign to find the step content
      const { data: campaignRow } = await db
        .from("campaigns")
        .select("steps, subject")
        .eq("id", row.campaign_id)
        .single();

      const steps: CampaignStep[] = campaignRow?.steps ?? [];
      const stepIndex = row.current_step - 2; // current_step=2 means steps[0]

      if (stepIndex < 0 || stepIndex >= steps.length) {
        // No more steps — mark complete
        await db.from("sequence_contacts").update({ status: "completed" }).eq("id", row.id);
        continue;
      }

      const step = steps[stepIndex];

      // Get Gmail credentials for this user
      const { data: emailAccount } = await db
        .from("user_email_accounts")
        .select("gmail_email, app_password")
        .eq("user_id", row.user_id)
        .single();

      if (!emailAccount) {
        await db.from("sequence_contacts").update({ status: "error" }).eq("id", row.id);
        continue;
      }

      // Check for a reply — if they've replied, stop the sequence
      const enrolledAt = new Date(row.created_at);
      const replied = await hasReplied(emailAccount.gmail_email, emailAccount.app_password, row.contact_email, enrolledAt);
      if (replied) {
        await db.from("sequence_contacts").update({ status: "replied" }).eq("id", row.id);
        continue;
      }

      const contact: Contact = {
        name: row.contact_name ?? "",
        email: row.contact_email,
        position: row.contact_position ?? "",
        company: row.contact_company ?? "",
      };

      const subject = applyMerge(
        step.subject || `Re: ${campaignRow?.subject ?? ""}`,
        contact
      );
      const body = applyMerge(step.body, contact);

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

      // Advance to next step or complete
      const nextStepIndex = stepIndex + 1;
      if (nextStepIndex >= steps.length) {
        await db.from("sequence_contacts").update({ status: "completed", current_step: row.current_step + 1 }).eq("id", row.id);
      } else {
        const nextSendAt = new Date(Date.now() + steps[nextStepIndex].delay_days * 86400000).toISOString();
        await db.from("sequence_contacts").update({
          current_step: row.current_step + 1,
          next_send_at: nextSendAt,
        }).eq("id", row.id);
      }

      userSentToday[row.user_id] = (userSentToday[row.user_id] ?? 0) + 1;
      sent++;
    } catch {
      failed++;
    }
  }

  return NextResponse.json({ sent, failed });
}
