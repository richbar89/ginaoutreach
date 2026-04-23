import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const BATCH_LIMIT = 200;       // companies per run (keeps runtime under ~3 min)
const STALE_HOURS = 48;        // re-scan companies older than this
const REQUEST_DELAY_MS = 300;  // pause between Meta API calls

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function isNameMatch(pageName: string, company: string): boolean {
  const a = normalize(pageName);
  const b = normalize(company);
  return a.includes(b) || b.includes(a);
}

async function resolvePageId(
  company: string,
  accessToken: string,
  supabase: ReturnType<typeof getSupabaseAdmin>
): Promise<string | null> {
  const TTL_MS = 30 * 24 * 60 * 60 * 1000;

  const { data: cached } = await supabase
    .from("meta_page_ids")
    .select("page_id, cached_at")
    .eq("company", company)
    .single();

  if (cached && Date.now() - new Date(cached.cached_at).getTime() < TTL_MS) {
    return cached.page_id;
  }

  const params = new URLSearchParams({
    type: "page", q: company,
    fields: "id,name,verification_status",
    limit: "10", access_token: accessToken,
  });

  try {
    const res = await fetch(`https://graph.facebook.com/v21.0/search?${params}`, { cache: "no-store" });
    const json = await res.json();
    const pages: { id: string; name: string; verification_status?: string }[] = json.data ?? [];

    const pageId = (() => {
      if (!pages.length) return null;
      const nc = normalize(company);
      const exact = pages.find((p) => normalize(p.name) === nc);
      const verified = pages.find((p) =>
        p.verification_status === "blue_verified" || p.verification_status === "gray_verified"
      );
      return (exact ?? verified ?? pages[0]).id;
    })();

    await supabase.from("meta_page_ids").upsert({
      company, page_id: pageId, cached_at: new Date().toISOString(),
    });
    return pageId;
  } catch {
    return null;
  }
}

async function checkAds(
  company: string,
  pageId: string | null,
  accessToken: string
): Promise<{ hasAds: boolean; count: number }> {
  const params = pageId
    ? new URLSearchParams({
        search_page_ids: pageId, ad_type: "ALL", ad_active_status: "ACTIVE",
        fields: "id,page_name", limit: "5", access_token: accessToken,
      })
    : new URLSearchParams({
        search_terms: company, ad_reached_countries: '["GB"]',
        ad_type: "ALL", ad_active_status: "ACTIVE",
        fields: "id,page_name", limit: "25", access_token: accessToken,
      });

  const res = await fetch(`https://graph.facebook.com/v21.0/ads_archive?${params}`, { cache: "no-store" });
  const json = await res.json();
  if (json.error) throw new Error(json.error.message);

  const ads: { page_name: string }[] = json.data ?? [];
  if (pageId) return { hasAds: ads.length > 0, count: ads.length };

  const matching = ads.filter((ad) => isNameMatch(ad.page_name, company));
  return { hasAds: matching.length > 0, count: matching.length };
}

export async function GET(req: NextRequest) {
  // Accept Vercel's Authorization header or a ?secret= query param
  const cronSecret = process.env.CRON_SECRET;
  {
    const auth = req.headers.get("authorization");
    const qs = req.nextUrl.searchParams.get("secret");
    if (!cronSecret || (auth !== `Bearer ${cronSecret}` && qs !== cronSecret)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const accessToken =
    process.env.META_ACCESS_TOKEN ||
    (process.env.META_APP_ID && process.env.META_APP_SECRET
      ? `${process.env.META_APP_ID}|${process.env.META_APP_SECRET}`
      : null);

  if (!accessToken) {
    return NextResponse.json({ error: "META_ACCESS_TOKEN not configured" }, { status: 500 });
  }

  const supabase = getSupabaseAdmin();
  const staleThreshold = new Date(Date.now() - STALE_HOURS * 3_600_000).toISOString();

  // Pull all distinct companies from contacts
  const { data: contacts } = await supabase
    .from("uploaded_contacts")
    .select("company")
    .not("company", "is", null)
    .neq("company", "");

  const allCompanies = [...new Set((contacts ?? []).map((c: { company: string }) => c.company))];

  if (!allCompanies.length) {
    return NextResponse.json({ message: "No companies found", processed: 0 });
  }

  // Find stale / unchecked companies, oldest first
  const { data: existing } = await supabase
    .from("meta_ad_statuses")
    .select("company, checked_at");

  const statusMap = new Map((existing ?? []).map((s: { company: string; checked_at: string }) => [s.company, s.checked_at]));

  const toScan = allCompanies
    .filter((c) => {
      const at = statusMap.get(c);
      return !at || at < staleThreshold;
    })
    .sort((a, b) => (statusMap.get(a) ?? "").localeCompare(statusMap.get(b) ?? ""))
    .slice(0, BATCH_LIMIT);

  let processed = 0;
  let errors = 0;

  for (const company of toScan) {
    try {
      const pageId = await resolvePageId(company, accessToken, supabase);
      await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));

      const result = await checkAds(company, pageId, accessToken);
      await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));

      await supabase.from("meta_ad_statuses").upsert({
        company,
        has_ads: result.hasAds,
        ad_count: result.count,
        checked_at: new Date().toISOString(),
      });

      processed++;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({
    message: "Scan complete",
    processed,
    errors,
    totalCompanies: allCompanies.length,
    remainingStale: toScan.length - processed,
  });
}
