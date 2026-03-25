import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir, access } from "node:fs/promises";
import { join, extname } from "node:path";
import { createHash } from "node:crypto";

const CACHE_DIR = join(process.cwd(), "public", "recipe-images");

function urlToFilename(url: string): string {
  const hash = createHash("md5").update(url).digest("hex").slice(0, 12);
  const ext = extname(new URL(url).pathname).split("?")[0] || ".jpg";
  return `${hash}${ext}`;
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return new NextResponse("Missing url param", { status: 400 });
  }

  const filename = urlToFilename(url);
  const localPath = join(CACHE_DIR, filename);

  // ── Serve from cache if already downloaded ──────────────
  try {
    await access(localPath);
    const cached = await readFile(localPath);
    const ext = extname(filename).toLowerCase();
    const ct =
      ext === ".png" ? "image/png"
      : ext === ".webp" ? "image/webp"
      : ext === ".gif" ? "image/gif"
      : "image/jpeg";
    return new NextResponse(cached, {
      headers: {
        "Content-Type": ct,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Cache": "HIT",
      },
    });
  } catch {
    // Not cached yet — fetch and save
  }

  // ── Fetch from origin with spoofed Referer ───────────────
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Referer: "https://ginabnutrition.com/",
        Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!res.ok) {
      return new NextResponse("Image fetch failed", { status: 502 });
    }

    const contentType = res.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await res.arrayBuffer());

    // Save to disk
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(localPath, buffer);

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "X-Cache": "MISS",
      },
    });
  } catch (err) {
    console.error("Image proxy error:", err);
    return new NextResponse("Failed to fetch image", { status: 502 });
  }
}
