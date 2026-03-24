import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const company = req.nextUrl.searchParams.get("company");
  if (!company) {
    return NextResponse.json({ error: "Missing company param" }, { status: 400 });
  }

  const accessToken =
    process.env.META_ACCESS_TOKEN ||
    (process.env.META_APP_ID && process.env.META_APP_SECRET
      ? `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`
      : null);

  if (!accessToken) {
    return NextResponse.json(
      { error: "META_ACCESS_TOKEN not configured in environment" },
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
    access_token: accessToken,
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
