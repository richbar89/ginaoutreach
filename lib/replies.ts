// Shared reply-handling logic — used by the sequences cron (polling sweep)
// and the Nylas webhook (real-time) so both paths behave identically.

import { getSupabaseAdmin } from "@/lib/supabase";
import { suppress } from "@/lib/suppression";
import { AUTO_REPLY_SUBJECTS } from "@/lib/nylas";

// A reply containing any of these is an opt-out — honour it automatically.
export const OPT_OUT_PATTERNS = [
  "unsubscribe", "stop emailing", "stop contacting", "remove me from",
  "take me off", "don't email me", "do not email me", "opt me out", "no more emails",
];

export function isOptOutText(text: string): boolean {
  const t = text.toLowerCase();
  return OPT_OUT_PATTERNS.some(p => t.includes(p));
}

export function isOptOut(replies: { subject: string; snippet: string }[]): boolean {
  return replies.some(r => isOptOutText(`${r.subject} ${r.snippet}`));
}

export type SequenceRow = {
  id: string; user_id: string; contact_email: string;
  contact_name: string | null; contact_company: string | null; created_at: string;
};

/** A genuine reply is a lead — surface it in the pipeline (deduped by email). */
export async function createDealFromReply(
  db: ReturnType<typeof getSupabaseAdmin>,
  row: SequenceRow
): Promise<void> {
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
    // deal creation is best-effort; never block the caller
  }
}

/**
 * Handle an incoming message for a grant: if the sender is a campaign
 * contact, mark their sequences replied (or suppressed on opt-out) and
 * create the pipeline deal. Safe to call for any inbound message.
 */
export async function processIncomingReply(
  grantId: string,
  fromEmail: string,
  subject: string,
  snippet: string
): Promise<{ handled: boolean }> {
  // Out-of-office / auto-replies must not cancel sequences or create deals
  const subjectLower = subject.toLowerCase();
  if (AUTO_REPLY_SUBJECTS.some(p => subjectLower.includes(p))) {
    return { handled: false };
  }

  const db = getSupabaseAdmin();

  const { data: account } = await db
    .from("user_email_accounts")
    .select("user_id, email")
    .eq("nylas_grant_id", grantId)
    .single();
  if (!account?.user_id) return { handled: false };
  // Ignore the user's own outbound mail
  if (fromEmail.toLowerCase() === (account.email as string | null)?.toLowerCase()) {
    return { handled: false };
  }

  const { data: rows } = await db
    .from("sequence_contacts")
    .select("*")
    .eq("user_id", account.user_id)
    .in("status", ["active", "completed"])
    .ilike("contact_email", fromEmail.toLowerCase());
  if (!rows || rows.length === 0) return { handled: false };

  if (isOptOutText(`${subject} ${snippet}`)) {
    await suppress(account.user_id as string, fromEmail, "reply opt-out");
    for (const row of rows) {
      await db.from("sequence_contacts").update({ status: "suppressed" }).eq("id", row.id);
    }
    return { handled: true };
  }

  for (const row of rows) {
    await db.from("sequence_contacts").update({ status: "replied" }).eq("id", row.id);
  }
  await createDealFromReply(db, rows[0] as SequenceRow);
  return { handled: true };
}
