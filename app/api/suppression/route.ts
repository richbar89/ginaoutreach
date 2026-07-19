import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { suppress, unsuppress } from "@/lib/suppression";

export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await request.json();
  if (!email?.trim()) return NextResponse.json({ error: "Missing email." }, { status: 400 });

  await suppress(userId, email.trim());
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { email } = await request.json();
  if (!email?.trim()) return NextResponse.json({ error: "Missing email." }, { status: 400 });

  await unsuppress(userId, email.trim());
  return NextResponse.json({ success: true });
}
