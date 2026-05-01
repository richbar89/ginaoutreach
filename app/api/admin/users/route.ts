import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const client = await clerkClient();
  const { data: clerkUsers } = await client.users.getUserList({ limit: 200 });

  const db = getSupabaseAdmin();
  const [{ data: ticketsData }, { data: errorsData }, { data: emailLog }] = await Promise.all([
    db.from("tickets").select("user_id"),
    db.from("error_logs").select("user_id"),
    db.from("email_log").select("contact_email"),
  ]);

  const ticketsByUser: Record<string, number> = {};
  ticketsData?.forEach((t) => {
    if (t.user_id) ticketsByUser[t.user_id] = (ticketsByUser[t.user_id] || 0) + 1;
  });

  const errorsByUser: Record<string, number> = {};
  errorsData?.forEach((e) => {
    if (e.user_id) errorsByUser[e.user_id] = (errorsByUser[e.user_id] || 0) + 1;
  });

  const totalEmails = emailLog?.length || 0;

  const users = clerkUsers.map((u) => ({
    id: u.id,
    name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Unknown",
    email: u.emailAddresses?.[0]?.emailAddress || "",
    createdAt: new Date(u.createdAt).toISOString(),
    lastActiveAt: u.lastActiveAt ? new Date(u.lastActiveAt).toISOString() : null,
    imageUrl: u.imageUrl,
    tickets: ticketsByUser[u.id] || 0,
    errors: errorsByUser[u.id] || 0,
  }));

  return NextResponse.json({ users, totalEmails });
}

export async function DELETE(req: NextRequest) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const userId = req.nextUrl.searchParams.get("userId");
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

  // Prevent self-deletion
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID;
  if (userId === adminId) {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }

  const db = getSupabaseAdmin();
  const client = await clerkClient();

  await Promise.all([
    db.from("tickets").delete().eq("user_id", userId),
    db.from("error_logs").delete().eq("user_id", userId),
  ]);

  await client.users.deleteUser(userId);

  return NextResponse.json({ ok: true });
}
