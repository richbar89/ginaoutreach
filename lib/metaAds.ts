const CACHE_KEY = "meta_ads_cache";
const TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days

export type AdStatus = {
  hasAds: boolean;
  count: number;
  checkedAt: string;
};

type Cache = Record<string, AdStatus>;

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

export async function checkCompanyAds(company: string): Promise<AdStatus> {
  const res = await fetch(`/api/meta-ads?company=${encodeURIComponent(company)}`);
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
  onProgress: (done: number, total: number, current: string) => void,
  signal: AbortSignal
): Promise<void> {
  // Only check companies with no valid cache entry
  const toCheck = companies.filter((c) => !getCachedAdStatus(c));

  for (let i = 0; i < toCheck.length; i++) {
    if (signal.aborted) break;
    const company = toCheck[i];
    try {
      await checkCompanyAds(company);
    } catch {
      // Silently skip failures — don't block the scan
    }
    onProgress(i + 1, toCheck.length, company);
    if (i < toCheck.length - 1) {
      await new Promise((r) => setTimeout(r, 250));
    }
  }
}
