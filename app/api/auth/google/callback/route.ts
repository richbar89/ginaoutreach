import { NextResponse } from "next/server";

function html(data: Record<string, string>) {
  return new NextResponse(
    `<!DOCTYPE html><html><body><script>
      try {
        const bc = new BroadcastChannel('google-oauth');
        bc.postMessage(${JSON.stringify({ type: "google-oauth", ...data })});
        setTimeout(() => { bc.close(); window.close(); }, 200);
      } catch(e) {
        window.opener && window.opener.postMessage(
          ${JSON.stringify({ type: "google-oauth", ...data })},
          window.location.origin
        );
        window.close();
      }
    </script></body></html>`,
    { headers: { "Content-Type": "text/html" } }
  );
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return html({ error: error || "No authorisation code returned." });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || url.origin;
  const redirectUri = `${base}/api/auth/google/callback`;

  // Exchange code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  const tokens = await tokenRes.json();

  if (!tokenRes.ok || !tokens.access_token) {
    return html({ error: tokens.error_description || "Token exchange failed." });
  }

  // Fetch user info
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = await userRes.json();

  return html({
    access_token: tokens.access_token,
    email: userInfo.email || "",
    name: userInfo.name || userInfo.email || "",
  });
}
