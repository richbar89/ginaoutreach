import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

// Public endpoint — no auth required (landing page reads this)
export async function GET() {
  const db = getSupabaseAdmin();
  const { data, error } = await db
    .from("creator_capacity")
    .select("category, label, emoji, filled, cap")
    .order("category");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
