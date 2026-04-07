import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("error_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(500);

  return NextResponse.json(data || []);
}

export async function PATCH(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const { id, resolved } = await req.json();
  const db = getSupabaseAdmin();

  if (id) {
    await db.from("error_logs").update({ resolved }).eq("id", id);
  } else {
    // Mark all resolved
    await db.from("error_logs").update({ resolved: true }).eq("resolved", false);
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const db = getSupabaseAdmin();
  await db.from("error_logs").delete().eq("resolved", true);

  return NextResponse.json({ ok: true });
}
