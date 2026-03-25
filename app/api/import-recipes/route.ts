import { NextResponse } from "next/server";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";

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

// Download one image with browser-like headers to bypass Cloudflare hotlink protection
async function downloadImage(remoteUrl: string, id: string): Promise<string> {
  if (!remoteUrl) return "";
  try {
    const res = await fetch(remoteUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Referer": "https://ginabnutrition.com/",
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      console.warn(`Image fetch failed (${res.status}): ${remoteUrl}`);
      return remoteUrl; // keep remote URL as fallback
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filename = `${id}.${ext}`;
    const dir = join(process.cwd(), "public", "recipe-images");

    await mkdir(dir, { recursive: true });
    await writeFile(join(dir, filename), Buffer.from(await res.arrayBuffer()));

    return `/recipe-images/${filename}`;
  } catch (err) {
    console.warn(`Image download error for ${remoteUrl}:`, err);
    return remoteUrl; // keep remote as fallback
  }
}

// Run tasks in parallel batches
async function batchRun<T>(
  items: T[],
  size: number,
  fn: (item: T, i: number) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += size) {
    await Promise.all(items.slice(i, i + size).map((item, j) => fn(item, i + j)));
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
          large?: { source_url: string };
          medium_large?: { source_url: string };
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
    // ── Fetch all posts ──────────────────────────────────────
    const firstRes = await fetch(
      `${BASE}?per_page=100&page=1&_embed=true`,
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
          fetch(`${BASE}?per_page=100&page=${i + 2}&_embed=true`, {
            headers: { Accept: "application/json" },
            cache: "no-store",
          }).then((r) => r.json() as Promise<WPPost[]>)
        )
      );
      for (const page of rest) allPosts.push(...page);
    }

    // ── Build recipe list (filter non-recipes) ───────────────
    type RecipeRow = {
      id: string;
      title: string;
      url: string;
      imageUrl: string;
      remoteUrl: string;
      description: string;
      category: string;
      tags: string[];
      createdAt: string;
    };

    const recipes: RecipeRow[] = allPosts
      .map((post): RecipeRow | null => {
        const category = categoryFromUrl(post.link);
        if (!category) return null;

        const media = post._embedded?.["wp:featuredmedia"]?.[0];
        const remoteUrl =
          media?.media_details?.sizes?.large?.source_url ||
          media?.media_details?.sizes?.medium_large?.source_url ||
          media?.media_details?.sizes?.full?.source_url ||
          media?.source_url ||
          "";

        return {
          id: crypto.randomUUID(),
          title: post.title?.rendered?.replace(/<[^>]+>/g, "") || "",
          url: post.link,
          imageUrl: "",      // filled in after download
          remoteUrl,         // temp
          description: "",
          category,
          tags: [],
          createdAt: new Date().toISOString(),
        };
      })
      .filter((r): r is RecipeRow => r !== null);

    // ── Download images (10 at a time) ───────────────────────
    await batchRun(recipes, 10, async (recipe) => {
      recipe.imageUrl = await downloadImage(recipe.remoteUrl, recipe.id);
    });

    // Strip temp field before returning
    const finalRecipes = recipes.map(({ remoteUrl: _, ...r }) => r);

    return NextResponse.json({ recipes: finalRecipes, count: finalRecipes.length });
  } catch (err) {
    console.error("Import error:", err);
    return NextResponse.json({ error: "Failed to import recipes" }, { status: 500 });
  }
}
