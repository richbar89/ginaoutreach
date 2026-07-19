// Server-side health check for the Meta Ad Library integration.
// Reports token validity, actual Ad Library access, and days until expiry
// so the token can never silently die again.

export type MetaHealth = {
  ok: boolean;             // token valid AND Ad Library responding
  tokenValid: boolean;
  adLibraryOk: boolean;
  expiresAt: string | null; // ISO, null = never/unknown
  daysLeft: number | null;
  error?: string;
};

export async function checkMetaHealth(): Promise<MetaHealth> {
  const token = process.env.META_ACCESS_TOKEN;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!token) {
    return { ok: false, tokenValid: false, adLibraryOk: false, expiresAt: null, daysLeft: null, error: "META_ACCESS_TOKEN not configured" };
  }

  let tokenValid = false;
  let expiresAt: string | null = null;
  let daysLeft: number | null = null;
  let error: string | undefined;

  // Token validity + expiry via debug_token (needs app credentials)
  if (appId && appSecret) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(token)}&access_token=${appId}|${appSecret}`,
        { cache: "no-store" }
      );
      const { data } = await res.json();
      tokenValid = Boolean(data?.is_valid);
      const exp: number | undefined = data?.expires_at;
      if (exp && exp > 0) {
        expiresAt = new Date(exp * 1000).toISOString();
        daysLeft = Math.floor((exp * 1000 - Date.now()) / 86400000);
      }
      if (!tokenValid) error = data?.error?.message || "Token invalid or expired";
    } catch (e) {
      error = String(e);
    }
  } else {
    tokenValid = true; // can't inspect without app creds — rely on the probe below
  }

  // Live Ad Library probe — the thing that actually matters
  let adLibraryOk = false;
  try {
    const params = new URLSearchParams({
      search_terms: "nike",
      ad_reached_countries: '["GB"]',
      ad_type: "ALL",
      ad_active_status: "ACTIVE",
      fields: "id",
      limit: "1",
      access_token: token,
    });
    const res = await fetch(`https://graph.facebook.com/v21.0/ads_archive?${params}`, { cache: "no-store" });
    const json = await res.json();
    adLibraryOk = !json.error;
    if (json.error) error = json.error.error_user_msg || json.error.message;
  } catch (e) {
    error = String(e);
  }

  return { ok: tokenValid && adLibraryOk, tokenValid, adLibraryOk, expiresAt, daysLeft, error };
}
