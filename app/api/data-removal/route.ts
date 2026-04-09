import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { name, email, reason } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const db = getSupabaseAdmin();

  // Log the request
  await db.from("data_removal_requests").insert({
    name: name?.trim() || null,
    email: email.trim().toLowerCase(),
    reason: reason?.trim() || null,
  });

  // Remove from contacts database
  await db
    .from("uploaded_contacts")
    .delete()
    .ilike("email", email.trim());

  return NextResponse.json({ ok: true });
}
