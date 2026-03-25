import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "node:fs/promises";
import { join, basename } from "node:path";

const DIR = (recipeId: string) =>
  join(process.cwd(), "public", "recipe-images", recipeId);

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const recipeId = formData.get("recipeId") as string | null;

  if (!file || !recipeId) {
    return NextResponse.json({ error: "Missing file or recipeId" }, { status: 400 });
  }

  // Sanitise filename: timestamp prefix + stripped original name
  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const dir = DIR(recipeId);
  await mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(join(dir, safeName), buffer);

  return NextResponse.json({ path: `/recipe-images/${recipeId}/${safeName}` });
}

export async function DELETE(req: NextRequest) {
  const recipeId = req.nextUrl.searchParams.get("recipeId");
  const filename = req.nextUrl.searchParams.get("filename");

  if (!recipeId || !filename) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  // Prevent path traversal
  const safe = basename(filename);
  const filePath = join(DIR(recipeId), safe);

  try {
    await unlink(filePath);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
