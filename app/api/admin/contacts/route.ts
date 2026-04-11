import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";
import { classifyCompanies, chunk } from "@/lib/classifyCompany";

// Auto-detect Food & Drink subcategory from Apollo keyword/description text
function detectFoodSubcategory(text: string): string | null {
  const l = text.toLowerCase();
  if (l.includes("beer") || l.includes("brew") || l.includes("ales") || l.includes("lager") || l.includes("pub"))
    return "Beer & Brewing";
  if (l.includes("wine") || l.includes("spirits") || l.includes("distil") || l.includes("whisky") || l.includes("whiskey") || l.includes("vodka") || l.includes("gin") || l.includes("rum") || l.includes("champagne"))
    return "Wine & Spirits";
  if (l.includes("coffee") || l.includes("café") || l.includes("espresso") || l.includes("barista"))
    return "Coffee & Tea";
  if (l.includes("tea") && !l.includes("steak"))
    return "Coffee & Tea";
  if (l.includes("snack") || l.includes("crisp") || l.includes("chip") || l.includes("popcorn") || l.includes("pretzel") || l.includes("nut") || l.includes("trail mix"))
    return "Snacks & Crisps";
  if (l.includes("chocolate") || l.includes("confection") || l.includes("sweet") || l.includes("candy") || l.includes("fudge") || l.includes("gummy"))
    return "Confectionery";
  if (l.includes("bread") || l.includes("bakery") || l.includes("pastry") || l.includes("biscuit") || l.includes("cake") || l.includes("dough"))
    return "Bakery & Bread";
  if (l.includes("dairy") || l.includes("milk") || l.includes("yogurt") || l.includes("yoghurt") || l.includes("cheese") || l.includes("butter"))
    return "Dairy & Alternatives";
  if (l.includes("oat milk") || l.includes("almond milk") || l.includes("plant-based") || l.includes("dairy-free") || l.includes("dairy free"))
    return "Dairy & Alternatives";
  if (l.includes("restaurant") || l.includes("dining") || l.includes("takeaway") || l.includes("takeout") || l.includes("fast food"))
    return "Casual Dining & Restaurants";
  if (l.includes("baby food") || l.includes("infant") || l.includes("toddler food") || l.includes("kids food"))
    return "Baby & Kids Food";
  if (l.includes("health food") || l.includes("wellness food") || l.includes("organic") || l.includes("superfood") || l.includes("wholefoods") || l.includes("whole foods"))
    return "Health & Wellness Food";
  if (l.includes("grocery") || l.includes("supermarket") || l.includes("food brand") || l.includes("food retailer"))
    return "Grocery & Food Brands";
  if (l.includes("juice") || l.includes("smoothie") || l.includes("soft drink") || l.includes("energy drink") || l.includes("sparkling water") || l.includes("kombucha") || l.includes("soda"))
    return "Drinks";
  if (l.includes("drink") || l.includes("beverage"))
    return "Drinks";
  return "Other";
}

