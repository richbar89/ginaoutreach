import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getSupabaseAdmin();
  const email = req.nextUrl.searchParams.get("email");

  if (email) {
    // Single contact lookup by email
    const { data, error } = await db
      .from("uploaded_contacts")
      .select("id, name, email, position, company, linkedin, industry, category")
      .ilike("email", email)
      .maybeSingle();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  }

  // All contacts
  const { data, error } = await db
    .from("uploaded_contacts")
    .select("id, name, email, position, company, linkedin, industry, category")
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data || []);
}
