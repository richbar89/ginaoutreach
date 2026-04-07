import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";

async function checkSupabase() {
  try {
    const db = getSupabaseAdmin();
    const { error } = await db.from("announcements").select("id").limit(1);
    return { ok: !error, latencyMs: 0, error: error?.message };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function checkClerk() {
  try {
    const res = await fetch("https://api.clerk.com/v1/users?limit=1", {
      headers: { Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}` },
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

async function checkMetaApi() {
  const token = process.env.META_ACCESS_TOKEN;
  if (!token) return { ok: false, error: "META_ACCESS_TOKEN not configured" };
  try {
    const res = await fetch(`https://graph.facebook.com/v19.0/me?access_token=${token}`);
    const json = await res.json();
    return { ok: res.ok && !json.error, error: json.error?.message };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const [supabase, clerk, meta] = await Promise.all([
    checkSupabase(),
    checkClerk(),
    checkMetaApi(),
  ]);

  return NextResponse.json({
    supabase,
    clerk,
    meta,
    checkedAt: new Date().toISOString(),
  });
}
