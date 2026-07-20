// Suppression list — contacts who must never be emailed again.
// Server-side only (service role); RLS keeps clients out of the table.

import { getSupabaseAdmin } from "@/lib/supabase";

export async function getSuppressedSet(userId: string): Promise<Set<string>> {
  const db = getSupabaseAdmin();
  const { data, error } = await db.from("suppression_list").select("email").eq("user_id", userId);
  // Fail CLOSED: if we can't read the do-not-contact list, we must not send
  if (error) throw new Error(`Suppression list unavailable: ${error.message}`);
  return new Set((data ?? []).map(r => (r.email as string).toLowerCase()));
}

export async function isSuppressed(userId: string, email: string): Promise<boolean> {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("suppression_list")
    .select("email")
    .eq("user_id", userId)
    .eq("email", email.toLowerCase())
    .limit(1);
  return Boolean(data && data.length > 0);
}

/** Add to the suppression list and cancel any active sequences for them. */
export async function suppress(userId: string, email: string, reason = "requested"): Promise<void> {
  const db = getSupabaseAdmin();
  const normalised = email.toLowerCase();
  await db.from("suppression_list").upsert({ user_id: userId, email: normalised, reason });
  await db
    .from("sequence_contacts")
    .update({ status: "suppressed" })
    .eq("user_id", userId)
    .eq("status", "active")
    .ilike("contact_email", normalised);
}

export async function unsuppress(userId: string, email: string): Promise<void> {
  const db = getSupabaseAdmin();
  await db.from("suppression_list").delete().eq("user_id", userId).eq("email", email.toLowerCase());
}
