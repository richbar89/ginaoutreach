import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get("ig_user_token")?.value;

  if (!token) {
    return NextResponse.json({ connected: false });
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v21.0/me?fields=id,name&access_token=${token}`,
      { cache: "no-store" }
    );
    const data = await res.json();

    if (data.error) {
      return NextResponse.json({ connected: false, expired: true });
    }

    return NextResponse.json({ connected: true, name: data.name });
  } catch {
    return NextResponse.json({ connected: false });
  }
}
