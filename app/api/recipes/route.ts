import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import type { Recipe } from "@/lib/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function fromDb(row: any): Recipe {
  return {
    id: row.id,
    title: row.title,
    url: row.url,
    description: row.description,
    category: row.category,
    tags: row.tags ?? [],
    images: row.images ?? [],
    imageUrl: row.image_url || undefined,
    createdAt: row.created_at,
  };
}

function toDb(r: Recipe) {
  return {
    id: r.id,
    title: r.title,
    url: r.url ?? "",
    description: r.description ?? "",
    category: r.category,
    tags: r.tags ?? [],
    images: r.images ?? [],
    image_url: r.imageUrl ?? "",
    created_at: r.createdAt,
  };
}

export async function GET() {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json((data ?? []).map(fromDb));
}

export async function POST(req: NextRequest) {
  const supabase = getSupabase();
  const recipe: Recipe = await req.json();

  const { error } = await supabase
    .from("recipes")
    .upsert(toDb(recipe), { onConflict: "id" });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
