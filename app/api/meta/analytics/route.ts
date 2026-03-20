import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabase();
  const { data: conn, error } = await supabase
    .from("meta_connections")
    .select("*")
    .eq("id", 1)
    .single();

  if (error || !conn) {
    return NextResponse.json({ error: "not_connected" }, { status: 401 });
  }

  const { access_token, ig_account_id, page_id } = conn;

  try {
    const since = Math.floor((Date.now() - 30 * 24 * 60 * 60 * 1000) / 1000);
    const until = Math.floor(Date.now() / 1000);

    const insightsRes = await fetch(
      `https://graph.facebook.com/v19.0/${ig_account_id}/insights?` +
        `metric=impressions,reach,follower_count,profile_views` +
        `&period=day` +
        `&since=${since}` +
        `&until=${until}` +
        `&access_token=${access_token}`,
    );
    const insightsData = await insightsRes.json();

    const mediaRes = await fetch(
      `https://graph.facebook.com/v19.0/${ig_account_id}/media?` +
        `fields=id,caption,media_type,media_url,thumbnail_url,timestamp,like_count,comments_count,permalink` +
        `&limit=12` +
        `&access_token=${access_token}`,
    );
    const mediaData = await mediaRes.json();

    const profileRes = await fetch(
      `https://graph.facebook.com/v19.0/${ig_account_id}?` +
        `fields=username,name,biography,followers_count,follows_count,media_count,profile_picture_url,website` +
        `&access_token=${access_token}`,
    );
    const profileData = await profileRes.json();

    const posts = mediaData.data ?? [];
    const totalEngagement = posts.reduce(
      (sum: number, p: { like_count?: number; comments_count?: number }) =>
        sum + (p.like_count ?? 0) + (p.comments_count ?? 0),
      0,
    );
    const avgEngagement = posts.length > 0 ? totalEngagement / posts.length : 0;
    const engagementRate =
      profileData.followers_count > 0
        ? ((avgEngagement / profileData.followers_count) * 100).toFixed(2)
        : "0.00";

    if (posts.length > 0) {
      const rows = posts.map(
        (p: {
          id: string;
          permalink?: string;
          caption?: string;
          like_count?: number;
          comments_count?: number;
          timestamp?: string;
          media_type?: string;
        }) => ({
          account_handle: profileData.username,
          post_url: p.permalink ?? "",
          caption: p.caption ?? "",
          likes: p.like_count ?? 0,
          comments: p.comments_count ?? 0,
          reach: null,
          date: p.timestamp ? p.timestamp.split("T")[0] : null,
          type: p.media_type ?? "IMAGE",
        }),
      );
      await supabase
        .from("meta_posts")
        .upsert(rows, { onConflict: "post_url" });
    }

    return NextResponse.json({
      profile: profileData,
      insights: insightsData.data ?? [],
      posts,
      engagementRate,
      pageId: page_id,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
