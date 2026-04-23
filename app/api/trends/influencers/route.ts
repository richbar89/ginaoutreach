import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

async function requireAdmin() {
  const { userId } = await auth();
  if (!userId || userId !== ADMIN_USER_ID) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const err = await requireAdmin();
  if (err) return err;

  const sb = getSupabase();
  const { data, error } = await sb
    .from("trend_influencers")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const err = await requireAdmin();
  if (err) return err;

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
  const err = await requireAdmin();
  if (err) return err;

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
  const err = await requireAdmin();
  if (err) return err;

  const { handle } = await req.json();
  const sb = getSupabase();
  const { error } = await sb
    .from("trend_influencers")
    .delete()
    .eq("handle", handle);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
