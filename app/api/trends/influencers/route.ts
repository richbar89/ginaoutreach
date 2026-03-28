import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("trend_influencers")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const { handle, followers, niche } = await req.json();
  if (!handle?.trim()) {
    return NextResponse.json({ error: "handle required" }, { status: 400 });
  }

  const clean = handle.trim().toLowerCase().replace(/^@/, "");
  const sb = getSupabase();
  const { data, error } = await sb
    .from("trend_influencers")
    .insert({ handle: clean, followers: followers || null, niche: niche || null })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest) {
  const { handle, followers } = await req.json();
  const sb = getSupabase();
  const { data, error } = await sb
    .from("trend_influencers")
    .update({ followers })
    .eq("handle", handle)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest) {
  const { handle } = await req.json();
  const sb = getSupabase();
  const { error } = await sb
    .from("trend_influencers")
    .delete()
    .eq("handle", handle);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
