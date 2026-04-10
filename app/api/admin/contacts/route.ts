import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

// Single contact
export async function POST(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const { csv, contact } = await req.json();
  const db = getSupabaseAdmin();

  if (contact) {
    // Single contact
    if (!contact.name || !contact.email) {
      return NextResponse.json({ error: "name and email required" }, { status: 400 });
    }
    const { error } = await db.from("uploaded_contacts").insert({
      name: contact.name.trim(),
      email: contact.email.trim().toLowerCase(),
      position: contact.position?.trim() || null,
      company: contact.company?.trim() || null,
      linkedin: contact.linkedin?.trim() || null,
      notes: contact.notes?.trim() || null,
      category: contact.category || null,
      subcategory: contact.subcategory || null,
      country: contact.country || "UK",
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ inserted: 1 });
  }

  if (csv) {
    // CSV upload — parse lines
    const lines = (csv as string).split("\n").map((l: string) => l.trim()).filter(Boolean);
    if (lines.length < 2) return NextResponse.json({ error: "CSV has no data rows" }, { status: 400 });

    const headers = lines[0].split(",").map((h: string) => h.trim().toLowerCase().replace(/[^a-z_]/g, ""));
    const rows = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v: string) => v.trim().replace(/^"|"$/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((h: string, idx: number) => { row[h] = values[idx] || ""; });

      const email = row["email"] || row["email_address"] || "";
      const name = row["name"] || row["full_name"] || row["contact_name"] || "";
      if (!email || !name) continue;

      rows.push({
        name,
        email: email.toLowerCase(),
        position: row["position"] || row["job_title"] || row["title"] || row["role"] || null,
        company: row["company"] || row["company_name"] || row["brand"] || row["organisation"] || null,
        linkedin: row["linkedin"] || row["linkedin_url"] || row["linkedin_profile"] || null,
        notes: row["notes"] || null,
        category: row["category"] || row["industry"] || null,
        subcategory: row["subcategory"] || null,
        country: row["country"] || "UK",
      });
    }

    if (rows.length === 0) return NextResponse.json({ error: "No valid rows found" }, { status: 400 });

    const { error } = await db.from("uploaded_contacts").insert(rows);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ inserted: rows.length });
  }

  return NextResponse.json({ error: "Provide contact or csv" }, { status: 400 });
}

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const db = getSupabaseAdmin();
  const { data } = await db
    .from("uploaded_contacts")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function DELETE(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const { id } = await req.json();
  const db = getSupabaseAdmin();
  await db.from("uploaded_contacts").delete().eq("id", id);
  return NextResponse.json({ ok: true });
}
