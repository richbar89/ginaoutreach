import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const company = req.nextUrl.searchParams.get("company");
  if (!company) {
    return NextResponse.json({ error: "Missing company param" }, { status: 400 });
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!appId || !appSecret) {
    return NextResponse.json(
      { error: "META_APP_ID / META_APP_SECRET not configured in environment" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    search_terms: company,
    ad_reached_countries: '["GB"]',
    ad_type: "ALL",
    ad_active_status: "ACTIVE",
    fields: "id,page_name,ad_snapshot_url",
    limit: "5",
    access_token: `${appId}|${appSecret}`,
  });

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/ads_archive?${params}`,
      { cache: "no-store" }
    );
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 });
    }

    return NextResponse.json({
      hasAds: Array.isArray(data.data) && data.data.length > 0,
      count: data.data?.length ?? 0,
      ads: data.data ?? [],
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach Meta API" }, { status: 500 });
  }
}
