import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const cookieToken = cookieStore.get("ig_user_token")?.value;
  const accessToken = cookieToken || process.env.META_ACCESS_TOKEN;

  if (!accessToken) {
    return NextResponse.json({ error: "Not connected. Please connect your Instagram account." }, { status: 401 });
  }

  try {
    // Step 1: Get Facebook pages the user manages
    const pagesRes = await fetch(
      `https://graph.facebook.com/v21.0/me/accounts?access_token=${accessToken}`,
      { cache: "no-store" }
    );
    const pagesData = await pagesRes.json();
    if (pagesData.error) {
      return NextResponse.json({ error: pagesData.error.message }, { status: 400 });
    }

    const pages: { id: string; name: string }[] = pagesData.data || [];
    if (pages.length === 0) {
      return NextResponse.json(
        { error: "No Facebook Pages found. Make sure your token has pages_show_list permission." },
        { status: 404 }
      );
    }

    // Step 2: Find the Instagram Business Account linked to a page
    let igAccountId: string | null = null;
    for (const page of pages) {
      const igRes = await fetch(
        `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`,
        { cache: "no-store" }
      );
      const igData = await igRes.json();
      if (igData.instagram_business_account?.id) {
        igAccountId = igData.instagram_business_account.id;
        break;
      }
    }

    if (!igAccountId) {
      return NextResponse.json(
        { error: "No Instagram Business or Creator account found. Connect your Instagram to a Facebook Page and switch it to a Business or Creator account." },
        { status: 404 }
      );
    }

    // Step 3: Get profile info
    const profileRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}?fields=id,name,username,followers_count,follows_count,media_count,profile_picture_url,biography,website&access_token=${accessToken}`,
      { cache: "no-store" }
    );
    const profile = await profileRes.json();
    if (profile.error) {
      return NextResponse.json({ error: profile.error.message }, { status: 400 });
    }

    // Step 4: Get recent 30 posts
    const mediaRes = await fetch(
      `https://graph.facebook.com/v21.0/${igAccountId}/media?fields=id,caption,media_type,timestamp,like_count,comments_count,permalink,thumbnail_url,media_url&limit=30&access_token=${accessToken}`,
      { cache: "no-store" }
    );
    const mediaData = await mediaRes.json();
    if (mediaData.error) {
      return NextResponse.json({ error: mediaData.error.message }, { status: 400 });
    }
    const posts: Record<string, unknown>[] = mediaData.data || [];

    // Step 5: Fetch insights per post (reach, impressions, saved)
    // Do this in batches of 5 to avoid rate limits
    const postsWithInsights = await Promise.all(
      posts.map(async (post) => {
        try {
          const metrics =
            post.media_type === "VIDEO"
              ? "reach,impressions,saved,video_views"
              : "reach,impressions,saved";
          const insightsRes = await fetch(
            `https://graph.facebook.com/v21.0/${post.id}/insights?metric=${metrics}&access_token=${accessToken}`,
            { cache: "no-store" }
          );
          const insightsData = await insightsRes.json();
          const insights: Record<string, number> = {};
          if (insightsData.data) {
            for (const item of insightsData.data as { name: string; values?: { value: number }[]; value?: number }[]) {
              insights[item.name] = item.values?.[0]?.value ?? item.value ?? 0;
            }
          }
          return { ...post, insights };
        } catch {
          return { ...post, insights: {} };
        }
      })
    );

    return NextResponse.json({ profile, posts: postsWithInsights });
  } catch {
    return NextResponse.json({ error: "Failed to fetch Instagram data" }, { status: 500 });
  }
}
