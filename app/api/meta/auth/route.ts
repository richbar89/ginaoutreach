import { NextResponse } from "next/server";

// Step 1 of Meta OAuth: redirect user to Meta's login page
export async function GET() {
  const appId = process.env.META_APP_ID;
  const redirectUri = process.env.META_REDIRECT_URI;

  if (!appId || !redirectUri) {
    return NextResponse.json(
      {
        error:
          "META_APP_ID and META_REDIRECT_URI must be set in environment variables",
      },
      { status: 500 },
    );
  }

  // Scopes needed: read Instagram business account data + insights
  const scopes = [
    "instagram_basic",
    "instagram_manage_insights",
    "pages_show_list",
    "pages_read_engagement",
    "business_management",
  ].join(",");

  const metaAuthUrl =
    `https://www.facebook.com/v19.0/dialog/oauth?` +
    `client_id=${appId}` +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&scope=${encodeURIComponent(scopes)}` +
    `&response_type=code`;

  return NextResponse.redirect(metaAuthUrl);
}
