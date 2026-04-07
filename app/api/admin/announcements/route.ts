import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const { message, type, expires_at } = await req.json();
  if (!message) return NextResponse.json({ error: "message required" }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data, error } = await db.from("announcements").insert({
    message: message.trim(),
    type: type || "info",
    active: true,
    expires_at: expires_at || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const { id, active } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = getSupabaseAdmin();
  await db.from("announcements").update({ active }).eq("id", id);

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = getSupabaseAdmin();
  await db.from("announcements").delete().eq("id", id);

  return NextResponse.json({ ok: true });
}
