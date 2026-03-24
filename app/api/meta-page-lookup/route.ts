import { NextRequest, NextResponse } from "next/server";

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

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
    type: "page",
    q: company,
    fields: "id,name,verification_status,fan_count",
    limit: "10",
    access_token: accessToken,
  });

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/search?${params}`,
      { cache: "no-store" }
    );
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ pageId: null, error: data.error.message });
    }

    const pages: { id: string; name: string; verification_status?: string; fan_count?: number }[] =
      data.data ?? [];

    if (pages.length === 0) {
      return NextResponse.json({ pageId: null });
    }

    const normCompany = normalize(company);

    // Prefer verified pages, then exact name match, then closest match
    const exact = pages.find((p) => normalize(p.name) === normCompany);
    const verified = pages.find(
      (p) => p.verification_status === "blue_verified" || p.verification_status === "gray_verified"
    );
    const best = exact ?? verified ?? pages[0];

    return NextResponse.json({ pageId: best.id, pageName: best.name });
  } catch {
    return NextResponse.json({ pageId: null, error: "Failed to reach Meta API" });
  }
}
