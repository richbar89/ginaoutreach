import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const userId = searchParams.get("state");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  if (error || !code) {
    return NextResponse.redirect(`${appUrl}/meta-analytics?error=auth_failed`);
  }

  if (!userId) {
    return NextResponse.redirect(`${appUrl}/meta-analytics?error=missing_state`);
  }

  const appId = process.env.META_APP_ID!;
  const appSecret = process.env.META_APP_SECRET!;
  const redirectUri = process.env.META_REDIRECT_URI!;

  try {
    const tokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `client_id=${appId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&client_secret=${appSecret}` +
        `&code=${code}`,
    );
    const tokenData = await tokenRes.json();
    if (tokenData.error) throw new Error(tokenData.error.message);

    const longTokenRes = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
        `grant_type=fb_exchange_token` +
        `&client_id=${appId}` +
        `&client_secret=${appSecret}` +
        `&fb_exchange_token=${tokenData.access_token}`,
    );
    const longTokenData = await longTokenRes.json();

    const pagesRes = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${longTokenData.access_token}`,
    );
    const pagesData = await pagesRes.json();
    const page = pagesData.data?.[0];
    if (!page)
      throw new Error(
        "No Facebook Page found. Make sure your Instagram is connected to a Facebook Page.",
      );

    const igRes = await fetch(
      `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`,
    );
    const igData = await igRes.json();
    const igAccountId = igData.instagram_business_account?.id;

    await getSupabaseAdmin().from("meta_connections").upsert({
      user_id: userId,
      access_token: longTokenData.access_token,
      page_id: page.id,
      page_name: page.name,
      ig_account_id: igAccountId ?? null,
      expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      connected_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return NextResponse.redirect(`${appUrl}/meta-analytics?connected=true`);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Meta OAuth error:", message);
    return NextResponse.redirect(`${appUrl}/meta-analytics?error=${encodeURIComponent(message)}`);
  }
}
