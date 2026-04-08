/**
 * One-time script to seed the `uploaded_contacts` table from leads-data.ts.
 *
 * Run with:
 *   npx tsx scripts/seed-contacts.ts
 *
 * Requires env vars:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *
 * Safe to re-run — skips insert if contacts already exist.
 * Use --force flag to clear existing seeded contacts and re-insert:
 *   npx tsx scripts/seed-contacts.ts --force
 */

import { createClient } from "@supabase/supabase-js";
import { leads } from "../lib/leads-data";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const db = createClient(url, serviceKey);
const BATCH = 100;
const force = process.argv.includes("--force");

async function run() {
  // Check existing count
  const { count } = await db
    .from("uploaded_contacts")
    .select("id", { count: "exact", head: true });

  if ((count ?? 0) > 0 && !force) {
    console.log(`Contacts table already has ${count} records. Use --force to re-seed.`);
    return;
  }

  if (force && (count ?? 0) > 0) {
    console.log(`--force: deleting ${count} existing contacts…`);
    await db.from("uploaded_contacts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  }

  console.log(`Inserting ${leads.length} contacts in batches of ${BATCH}…`);
  let inserted = 0;

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
      console.error(`Batch ${Math.floor(i / BATCH) + 1} failed:`, error.message);
    } else {
      inserted += batch.length;
      process.stdout.write(`\r${inserted}/${leads.length}`);
    }
  }

  console.log(`\nDone. Seeded ${inserted} contacts.`);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
