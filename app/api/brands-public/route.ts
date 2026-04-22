import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Email providers that aren't company domains
const GENERIC_DOMAINS = new Set([
  "gmail.com","yahoo.com","hotmail.com","outlook.com","icloud.com",
  "me.com","aol.com","live.com","msn.com","protonmail.com",
  "googlemail.com","ymail.com","mail.com","zoho.com",
]);

export async function GET() {
  const { data, error } = await supabase
    .from("uploaded_contacts")
    .select("company, category, country, email")
    .not("company", "is", null)
    .neq("company", "")
    .limit(500);

  if (error) {
    console.error("[brands-public] Supabase error:", error.message, error.details, error.hint);
    return NextResponse.json({ brands: [], error: error.message });
  }

  const DOMAIN_RE = /^[a-z0-9][a-z0-9-]*\.[a-z]{2,}(\.[a-z]{2,})?$/i;

  function resolveDomain(company: string, email: string): string {
    // Company field already is a domain (e.g. "nike.com")
    if (DOMAIN_RE.test(company.trim())) return company.trim().toLowerCase();
    // Otherwise derive from email
    const emailDomain = email?.split("@")[1]?.toLowerCase().trim() ?? "";
    return emailDomain && !GENERIC_DOMAINS.has(emailDomain) ? emailDomain : "";
  }

  const seen = new Set<string>();
  const brands: { name: string; category: string; country: string; domain: string }[] = [];

  for (const row of data ?? []) {
    const name = row.company?.trim();
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      brands.push({
        name,
        category: row.category ?? "",
        country: row.country ?? "",
        domain: resolveDomain(name, row.email ?? ""),
      });
    }
  }

  // Shuffle for variety on each page load
  for (let i = brands.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [brands[i], brands[j]] = [brands[j], brands[i]];
  }

  // Resolve missing domains server-side via Clearbit autocomplete.
  // Server→Clearbit has no CORS restrictions; browser→Clearbit is blocked.
  const unresolved = brands.filter(b => !b.domain).slice(0, 60);
  if (unresolved.length > 0) {
    await Promise.allSettled(
      unresolved.map(async (b) => {
        try {
          const res = await fetch(
            `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(b.name)}`,
            { signal: AbortSignal.timeout(2000) }
          );
          const results = await res.json() as Array<{ domain: string }>;
          if (results[0]?.domain) b.domain = results[0].domain;
        } catch { /* timeout or API unavailable — stays as initials */ }
      })
    );
  }

  return NextResponse.json({ brands: brands.slice(0, 120) });
}
