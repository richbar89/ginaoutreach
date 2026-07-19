import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendMessage, textToHtml } from "@/lib/nylas";

export const dynamic = "force-dynamic";

// Favourites-first scanning: every user's tracked brands (10 max each) are
// kept fresh; everything else gets a small background trickle. This keeps
// Meta API volume proportional to users, not to the 10k-contact database.
const FAV_STALE_HOURS = 12;    // tracked brands re-scanned twice daily
const TRICKLE_LIMIT = 25;      // non-favourite companies per run, oldest first
const STALE_HOURS = 48;        // staleness threshold for the trickle
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
  const favStaleThreshold = new Date(Date.now() - FAV_STALE_HOURS * 3_600_000).toISOString();
  const staleThreshold = new Date(Date.now() - STALE_HOURS * 3_600_000).toISOString();

  // Every user's tracked brands — the priority scan set
  const { data: settingsRows } = await supabase
    .from("user_settings")
    .select("user_id, fav_brands");

  const favByUser = new Map<string, string[]>();
  for (const row of settingsRows ?? []) {
    const favs = (row.fav_brands as string[] | null) ?? [];
    if (row.user_id && favs.length > 0) favByUser.set(row.user_id as string, favs);
  }
  const favSet = new Set<string>();
  for (const favs of favByUser.values()) for (const f of favs) favSet.add(f);

  // Background trickle candidates from the contacts DB
  const { data: contacts } = await supabase
    .from("uploaded_contacts")
    .select("company")
    .not("company", "is", null)
    .neq("company", "");

  const allCompanies = [...new Set((contacts ?? []).map((c: { company: string }) => c.company))];

  // Previous statuses — needed for staleness AND went-live transitions
  const { data: existing } = await supabase
    .from("meta_ad_statuses")
    .select("company, checked_at, has_ads");

  const statusMap = new Map(
    (existing ?? []).map((s: { company: string; checked_at: string; has_ads: boolean }) =>
      [s.company, { checkedAt: s.checked_at, hasAds: s.has_ads }] as const
    )
  );

  const favToScan = [...favSet].filter((c) => {
    const s = statusMap.get(c);
    return !s || s.checkedAt < favStaleThreshold;
  });

  const trickle = allCompanies
    .filter((c) => !favSet.has(c))
    .filter((c) => {
      const s = statusMap.get(c);
      return !s || s.checkedAt < staleThreshold;
    })
    .sort((a, b) => (statusMap.get(a)?.checkedAt ?? "").localeCompare(statusMap.get(b)?.checkedAt ?? ""))
    .slice(0, TRICKLE_LIMIT);

  const toScan = [...favToScan, ...trickle];

  let processed = 0;
  let errors = 0;
  const wentLive: string[] = [];

  for (const company of toScan) {
    try {
      const pageId = await resolvePageId(company, accessToken, supabase);
      await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));

      const result = await checkAds(company, pageId, accessToken);
      await new Promise((r) => setTimeout(r, REQUEST_DELAY_MS));

      // A brand flipping from "no ads" to "live" is the product's magic moment
      const prev = statusMap.get(company);
      if (prev?.hasAds === false && result.hasAds && favSet.has(company)) {
        wentLive.push(company);
      }

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

  // Alert each user whose tracked brands just went live — one digest email,
  // sent to themselves through their own connected inbox.
  let alertsSent = 0;
  if (wentLive.length > 0) {
    for (const [uid, favs] of favByUser.entries()) {
      const hits = favs.filter((f) => wentLive.includes(f));
      if (hits.length === 0) continue;
      try {
        const { data: account } = await supabase
          .from("user_email_accounts")
          .select("email, nylas_grant_id")
          .eq("user_id", uid)
          .single();
        if (!account?.nylas_grant_id || !account?.email) continue;

        const subject = hits.length === 1
          ? `🔴 ${hits[0]} just went live on Meta ads`
          : `🔴 ${hits.length} of your brands just went live on Meta ads`;
        const lines = [
          hits.length === 1
            ? `${hits[0]} has started running Meta ads — their marketing budget is open right now.`
            : `These brands you track have started running Meta ads:\n\n${hits.map(h => `• ${h}`).join("\n")}`,
          ``,
          `This is your window to pitch. Find the right contact:`,
          `https://collabi.io/contacts?q=${encodeURIComponent(hits[0])}`,
          ``,
          `— Collabi Ad Signals`,
        ].join("\n");

        await sendMessage(account.nylas_grant_id as string, {
          to: { email: account.email as string },
          subject,
          htmlBody: textToHtml(lines),
        });
        alertsSent++;
      } catch {
        // alerting is best-effort; never fail the scan
      }
    }
  }

  return NextResponse.json({
    message: "Scan complete",
    processed,
    errors,
    favourites: favSet.size,
    favouritesScanned: favToScan.length,
    trickleScanned: trickle.length,
    wentLive,
    alertsSent,
  });
}
