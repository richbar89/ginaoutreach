import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Simple in-process cache — persists across requests in the same serverless instance
const cache = new Map<string, string>();

export async function GET(req: NextRequest) {
  const name = req.nextUrl.searchParams.get("name")?.trim() ?? "";
  if (!name) return NextResponse.json({ domain: "" });

  if (cache.has(name)) return NextResponse.json({ domain: cache.get(name) });

  try {
    const res = await fetch(
      `https://autocomplete.clearbit.com/v1/companies/suggest?query=${encodeURIComponent(name)}`,
      { signal: AbortSignal.timeout(2000) }
    );
    const results = await res.json() as Array<{ domain: string }>;
    const domain = results[0]?.domain ?? "";
    cache.set(name, domain);
    return NextResponse.json({ domain });
  } catch {
    cache.set(name, "");
    return NextResponse.json({ domain: "" });
  }
}
