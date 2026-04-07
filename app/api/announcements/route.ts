import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json(null);

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("announcements")
    .select("id, message, type")
    .eq("active", true)
    .or("expires_at.is.null,expires_at.gt." + new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json(data);
}
