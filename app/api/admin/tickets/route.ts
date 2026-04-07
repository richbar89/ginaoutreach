import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function PATCH(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const { id, status, admin_notes } = await req.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("tickets")
    .update({ status, admin_notes, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
