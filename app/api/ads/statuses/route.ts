import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await getSupabaseAdmin()
    .from("meta_ad_statuses")
    .select("company, has_ads, ad_count, checked_at");

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const result: Record<string, { hasAds: boolean; count: number; checkedAt: string }> = {};
  for (const row of data ?? []) {
    result[row.company] = {
      hasAds: row.has_ads,
      count: row.ad_count,
      checkedAt: row.checked_at,
    };
  }
  return NextResponse.json(result);
}
