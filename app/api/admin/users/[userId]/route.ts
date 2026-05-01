import { requireAdmin } from "@/lib/adminAuth";
import { getSupabaseAdmin } from "@/lib/supabase";
import { clerkClient } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

function parseDealValue(v: string | null | undefined): number {
  if (!v) return 0;
  const n = parseFloat(v.replace(/[^\d.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const result = await requireAdmin();
  if (result instanceof NextResponse) return result;

  const { userId } = params;
  const db = getSupabaseAdmin();
  const client = await clerkClient();

  const [clerkUser, { data: deals }, { data: emails }, { data: tickets }] = await Promise.all([
    client.users.getUser(userId),
    db.from("deals").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    db.from("email_log").select("id, contact_email, campaign_name, sent_at").eq("user_id", userId).order("sent_at", { ascending: false }).limit(50),
    db.from("tickets").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  const user = {
    id: clerkUser.id,
    name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "Unknown",
    email: clerkUser.emailAddresses?.[0]?.emailAddress || "",
    imageUrl: clerkUser.imageUrl,
    createdAt: new Date(clerkUser.createdAt).toISOString(),
    lastActiveAt: clerkUser.lastActiveAt ? new Date(clerkUser.lastActiveAt).toISOString() : null,
  };

  const AGREED_STATUSES = new Set(["contracted", "delivered", "paid"]);
  const agreedValue = (deals || [])
    .filter((d) => AGREED_STATUSES.has(d.status))
    .reduce((sum, d) => sum + parseDealValue(d.value), 0);

  return NextResponse.json({
    user,
    deals: deals || [],
    emails: emails || [],
    tickets: tickets || [],
    agreedValue,
  });
}
