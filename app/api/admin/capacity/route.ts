import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("creator_capacity")
    .select("*")
    .order("category");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}

export async function PUT(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const updates = await req.json() as { category: string; filled: number; cap: number }[];

  const db = getSupabaseAdmin();
  for (const u of updates) {
    const { error } = await db
      .from("creator_capacity")
      .update({ filled: u.filled, cap: u.cap, updated_at: new Date().toISOString() })
      .eq("category", u.category);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data } = await db.from("creator_capacity").select("*").order("category");
  return NextResponse.json(data || []);
}
