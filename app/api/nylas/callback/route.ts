import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { exchangeCodeForGrant } from "@/lib/nylas";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const { userId } = await auth();
  if (!userId) return NextResponse.redirect(new URL("/sign-in", url.origin));

  const rawState = decodeURIComponent(url.searchParams.get("state") || "/inbox");
  const returnTo = /^\/(?![\/\\])[\x20-\x7E]*$/.test(rawState) ? rawState : "/inbox";
  const redirect = (params: string) =>
    NextResponse.redirect(new URL(`${returnTo}${returnTo.includes("?") ? "&" : "?"}${params}`, url.origin));

  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  if (error || !code) {
    return redirect(`email_error=${encodeURIComponent(error || "No authorisation code returned.")}`);
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  try {
    const { grantId, email } = await exchangeCodeForGrant(code, `${base}/api/nylas/callback`);
    const db = getSupabaseAdmin();
    const { error: dbError } = await db
      .from("user_email_accounts")
      .upsert({ user_id: userId, email, nylas_grant_id: grantId }, { onConflict: "user_id" });
    if (dbError) {
      return redirect(`email_error=${encodeURIComponent("Connected but failed to save. Please try again.")}`);
    }
    return redirect("connected=1");
  } catch {
    return redirect(`email_error=${encodeURIComponent("Connection failed. Please try again.")}`);
  }
}
