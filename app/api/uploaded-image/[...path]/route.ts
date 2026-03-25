import { NextRequest, NextResponse } from "next/server";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";

const BASE = join(process.cwd(), "public", "recipe-images");

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const relative = path.join("/");

  // Prevent path traversal
  const full = resolve(join(BASE, relative));
  if (!full.startsWith(BASE)) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const data = await readFile(full);
    const ext = relative.split(".").pop()?.toLowerCase() ?? "jpg";
    const mime =
      ext === "png" ? "image/png"
      : ext === "gif" ? "image/gif"
      : ext === "webp" ? "image/webp"
      : "image/jpeg";

    return new NextResponse(data, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
