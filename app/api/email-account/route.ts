import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { getAccountForUser, revokeGrant } from "@/lib/nylas";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getAccountForUser(userId);
  if (!account) return NextResponse.json(null);
  return NextResponse.json({ email: account.email });
}

export async function DELETE() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const account = await getAccountForUser(userId);
  if (account) await revokeGrant(account.grantId);

  const db = getSupabaseAdmin();
  const { error } = await db.from("user_email_accounts").delete().eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
