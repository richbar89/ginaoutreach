export type AdStatus = {
  hasAds: boolean;
  count: number;
  checkedAt: string;
};

/** Fetch all cached statuses from Supabase via the API route. */
export async function getAllCachedStatuses(): Promise<Record<string, AdStatus>> {
  try {
    const res = await fetch("/api/ads/statuses");
    if (!res.ok) return {};
    return res.json();
  } catch {
    return {};
  }
}

/** Check a single company against the Meta Ad Library and persist the result. */
export async function checkCompanyAds(company: string): Promise<AdStatus> {
  // Resolve page ID first (cached server-side in Supabase)
  const pageRes = await fetch(`/api/meta-page-lookup?company=${encodeURIComponent(company)}`);
  const pageData = await pageRes.json();
  const pageId: string | null = pageData.pageId ?? null;

  const url = pageId
    ? `/api/meta-ads?company=${encodeURIComponent(company)}&pageId=${encodeURIComponent(pageId)}`
    : `/api/meta-ads?company=${encodeURIComponent(company)}`;

  const res = await fetch(url);
  const data = await res.json();
  if (data.error) throw new Error(data.error);

  // The API route writes to Supabase automatically — just return the status.
  return {
    hasAds: data.hasAds,
    count: data.count,
    checkedAt: new Date().toISOString(),
  };
}
