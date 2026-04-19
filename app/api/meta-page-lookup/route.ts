import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const PAGE_ID_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

export async function GET(req: NextRequest) {
  const company = req.nextUrl.searchParams.get("company");
  if (!company) {
    return NextResponse.json({ error: "Missing company param" }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  // Check Supabase cache first
  const { data: cached } = await supabase
    .from("meta_page_ids")
    .select("page_id, cached_at")
    .eq("company", company)
    .single();

  if (cached) {
    const age = Date.now() - new Date(cached.cached_at).getTime();
    if (age < PAGE_ID_TTL_MS) {
      return NextResponse.json({ pageId: cached.page_id });
    }
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

    const pageId = (() => {
      if (!pages.length) return null;
      const normCompany = normalize(company);
      const exact = pages.find((p) => normalize(p.name) === normCompany);
      const verified = pages.find(
        (p) => p.verification_status === "blue_verified" || p.verification_status === "gray_verified"
      );
      return (exact ?? verified ?? pages[0]).id;
    })();

    // Persist to Supabase
    await supabase.from("meta_page_ids").upsert({
      company,
      page_id: pageId,
      cached_at: new Date().toISOString(),
    });

    return NextResponse.json({ pageId });
  } catch {
    return NextResponse.json({ pageId: null, error: "Failed to reach Meta API" });
  }
}
