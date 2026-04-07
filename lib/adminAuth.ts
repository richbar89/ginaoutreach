import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

/** Verifies the current request is from the admin. Returns userId or a 403 response. */
export async function requireAdmin(): Promise<{ userId: string } | NextResponse> {
  const { userId } = await auth();
  if (!userId || userId !== ADMIN_USER_ID) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return { userId };
}

export function isAdminId(userId: string | null | undefined): boolean {
  return !!userId && userId === ADMIN_USER_ID;
}