// Auto-detect subcategory from keywords for any vertical
function detectSubcategory(vertical: string, text: string): string | null {
  const l = text.toLowerCase();
  if (vertical === "Food & Drink") return detectFoodSubcategory(text);
  if (vertical === "Lifestyle") {
    if (l.includes("fashion") || l.includes("clothing") || l.includes("apparel") || l.includes("wear") || l.includes("style") || l.includes("textile")) return "Fashion & Clothing";
    if (l.includes("home") || l.includes("interior") || l.includes("furniture") || l.includes("decor") || l.includes("living")) return "Home & Interiors";
    if (l.includes("travel") || l.includes("tourism") || l.includes("hotel") || l.includes("holiday") || l.includes("flight")) return "Travel & Tourism";
    if (l.includes("pet") || l.includes("dog") || l.includes("cat") || l.includes("animal")) return "Pets";
    if (l.includes("sustainable") || l.includes("eco") || l.includes("green") || l.includes("recycl") || l.includes("ethical")) return "Sustainability & Eco";
    if (l.includes("gift") || l.includes("occasion") || l.includes("wedding") || l.includes("celebration")) return "Gifting & Occasions";
    if (l.includes("media") || l.includes("publishing") || l.includes("magazine") || l.includes("content")) return "Media & Publishing";
    return "Other";
  }
  if (vertical === "Beauty") {
    if (l.includes("skincare") || l.includes("skin care") || l.includes("moistur") || l.includes("serum") || l.includes("spf") || l.includes("sunscreen")) return "Skincare";
    if (l.includes("makeup") || l.includes("cosmetic") || l.includes("foundation") || l.includes("lipstick") || l.includes("mascara") || l.includes("eyeshadow")) return "Makeup & Cosmetics";
    if (l.includes("hair") || l.includes("shampoo") || l.includes("conditioner") || l.includes("salon")) return "Haircare";
    if (l.includes("fragrance") || l.includes("perfume") || l.includes("cologne") || l.includes("scent")) return "Fragrance";
    if (l.includes("nail") || l.includes("manicure") || l.includes("pedicure")) return "Nails";
    if (l.includes("wellness") || l.includes("supplement") || l.includes("vitamin") || l.includes("collagen")) return "Wellness & Supplements";
    return "Other";
  }
  if (vertical === "Fitness") {
    if (l.includes("activewear") || l.includes("sportswear") || l.includes("gym wear") || l.includes("legging") || l.includes("trainer")) return "Activewear & Apparel";
    if (l.includes("supplement") || l.includes("protein") || l.includes("creatine") || l.includes("pre-workout") || l.includes("nutrition")) return "Supplements & Nutrition";
    if (l.includes("equipment") || l.includes("dumbbell") || l.includes("barbell") || l.includes("treadmill") || l.includes("gear")) return "Equipment & Gear";
    if (l.includes("running") || l.includes("cycling") || l.includes("triathlon") || l.includes("marathon")) return "Running & Cycling";
    if (l.includes("gym") || l.includes("studio") || l.includes("pilates") || l.includes("yoga class") || l.includes("crossfit")) return "Gyms & Studios";
    if (l.includes("sport") || l.includes("athletic") || l.includes("football") || l.includes("rugby") || l.includes("tennis")) return "Sports Brands";
    return "Other";
  }
  return "Other";
}

