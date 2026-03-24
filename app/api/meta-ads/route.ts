import { NextRequest, NextResponse } from "next/server";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function isNameMatch(pageName: string, company: string): boolean {
  const normPage = normalize(pageName);
  const normCompany = normalize(company);
  return normPage.includes(normCompany) || normCompany.includes(normPage);
}

export async function GET(req: NextRequest) {
  const company = req.nextUrl.searchParams.get("company");
  const pageId = req.nextUrl.searchParams.get("pageId");

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

  // If we have a page ID, use exact page search — 100% accurate
  if (pageId) {
    const params = new URLSearchParams({
      search_page_ids: pageId,
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
      const ads = data.data ?? [];
      return NextResponse.json({ hasAds: ads.length > 0, count: ads.length, ads });
    } catch {
      return NextResponse.json({ error: "Failed to reach Meta API" }, { status: 500 });
    }
  }

  // No page ID — keyword search with name-match filtering to remove false positives
  const params = new URLSearchParams({
    search_terms: company,
    ad_reached_countries: '["GB"]',
    ad_type: "ALL",
    ad_active_status: "ACTIVE",
    fields: "id,page_name,ad_snapshot_url",
    limit: "25",
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

    const allAds: { id: string; page_name: string; ad_snapshot_url: string }[] =
      data.data ?? [];
    const matchingAds = allAds.filter((ad) => isNameMatch(ad.page_name, company));

    return NextResponse.json({
      hasAds: matchingAds.length > 0,
      count: matchingAds.length,
      ads: matchingAds,
    });
  } catch {
    return NextResponse.json({ error: "Failed to reach Meta API" }, { status: 500 });
  }
}
