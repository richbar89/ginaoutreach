import { auth } from "@clerk/nextjs/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  const { message, context, level, path } = await req.json();
  if (!message) return NextResponse.json({ ok: false }, { status: 400 });

  const db = getSupabaseAdmin();
  await db.from("error_logs").insert({
    message: String(message).slice(0, 2000),
    context: context || null,
    user_id: userId || null,
    level: level || "error",
    path: path || null,
  });

  return NextResponse.json({ ok: true });
}
