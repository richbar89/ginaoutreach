import Anthropic from "@anthropic-ai/sdk";

// ── Taxonomy ────────────────────────────────────────────────────────────────
export const TAXONOMY: Record<string, string[]> = {
  "Food & Drink": [
    "Snacks & Crisps",
    "Confectionery",
    "Drinks",
    "Coffee & Tea",
    "Beer & Brewing",
    "Wine & Spirits",
    "Bakery & Bread",
    "Dairy & Alternatives",
    "Casual Dining & Restaurants",
    "Grocery & Food Brands",
    "Health & Wellness Food",
    "Baby & Kids Food",
  ],
  "Lifestyle": [
    "Fashion & Clothing",
    "Home & Interiors",
    "Travel & Tourism",
    "Pets",
    "Sustainability & Eco",
    "Gifting & Occasions",
    "Media & Publishing",
  ],
  "Beauty": [
    "Skincare",
    "Makeup & Cosmetics",
    "Haircare",
    "Fragrance",
    "Nails",
    "Wellness & Supplements",
  ],
  "Fitness": [
    "Activewear & Apparel",
    "Supplements & Nutrition",
    "Equipment & Gear",
    "Running & Cycling",
    "Gyms & Studios",
    "Sports Brands",
  ],
};

export type Classification = {
  categories: string[];       // e.g. ["Food & Drink"]
  subcategories: string[];    // e.g. ["Dairy & Alternatives", "Health & Wellness Food"]
  primary_category: string;   // single top-level vertical
  primary_subcategory: string; // single best subcategory (or "Other")
};

type CompanyInfo = {
  name: string;
  industry: string;
  keywords: string;
  description: string;
};

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const TAXONOMY_TEXT = Object.entries(TAXONOMY)
  .map(([cat, subs]) => `${cat}: ${subs.join(", ")}`)
  .join("\n");

// Classify a batch of companies in one API call
export async function classifyCompanies(
  companies: CompanyInfo[],
  forcedVertical?: string
): Promise<Record<string, Classification>> {
  if (companies.length === 0) return {};

  const companyList = companies
    .map((c, i) =>
      `${i + 1}. Company: "${c.name}"
   Industry: ${c.industry || "unknown"}
   Keywords: ${c.keywords?.slice(0, 300) || "none"}
   Description: ${c.description?.slice(0, 200) || "none"}`
    )
    .join("\n\n");

  const verticalInstruction = forcedVertical
    ? `IMPORTANT: All companies in this upload belong to the "${forcedVertical}" vertical — always include it in their categories. Within that vertical, pick the most accurate subcategory/subcategories.`
    : "Pick the most accurate vertical(s) from the taxonomy.";

  const prompt = `You are classifying brand/company contacts for an influencer marketing platform.

${verticalInstruction}

TAXONOMY (categories and their subcategories):
${TAXONOMY_TEXT}

For each company below, return a JSON object with exactly these fields:
- "categories": array of matching top-level categories (e.g. ["Food & Drink"])
- "subcategories": array of all matching subcategories across any category (e.g. ["Dairy & Alternatives", "Health & Wellness Food"])
- "primary_category": single best category string
- "primary_subcategory": single best subcategory string, or "Other" if none fit

Rules:
- A company CAN belong to multiple categories and subcategories (e.g. a health food brand might be "Food & Drink" + "Fitness")
- Only use subcategory values that exist in the taxonomy above — anything else should map to "Other"
- Be specific: Müller = "Dairy & Alternatives", Greene King = "Beer & Brewing", Innocent = "Drinks"
- Return ONLY valid JSON, no explanation. Format:
{
  "1": { "categories": [...], "subcategories": [...], "primary_category": "...", "primary_subcategory": "..." },
  "2": { ... },
  ...
}

Companies to classify:
${companyList}`;

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = (message.content[0] as { type: string; text: string }).text.trim();
    // Extract JSON even if there's surrounding text
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON in response");

    const parsed = JSON.parse(jsonMatch[0]) as Record<string, Classification>;

    // Map back from index to company name
    const result: Record<string, Classification> = {};
    companies.forEach((c, i) => {
      const entry = parsed[String(i + 1)];
      if (entry) result[c.name.toLowerCase()] = entry;
    });

    return result;
  } catch (err) {
    console.error("classifyCompanies error:", err);
    // Fallback: return Other for all
    const fallback: Record<string, Classification> = {};
    companies.forEach((c) => {
      fallback[c.name.toLowerCase()] = {
        categories: [forcedVertical || "Food & Drink"],
        subcategories: ["Other"],
        primary_category: forcedVertical || "Food & Drink",
        primary_subcategory: "Other",
      };
    });
    return fallback;
  }
}

// Chunk array into batches
export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}
