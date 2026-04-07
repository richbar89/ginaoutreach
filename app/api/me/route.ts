import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();
  return NextResponse.json({
    userId,
    email: user?.emailAddresses?.[0]?.emailAddress,
    NEXT_PUBLIC_ADMIN_USER_ID: process.env.NEXT_PUBLIC_ADMIN_USER_ID || "(not set)",
    match: userId === process.env.NEXT_PUBLIC_ADMIN_USER_ID,
  });
}
