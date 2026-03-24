import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  const baseUrl = `${req.nextUrl.protocol}//${req.headers.get("host")}`;

  if (error || !code) {
    return NextResponse.redirect(`${baseUrl}/analytics?error=auth_cancelled`);
  }

  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;
  if (!appId || !appSecret) {
    return NextResponse.redirect(`${baseUrl}/analytics?error=config`);
  }

  const host = req.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const redirectUri = `${protocol}://${host}/api/auth/facebook/callback`;

  try {
    // Exchange code for short-lived token
    const tokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("Token exchange error:", tokenData.error);
      return NextResponse.redirect(`${baseUrl}/analytics?error=token_exchange`);
    }

    // Exchange for long-lived token (~60 days)
    const longTokenRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${appId}&client_secret=${appSecret}&fb_exchange_token=${tokenData.access_token}`
    );
    const longTokenData = await longTokenRes.json();
    const finalToken = longTokenData.access_token || tokenData.access_token;

    // Store in httpOnly cookie (60 days)
    const cookieStore = await cookies();
    cookieStore.set("ig_user_token", finalToken, {
      httpOnly: true,
      secure: protocol === "https",
      maxAge: 60 * 24 * 60 * 60,
      path: "/",
      sameSite: "lax",
    });

    return NextResponse.redirect(`${baseUrl}/analytics?connected=true`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    return NextResponse.redirect(`${baseUrl}/analytics?error=server`);
  }
}
