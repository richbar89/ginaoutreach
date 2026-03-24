import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

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
    const path = new URL(url).pathname;
    const segment = path.split("/").filter(Boolean)[0];
    if (NON_RECIPE.has(segment)) return null;
    return CATEGORY_MAP[segment] || null;
  } catch {
    return null;
  }
}

function titleFromSlug(slug: string): string {
  return slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Download an image and save it to public/recipe-images/
// Returns the local path, or falls back to the original URL on failure
async function downloadImage(remoteUrl: string, id: string): Promise<string> {
  if (!remoteUrl) return "";
  try {
    const res = await fetch(remoteUrl, {
      signal: AbortSignal.timeout(15000),
      headers: { "User-Agent": "GinaOS/1.0" },
    });
    if (!res.ok) return remoteUrl;

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png")
      ? "png"
      : contentType.includes("webp")
      ? "webp"
      : "jpg";

    const buffer = Buffer.from(await res.arrayBuffer());
    const filename = `${id}.${ext}`;
    const dir = join(process.cwd(), "public", "recipe-images");

    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), buffer);

    return `/recipe-images/${filename}`;
  } catch {
    return remoteUrl; // fall back to original if download fails
  }
}

// Run async tasks in batches to avoid overwhelming memory / network
async function batchRun<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = await Promise.all(items.slice(i, i + batchSize).map(fn));
    results.push(...batch);
  }
  return results;
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
          full?: { source_url: string };
        };
      };
    }>;
  };
};

export async function GET() {
  const BASE = "https://ginabnutrition.com/wp-json/wp/v2/posts";
  const allPosts: WPPost[] = [];

  try {
    // ── 1. Fetch all posts from WP REST API ─────────────────
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
      const pageNums = Array.from({ length: totalPages - 1 }, (_, i) => i + 2);
      const pages = await Promise.all(
        pageNums.map((p) =>
          fetch(`${BASE}?per_page=100&page=${p}&_embed=true&_fields=id,title,link,_embedded`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }).then((r) => r.json() as Promise<WPPost[]>)
        )
      );
      for (const page of pages) allPosts.push(...page);
    }

    // ── 2. Build recipe metadata (filter non-recipes) ───────
    const recipes = allPosts
      .map((post) => {
        const category = categoryFromUrl(post.link);
        if (!category) return null;

        const media = post._embedded?.["wp:featuredmedia"]?.[0];
        const remoteImageUrl =
          media?.media_details?.sizes?.large?.source_url ||
          media?.media_details?.sizes?.medium_large?.source_url ||
          media?.media_details?.sizes?.full?.source_url ||
          media?.source_url ||
          "";

        const title = post.title?.rendered
          ? post.title.rendered.replace(/<[^>]+>/g, "")
          : titleFromSlug(post.link.split("/").filter(Boolean).pop() || "");

        return {
          id: crypto.randomUUID(),
          title,
          url: post.link,
          remoteImageUrl, // temp field — replaced after download
          imageUrl: "",
          description: "",
          category,
          tags: [] as string[],
          createdAt: new Date().toISOString(),
        };
      })
      .filter((r) => r !== null);

    // ── 3. Download all images into public/recipe-images/ ───
    // Batch of 8 concurrent downloads to keep things fast but polite
    await batchRun(recipes, 8, async (recipe) => {
      recipe.imageUrl = await downloadImage(recipe.remoteImageUrl, recipe.id);
    });

    // Strip the temp remoteImageUrl field before returning
    const finalRecipes = recipes.map(({ remoteImageUrl: _, ...r }) => r);

    return NextResponse.json({ recipes: finalRecipes, count: finalRecipes.length });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Failed to import recipes" }, { status: 500 });
  }
}