// Single contact
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const { csv, contact, vertical } = await req.json();
  const db = getSupabaseAdmin();

  if (contact) {
    // Single contact
    if (!contact.name || !contact.email) {
      return NextResponse.json({ error: "name and email required" }, { status: 400 });
    }
    const { error } = await db.from("uploaded_contacts").insert({
      name: contact.name.trim(),
      email: contact.email.trim().toLowerCase(),
      position: contact.position?.trim() || null,
      company: contact.company?.trim() || null,
      linkedin: contact.linkedin?.trim() || null,
      notes: contact.notes?.trim() || null,
      category: contact.category || null,
      subcategory: contact.subcategory || null,
      country: contact.country || "UK",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ inserted: 1 });
  }

  if (csv) {
    // Full CSV parser — handles quoted fields with embedded commas AND newlines
    function parseFullCsv(raw: string): string[][] {
      const records: string[][] = [];
      let fields: string[] = [];
      let cur = "";
      let inQuote = false;
      const s = raw.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

      for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (ch === '"') {
          if (inQuote && s[i + 1] === '"') { cur += '"'; i++; }
          else inQuote = !inQuote;
        } else if (ch === "," && !inQuote) {
          fields.push(cur);
          cur = "";
        } else if (ch === "\n" && !inQuote) {
          fields.push(cur);
          cur = "";
          if (fields.some(f => f.trim())) records.push(fields);
          fields = [];
        } else {
          cur += ch;
        }
      }
      // Last field/record
      fields.push(cur);
      if (fields.some(f => f.trim())) records.push(fields);
      return records;
    }

    const records = parseFullCsv(csv as string);
    if (records.length < 2) return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });

    const headers = records[0].map((h: string) =>
      h.toLowerCase().trim().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
    );

    // ── Parse all raw rows ──────────────────────────────────────────────────
    type RawRow = {
      name: string; email: string; position: string | null;
      company: string | null; linkedin: string | null; country: string;
      industry: string; keywords: string; description: string;
    };
    const rawRows: RawRow[] = [];

    for (let i = 1; i < records.length; i++) {
      const values = records[i];
      const row: Record<string, string> = {};
      headers.forEach((h: string, idx: number) => { row[h] = (values[idx] ?? "").trim(); });

      const email = row["email"] || row["email_address"] || row["personal_email"] || "";
      const name = row["full_name"] || row["name"] || row["contact_name"] ||
        ([row["first_name"], row["last_name"]].filter(Boolean).join(" ")) || "";
      if (!email || !name) continue;

      rawRows.push({
        name,
        email: email.toLowerCase(),
        position: row["title"] || row["position"] || row["job_title"] || row["role"] || row["headline"] || null,
        company: (row["company_name"] || row["company"] || row["brand"] || row["organisation"] || "").trim() || null,
        linkedin: row["linkedin"] || row["linkedin_url"] || row["linkedin_profile"] || null,
        country: row["company_country"] || row["country"] || "UK",
        industry: row["industry"] || "",
        keywords: row["keywords"] || row["company_keywords"] || "",
        description: row["company_short_description"] || row["company_seo_description"] || row["description"] || "",
      });
    }

    if (rawRows.length === 0) return NextResponse.json({ error: "No valid rows found" }, { status: 400 });

    // ── AI classification — deduplicate by company name ────────────────────
    const companyMap = new Map<string, { name: string; industry: string; keywords: string; description: string }>();
    for (const r of rawRows) {
      if (r.company) {
        const key = r.company.toLowerCase();
        if (!companyMap.has(key)) {
          companyMap.set(key, { name: r.company, industry: r.industry, keywords: r.keywords, description: r.description });
        }
      }
    }

    const uniqueCompanies = Array.from(companyMap.values());
    const classifications: Record<string, { categories: string[]; subcategories: string[]; primary_category: string; primary_subcategory: string }> = {};

    // Process in batches of 20 to keep prompts manageable
    const batches = chunk(uniqueCompanies, 20);
    for (const batch of batches) {
      const result = await classifyCompanies(batch, vertical);
      Object.assign(classifications, result);
    }

    // ── Build final rows using AI classifications ──────────────────────────
    const rows = rawRows.map(r => {
      const key = r.company?.toLowerCase() ?? "";
      const cls = classifications[key];
      return {
        name: r.name,
        email: r.email,
        position: r.position?.trim() || null,
        company: r.company,
        linkedin: r.linkedin?.trim() || null,
        notes: null,
        // Primary category/subcategory for backwards compat
        category: cls?.primary_category ?? vertical ?? r.industry ?? null,
        subcategory: cls?.primary_subcategory ?? "Other",
        // Full multi-value arrays
        categories: cls?.categories ?? (vertical ? [vertical] : []),
        subcategories: cls?.subcategories ?? ["Other"],
        country: r.country,
      };
    });

    const { error } = await db.from("uploaded_contacts").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ inserted: rows.length, classified: uniqueCompanies.length });
  }

  return NextResponse.json({ error: "Provide contact or csv" }, { status: 400 });
}

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("uploaded_contacts")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function DELETE(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const body = await req.json();
  const db = getSupabaseAdmin();

  // Delete everything
  if (body.all === true) {
    const { error } = await db.from("uploaded_contacts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: "all" });
  }

  if (body.ids && Array.isArray(body.ids) && body.ids.length > 0) {
    const { error } = await db.from("uploaded_contacts").delete().in("id", body.ids);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ deleted: body.ids.length });
  }

  if (body.id) {
    const { error } = await db.from("uploaded_contacts").delete().eq("id", body.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Provide id, ids, or all:true" }, { status: 400 });
}
