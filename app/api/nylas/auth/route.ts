import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { nylasAuthUrl } from "@/lib/nylas";

export async function GET(request: Request) {
  const { userId } = await auth();
  const url = new URL(request.url);
  if (!userId) return NextResponse.redirect(new URL("/sign-in", url.origin));

  const returnTo = url.searchParams.get("returnTo") || "/inbox";
  const state = returnTo.startsWith("/") ? returnTo : "/inbox";
  const base = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const redirectUri = `${base}/api/nylas/callback`;

  return NextResponse.redirect(nylasAuthUrl(redirectUri, encodeURIComponent(state)));
}
