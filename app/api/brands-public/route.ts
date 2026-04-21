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
    return NextResponse.json({ brands: [] });
  }

  const seen = new Set<string>();
  const brands: { name: string; category: string; country: string; domain: string }[] = [];

  for (const row of data ?? []) {
    const name = row.company?.trim();
    if (name && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase());
      const emailDomain = row.email?.split("@")[1]?.toLowerCase().trim() ?? "";
      const domain = emailDomain && !GENERIC_DOMAINS.has(emailDomain) ? emailDomain : "";
      brands.push({
        name,
        category: row.category ?? "",
        country: row.country ?? "",
        domain,
      });
    }
  }

  // Shuffle for variety on each page load
  for (let i = brands.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [brands[i], brands[j]] = [brands[j], brands[i]];
  }

  return NextResponse.json({ brands: brands.slice(0, 120) });
}
