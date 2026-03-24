import { NextResponse } from "next/server";

// Map URL path segment → display category name
const CATEGORY_MAP: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  sidedishes: "Side Dishes",
  snacksanddesserts: "Snacks & Desserts",
  "sweet-treats": "Sweet Treats",
  christmas: "Christmas",
};

// Slugs that are NOT recipes
const NON_RECIPE = new Set([
  "ingredients", "nutrition", "cooking-tips", "reviews", "veganism",
]);

function categoryFromUrl(url: string): string | null {
  try {
    const path = new URL(url).pathname; // e.g. /breakfast/some-recipe/
    const segment = path.split("/").filter(Boolean)[0];
    if (NON_RECIPE.has(segment)) return null;
    return CATEGORY_MAP[segment] || null;
  } catch {
    return null;
  }
}

function titleFromSlug(slug: string): string {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

type WPPost = {
  id: number;
  title: { rendered: string };
  link: string;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      media_details?: { sizes?: { medium_large?: { source_url: string }; large?: { source_url: string } } };
    }>;
  };
};

export async function GET() {
  const BASE = "https://ginabnutrition.com/wp-json/wp/v2/posts";
  const allPosts: WPPost[] = [];

  try {
    // Fetch page 1 to get total pages
    const firstRes = await fetch(
      `${BASE}?per_page=100&page=1&_embed=true&_fields=id,title,link,_embedded`,
      { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
    );
    if (!firstRes.ok) {
      return NextResponse.json({ error: `WP API error: ${firstRes.status}` }, { status: 500 });
    }
    const totalPages = parseInt(firstRes.headers.get("X-WP-TotalPages") || "1", 10);
    const page1: WPPost[] = await firstRes.json();
    allPosts.push(...page1);

    // Fetch remaining pages in parallel
    if (totalPages > 1) {
      const pageNums = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
      const results = await Promise.all(
        pageNums.map((p) =>
          fetch(
            `${BASE}?per_page=100&page=${p}&_embed=true&_fields=id,title,link,_embedded`,
            { headers: { Accept: "application/json" }, next: { revalidate: 0 } }
          ).then((r) => r.json() as Promise<WPPost[]>)
        )
      );
      for (const page of results) allPosts.push(...page);
    }

    // Map to Recipe objects
    const recipes = allPosts
      .map((post) => {
        const category = categoryFromUrl(post.link);
        if (!category) return null; // skip non-recipe posts

        const media = post._embedded?.["wp:featuredmedia"]?.[0];
        const imageUrl =
          media?.media_details?.sizes?.medium_large?.source_url ||
          media?.media_details?.sizes?.large?.source_url ||
          media?.source_url ||
          "";

        const rawTitle = post.title?.rendered
          ? post.title.rendered.replace(/<[^>]+>/g, "") // strip HTML
          : titleFromSlug(post.link.split("/").filter(Boolean).pop() || "");

        return {
          id: crypto.randomUUID(),
          title: rawTitle,
          url: post.link,
          imageUrl,
          description: "",
          category,
          tags: [] as string[],
          createdAt: new Date().toISOString(),
        };
      })
      .filter(Boolean);

    return NextResponse.json({ recipes, count: recipes.length });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Failed to import recipes" }, { status: 500 });
  }
}
