import { NextResponse } from "next/server";

const CATEGORY_MAP: Record<string, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  sidedishes: "Side Dishes",
  snacksanddesserts: "Snacks & Desserts",
  "sweet-treats": "Sweet Treats",
  christmas: "Christmas",
};

const NON_RECIPE = new Set([
  "ingredients", "nutrition", "cooking-tips", "reviews", "veganism",
]);

function categoryFromUrl(url: string): string | null {
  try {
    const segment = new URL(url).pathname.split("/").filter(Boolean)[0];
    if (NON_RECIPE.has(segment)) return null;
    return CATEGORY_MAP[segment] || null;
  } catch {
    return null;
  }
}

type WPPost = {
  id: number;
  title: { rendered: string };
  link: string;
  _embedded?: {
    "wp:featuredmedia"?: Array<{
      source_url?: string;
      media_details?: {
        sizes?: {
          medium_large?: { source_url: string };
          large?: { source_url: string };
        };
      };
    }>;
  };
};

export async function GET() {
  const BASE = "https://ginabnutrition.com/wp-json/wp/v2/posts";
  const allPosts: WPPost[] = [];

  try {
    const firstRes = await fetch(
      `${BASE}?per_page=100&page=1&_embed=true&_fields=id,title,link,_embedded`,
      { headers: { Accept: "application/json" }, cache: "no-store" }
    );
    if (!firstRes.ok) {
      return NextResponse.json({ error: `WP API error: ${firstRes.status}` }, { status: 500 });
    }

    const totalPages = parseInt(firstRes.headers.get("X-WP-TotalPages") || "1", 10);
    allPosts.push(...(await firstRes.json() as WPPost[]));

    if (totalPages > 1) {
      const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
          fetch(`${BASE}?per_page=100&page=${i + 2}&_embed=true&_fields=id,title,link,_embedded`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }).then((r) => r.json() as Promise<WPPost[]>)
        )
      );
      for (const page of rest) allPosts.push(...page);
    }

    const recipes = allPosts
      .map((post) => {
        const category = categoryFromUrl(post.link);
        if (!category) return null;

        const media = post._embedded?.["wp:featuredmedia"]?.[0];
        const imageUrl =
          media?.media_details?.sizes?.large?.source_url ||
          media?.media_details?.sizes?.medium_large?.source_url ||
          media?.source_url ||
          "";

        const title = post.title?.rendered
          ? post.title.rendered.replace(/<[^>]+>/g, "")
          : "";

        return {
          id: crypto.randomUUID(),
          title,
          url: post.link,
          imageUrl, // remote URL — served via /api/recipe-image proxy
          description: "",
          category,
          tags: [] as string[],
          createdAt: new Date().toISOString(),
        };
      })
      .filter((r) => r !== null);

    return NextResponse.json({ recipes, count: recipes.length });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Failed to import recipes" }, { status: 500 });
  }
}
