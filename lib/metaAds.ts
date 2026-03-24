const CACHE_KEY = "meta_ads_cache";
const PAGE_ID_CACHE_KEY = "meta_page_id_cache";
const TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const PAGE_ID_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type AdStatus = {
  hasAds: boolean;
  count: number;
  checkedAt: string;
};

type Cache = Record<string, AdStatus>;
type PageIdCache = Record<string, { pageId: string | null; cachedAt: string }>;

function getCache(): Cache {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveCache(cache: Cache) {
  localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
}

function getPageIdCache(): PageIdCache {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(PAGE_ID_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePageIdCache(cache: PageIdCache) {
  localStorage.setItem(PAGE_ID_CACHE_KEY, JSON.stringify(cache));
}

export function getCachedAdStatus(company: string): AdStatus | null {
  const entry = getCache()[company];
  if (!entry) return null;
  const age = Date.now() - new Date(entry.checkedAt).getTime();
  return age > TTL_MS ? null : entry;
}

export function getAllCachedStatuses(): Record<string, AdStatus> {
  const cache = getCache();
  const now = Date.now();
  const valid: Record<string, AdStatus> = {};
  for (const [company, status] of Object.entries(cache)) {
    if (now - new Date(status.checkedAt).getTime() <= TTL_MS) {
      valid[company] = status;
    }
  }
  return valid;
}

async function getPageId(company: string): Promise<string | null> {
  // Check page ID cache first
  const pidCache = getPageIdCache();
  const cached = pidCache[company];
  if (cached) {
    const age = Date.now() - new Date(cached.cachedAt).getTime();
    if (age <= PAGE_ID_TTL_MS) return cached.pageId;
  }

  // Look up via API
  try {
    const res = await fetch(
      `/api/meta-page-lookup?company=${encodeURIComponent(company)}`
    );
    const data = await res.json();
    const pageId = data.pageId ?? null;

    // Cache result even if null (so we don't keep re-trying companies with no page)
    const newCache = getPageIdCache();
    newCache[company] = { pageId, cachedAt: new Date().toISOString() };
    savePageIdCache(newCache);

    return pageId;
  } catch {
    return null;
  }
}

export async function checkCompanyAds(company: string): Promise<AdStatus> {
  // Try to get the Facebook Page ID for an exact match
  const pageId = await getPageId(company);

  const url = pageId
    ? `/api/meta-ads?company=${encodeURIComponent(company)}&pageId=${encodeURIComponent(pageId)}`
    : `/api/meta-ads?company=${encodeURIComponent(company)}`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error);

  const status: AdStatus = {
    hasAds: data.hasAds,
    count: data.count,
    checkedAt: new Date().toISOString(),
  };

  const cache = getCache();
  cache[company] = status;
  saveCache(cache);

  return status;
}

export async function scanCompanies(
  companies: string[],
  onProgress: (done: number, total: number, current: string, error?: string) => void,
  signal: AbortSignal
): Promise<void> {
  const toCheck = companies.filter((c) => !getCachedAdStatus(c));

  for (let i = 0; i < toCheck.length; i++) {
    if (signal.aborted) break;
    const company = toCheck[i];
    let error: string | undefined;
    try {
      await checkCompanyAds(company);
    } catch (e) {
      error = e instanceof Error ? e.message : "Unknown error";
    }
    onProgress(i + 1, toCheck.length, company, error);
    if (i < toCheck.length - 1) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
}
