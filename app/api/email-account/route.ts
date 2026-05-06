import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("user_email_accounts")
    .select("gmail_email, app_password")
    .eq("user_id", userId)
    .single();

  if (error || !data) return NextResponse.json(null);
  return NextResponse.json({ email: data.gmail_email, appPassword: data.app_password });
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email, appPassword } = await req.json();
  if (!email?.trim() || !appPassword?.trim()) {
    return NextResponse.json({ error: "Email and app password required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { error } = await db
    .from("user_email_accounts")
    .upsert({ user_id: userId, gmail_email: email.trim(), app_password: appPassword.trim() }, { onConflict: "user_id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
