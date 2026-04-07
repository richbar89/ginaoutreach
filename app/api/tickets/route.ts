import { auth, currentUser } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("tickets")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await currentUser();
  const userEmail = user?.emailAddresses?.[0]?.emailAddress || "";

  const { brand_name, brand_url, notes } = await req.json();
  if (!brand_name || !brand_url) {
    return NextResponse.json({ error: "brand_name and brand_url are required" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const { data, error } = await db.from("tickets").insert({
    user_id: userId,
    user_email: userEmail,
    brand_name: brand_name.trim(),
    brand_url: brand_url.trim(),
    notes: notes?.trim() || null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
