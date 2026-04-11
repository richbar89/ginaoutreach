import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { classifyCompanies, chunk } from "@/lib/classifyCompany";

const COMPANIES_PER_CALL = 50; // how many unique companies to classify per request

// GET — returns how many companies still need classification
export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const db = getSupabaseAdmin();

  const { count: total } = await db
    .from("uploaded_contacts")
    .select("*", { count: "exact", head: true });

  const { count: classified } = await db
    .from("uploaded_contacts")
    .select("*", { count: "exact", head: true })
    .eq("ai_classified", true);

  return NextResponse.json({ total: total ?? 0, classified: classified ?? 0 });
}

// POST — classify the next batch of unclassified companies
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const { vertical } = await req.json().catch(() => ({ vertical: null }));
  const db = getSupabaseAdmin();

  // Fetch unclassified contacts (up to 2000 to find 50 unique companies)
  const { data: contacts, error } = await db
    .from("uploaded_contacts")
    .select("id, company, category, industry:category, keywords:subcategory")
    .eq("ai_classified", false)
    .limit(2000);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!contacts || contacts.length === 0) {
    return NextResponse.json({ done: true, processed: 0, remaining: 0 });
  }

  // Deduplicate by company name — get first 50 unique companies
  const companyMap = new Map<string, { name: string; ids: string[]; category: string }>();
  for (const c of contacts) {
    if (!c.company) continue;
    const key = c.company.toLowerCase();
    if (!companyMap.has(key)) {
      companyMap.set(key, { name: c.company, ids: [], category: c.category || vertical || "" });
    }
    companyMap.get(key)!.ids.push(c.id);
    if (companyMap.size >= COMPANIES_PER_CALL) break;
  }

  if (companyMap.size === 0) {
    // No companies — mark remaining contacts (no company name) as classified
    const ids = contacts.slice(0, 500).map(c => c.id);
    await db.from("uploaded_contacts").update({ ai_classified: true }).in("id", ids);
    const remaining = contacts.length - ids.length;
    return NextResponse.json({ done: remaining === 0, processed: ids.length, remaining });
  }

  // Build company info for Claude
  const companyInfos = Array.from(companyMap.values()).map(c => ({
    name: c.name,
    industry: c.category || "",
    keywords: "",
    description: "",
  }));

  // Fetch keywords/description from DB for these companies
  const companyNames = companyInfos.map(c => c.name);
  const { data: companyData } = await db
    .from("uploaded_contacts")
    .select("company, subcategory")
    .in("company", companyNames)
    .limit(500);

  // Enrich with any available keyword data (stored in subcategory pre-classification)
  if (companyData) {
    for (const row of companyData) {
      if (!row.company) continue;
      const info = companyInfos.find(c => c.name.toLowerCase() === row.company.toLowerCase());
      if (info && row.subcategory) info.keywords = row.subcategory;
    }
  }

  // Classify with Claude — use forced vertical if all contacts share one
  const forcedVertical = vertical ||
    (companyMap.size > 0 && [...companyMap.values()].every(c => c.category === [...companyMap.values()][0].category)
      ? [...companyMap.values()][0].category
      : undefined);

  const batches = chunk(companyInfos, 20);
  const classifications: Record<string, { categories: string[]; subcategories: string[]; primary_category: string; primary_subcategory: string }> = {};
  for (const batch of batches) {
    const result = await classifyCompanies(batch, forcedVertical);
    Object.assign(classifications, result);
  }

  // Update all contacts for each classified company
  const allIds: string[] = [];
  for (const [key, { ids, category }] of companyMap.entries()) {
    const cls = classifications[key];
    const updateData = cls
      ? {
          category: cls.primary_category,
          subcategory: cls.primary_subcategory,
          categories: cls.categories,
          subcategories: cls.subcategories,
          ai_classified: true,
        }
      : {
          category: category || "Other",
          subcategory: "Other",
          categories: category ? [category] : [],
          subcategories: ["Other"],
          ai_classified: true,
        };

    await db.from("uploaded_contacts").update(updateData).in("id", ids);
    allIds.push(...ids);
  }

  // Count remaining
  const { count: remaining } = await db
    .from("uploaded_contacts")
    .select("*", { count: "exact", head: true })
    .eq("ai_classified", false);

  return NextResponse.json({
    done: (remaining ?? 0) === 0,
    processed: allIds.length,
    companies_classified: companyMap.size,
    remaining: remaining ?? 0,
  });
}
