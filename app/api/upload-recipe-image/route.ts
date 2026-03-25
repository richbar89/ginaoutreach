import { NextRequest, NextResponse } from "next/server";
import { basename } from "node:path";
import { getSupabase } from "@/lib/supabase";

const BUCKET = "recipe-images";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const recipeId = formData.get("recipeId") as string | null;

  if (!file || !recipeId) {
    return NextResponse.json({ error: "Missing file or recipeId" }, { status: 400 });
  }

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const storagePath = `${recipeId}/${safeName}`;

  const supabase = getSupabase();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return NextResponse.json({ path: data.publicUrl });
}

export async function DELETE(req: NextRequest) {
  const recipeId = req.nextUrl.searchParams.get("recipeId");
  const filename = req.nextUrl.searchParams.get("filename");

  if (!recipeId || !filename) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const storagePath = `${recipeId}/${basename(filename)}`;
  const supabase = getSupabase();
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
