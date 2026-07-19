import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { checkMetaHealth } from "@/lib/metaHealth";

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
  const h = await checkMetaHealth();
  return {
    ok: h.ok,
    error: h.ok ? undefined : h.error,
    expiresAt: h.expiresAt,
    daysLeft: h.daysLeft,
    adLibraryOk: h.adLibraryOk,
    tokenValid: h.tokenValid,
  };
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
