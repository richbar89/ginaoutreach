import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

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
  return null;
}

function isFoodIndustry(industry: string): boolean {
  const l = industry.toLowerCase();
  return l.includes("food") || l.includes("beverage") || l.includes("drink")
    || l.includes("restaurant") || l.includes("bakery") || l.includes("dairy");
}

// Single contact
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const { csv, contact } = await req.json();
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
    // CSV upload — parse lines
    const lines = (csv as string).split("\n").map((l: string) => l.trim()).filter(Boolean);
    if (lines.length < 2) return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });

    const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v: string) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h: string, idx: number) => { row[h] = values[idx] || ""; });

      const email = row["email"] || row["email_address"] || "";
      const name = row["name"] || row["full_name"] || row["contact_name"] || "";
      if (!email || !name) continue;

      const industry = row["industry"] || "";
      const keywords = row["keywords"] || row["company_keywords"] || "";
      const description = row["company_short_description"] || row["company_seo_description"] || row["description"] || "";
      const searchText = `${keywords} ${description} ${industry}`;

      // Determine top-level category
      let category = row["category"] || null;
      if (!category && isFoodIndustry(industry)) category = "Food & Drink";
      if (!category && industry) category = industry; // fallback: store Apollo industry

      // Auto-detect subcategory from keywords if not supplied
      let subcategory = row["subcategory"] || null;
      if (!subcategory && isFoodIndustry(industry)) {
        subcategory = detectFoodSubcategory(searchText);
      }

      rows.push({
        name,
        email: email.toLowerCase(),
        position: row["position"] || row["job_title"] || row["title"] || row["role"] || null,
        company: row["company"] || row["company_name"] || row["brand"] || row["organisation"] || null,
        linkedin: row["linkedin"] || row["linkedin_url"] || row["linkedin_profile"] || null,
        notes: row["notes"] || null,
        category,
        subcategory,
        country: row["country"] || "UK",
      });
    }

    if (rows.length === 0) return NextResponse.json({ error: "No valid rows found" }, { status: 400 });

    const { error } = await db.from("uploaded_contacts").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ inserted: rows.length });
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

  const { id } = await req.json();
  const db = getSupabaseAdmin();
  await db.from("uploaded_contacts").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
