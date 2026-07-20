import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { name, email, reason } = await req.json();
  if (!email?.trim()) return NextResponse.json({ error: "Email required" }, { status: 400 });

  // Strict address validation — no SQL wildcards (% _) can reach the delete,
  // so a single request can only ever remove one specific address.
  const cleaned = String(email).trim().toLowerCase();
  if (!/^[a-z0-9.+'-]+@[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(cleaned)) {
    return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
  }

  const db = getSupabaseAdmin();

  // Log the request
  await db.from("data_removal_requests").insert({
    name: name?.trim() || null,
    email: cleaned,
    reason: reason?.trim() || null,
  });

  // Remove from contacts database
  await db
    .from("uploaded_contacts")
    .delete()
    .ilike("email", cleaned);

  return NextResponse.json({ ok: true });
}
