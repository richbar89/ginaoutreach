import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { leads } from "@/lib/leads-data";

const BATCH = 100;

export async function POST() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const db = getSupabaseAdmin();

  // Check if already seeded
  const { count } = await db
    .from("uploaded_contacts")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) > 0) {
    return NextResponse.json({
      message: `Already seeded — table has ${count} contacts. Use DELETE first if you want to re-seed.`,
      count,
    });
  }

  let inserted = 0;
  const errors: string[] = [];

  for (let i = 0; i < leads.length; i += BATCH) {
    const batch = leads.slice(i, i + BATCH).map((l) => ({
      name: l.name,
      email: l.email.toLowerCase(),
      position: l.position || null,
      company: l.company || null,
      linkedin: l.linkedin || null,
      industry: l.industry || null,
      category: l.category || null,
    }));

    const { error } = await db.from("uploaded_contacts").insert(batch);
    if (error) {
      errors.push(`Batch ${Math.floor(i / BATCH) + 1}: ${error.message}`);
    } else {
      inserted += batch.length;
    }
  }

  return NextResponse.json({ inserted, total: leads.length, errors });
}
