import { NextRequest, NextResponse } from "next/server";
import { getSupabase, getSupabaseAdmin } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";

// POST — save a snapshot, return a shareable token
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const data = await req.json();
  const token = crypto.randomUUID().replace(/-/g, "").slice(0, 12);
  const supabase = getSupabaseAdmin();

  const { error } = await supabase
    .from("media_kit_links")
    .insert({ id: token, data });

  if (error) {
    // If table doesn't exist yet, return a helpful message
    if (error.code === "42P01") {
      return NextResponse.json(
        { error: "Run this SQL in Supabase first:\nCREATE TABLE media_kit_links (id text PRIMARY KEY, data jsonb NOT NULL, created_at timestamptz DEFAULT now());\nGRANT ALL ON TABLE media_kit_links TO anon;" },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ token });
}

// GET ?token=xxx — fetch a snapshot for the public page
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("media_kit_links")
    .select("data")
    .eq("id", token)
    .single();

  if (error || !data) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(data.data);
}
