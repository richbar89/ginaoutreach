import { requireAdmin } from "@/lib/adminAuth";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// Admin-triggered scan — proxies to the cron route server-side so the
// cron secret never leaves the server (it was previously NEXT_PUBLIC).
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const secret = process.env.CRON_SECRET;
  if (!secret) return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });

  const url = new URL("/api/cron/meta-scan", req.nextUrl.origin);
  url.searchParams.set("secret", secret);
  const res = await fetch(url, { cache: "no-store" });
  return NextResponse.json(await res.json(), { status: res.status });
}
