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

  const download = _req.nextUrl.searchParams.get("dl") === "1";
  const filename = path[path.length - 1] ?? "image";

  try {
    const data = await readFile(full);
    const ext = filename.split(".").pop()?.toLowerCase() ?? "jpg";
    const mime =
      ext === "png" ? "image/png"
      : ext === "gif" ? "image/gif"
      : ext === "webp" ? "image/webp"
      : "image/jpeg";

    return new NextResponse(data, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "public, max-age=31536000, immutable",
        ...(download ? { "Content-Disposition": `attachment; filename="${filename}"` } : {}),
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
