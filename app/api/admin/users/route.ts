import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { clerkClient } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const client = await clerkClient();
  const { data: clerkUsers } = await client.users.getUserList({ limit: 200 });

  const db = getSupabaseAdmin();
  const { data: emailLog } = await db
    .from("email_log")
    .select("contact_email, sent_at");

  // Count emails per user_id — email_log doesn't store user_id so we tally total
  const totalEmails = emailLog?.length || 0;

  const users = clerkUsers.map((u) => ({
    id: u.id,
    name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown",
    email: u.emailAddresses?.[0]?.emailAddress || "",
    createdAt: new Date(u.createdAt).toISOString(),
    lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : null,
    imageUrl: u.imageUrl,
  }));

  return NextResponse.json({ users, totalEmails });
}
