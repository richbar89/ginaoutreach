import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const flaggedOnly = searchParams.get("flagged") === "1";
  const handle = searchParams.get("handle");
  const mediaType = searchParams.get("mediaType");
  const days = parseInt(searchParams.get("days") || "14");

  const since = new Date(Date.now() - days * 86_400_000).toISOString();

  const sb = getSupabase();
  let query = sb
    .from("trend_posts")
    .select("*")
    .gte("posted_at", since)
    .order("viral_score", { ascending: false })
    .limit(500);

  if (flaggedOnly) query = query.eq("flagged", true);
  if (handle) query = query.eq("influencer_handle", handle);
  if (mediaType) query = query.eq("media_type", mediaType);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function PATCH(req: NextRequest) {
  const { id, notes } = await req.json();
  const sb = getSupabase();
  const { data, error } = await sb
    .from("trend_posts")
    .update({ notes })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
