import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { calculateViralScore } from "@/lib/viralScore";

const APIFY_BASE = "https://api.apify.com/v2";

interface ApifyPost {
  id?: string;
  shortCode?: string;
  caption?: string;
  commentsCount?: number;
  displayUrl?: string;
  videoViewCount?: number;
  likesCount?: number;
  timestamp: string;
  type?: string;          // "Video" | "Sidecar" | "Image"
  productType?: string;   // "clips" = Reel
  url?: string;
  ownerUsername?: string;
  ownerFollowersCount?: number;
}

// Poll an Apify run until SUCCEEDED or FAILED (max ~5 min)
async function waitForRun(runId: string, token: string): Promise<string> {
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 10_000));
    const res = await fetch(`${APIFY_BASE}/actor-runs/${runId}?token=${token}`);
    const { data } = await res.json();
    if (data.status === "SUCCEEDED") return data.defaultDatasetId;
    if (data.status === "FAILED" || data.status === "ABORTED") {
      throw new Error(`Apify run ${data.status}`);
    }
  }
  throw new Error("Apify run timed out after 5 minutes");
}

export async function POST(req: NextRequest) {
  // Protect endpoint (used by GitHub Actions cron)
  const secret = req.headers.get("x-cron-secret");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apifyToken = process.env.APIFY_TOKEN;
  if (!apifyToken) {
    return NextResponse.json({ error: "APIFY_TOKEN not configured" }, { status: 500 });
  }

  const sb = getSupabase();

  // Fetch active influencers
  const { data: influencers, error: infErr } = await sb
    .from("trend_influencers")
    .select("handle, followers")
    .eq("active", true);

  if (infErr || !influencers?.length) {
    return NextResponse.json({ error: "No active influencers found" }, { status: 400 });
  }

  const followerMap = new Map(influencers.map((i) => [i.handle, i.followers ?? 0]));

  // Log this refresh run
  const { data: logRow } = await sb
    .from("trend_refresh_log")
    .insert({ status: "running" })
    .select()
    .single();

  const logId = logRow?.id;

  try {
    // Start Apify run (async — don't block on completion)
    const startRes = await fetch(
      `${APIFY_BASE}/acts/apify~instagram-scraper/runs?token=${apifyToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          directUrls: influencers.map((i) => `https://www.instagram.com/${i.handle}/`),
          resultsType: "posts",
          resultsLimit: 20,
          addParentData: true,
        }),
      }
    );

    if (!startRes.ok) {
      const text = await startRes.text();
      throw new Error(`Apify start failed: ${text}`);
    }

    const { data: runData } = await startRes.json();
    const runId: string = runData.id;

    if (logId) {
      await sb.from("trend_refresh_log").update({ apify_run_id: runId }).eq("id", logId);
    }

    // Poll until complete
    const datasetId = await waitForRun(runId, apifyToken);

    // Fetch all results
    const resultsRes = await fetch(
      `${APIFY_BASE}/datasets/${datasetId}/items?token=${apifyToken}&limit=2000`
    );
    const apifyPosts: ApifyPost[] = await resultsRes.json();

    let saved = 0;
    let flagged = 0;
    const updatedFollowers = new Map<string, number>();

    for (const post of apifyPosts) {
      const handle = post.ownerUsername?.toLowerCase();
      if (!handle) continue;

      // Use live follower count from Apify if available, fall back to stored value
      const liveFollowers = post.ownerFollowersCount;
      if (liveFollowers) updatedFollowers.set(handle, liveFollowers);
      const followers = liveFollowers ?? followerMap.get(handle) ?? 0;

      // Reels have videoViewCount; images/carousels use likesCount as proxy
      const views = post.videoViewCount ?? 0;
      const likes = post.likesCount ?? 0;
      const comments = post.commentsCount ?? 0;

      const score = calculateViralScore({ views, likes, comments, followers });

      const postedAt = post.timestamp ? new Date(post.timestamp) : new Date();
      const daysOld = Math.floor((Date.now() - postedAt.getTime()) / 86_400_000);

      const mediaType =
        post.productType === "clips" || post.type === "Video"
          ? "REEL"
          : post.type === "Sidecar"
          ? "CAROUSEL"
          : "IMAGE";

      const postId = post.id ?? post.shortCode ?? "";
      const postUrl = post.url ?? (post.shortCode ? `https://www.instagram.com/p/${post.shortCode}/` : "");

      const { error } = await sb.from("trend_posts").upsert(
        {
          influencer_handle: handle,
          post_id: postId,
          post_url: postUrl,
          thumbnail_url: post.displayUrl ?? null,
          caption: post.caption ?? "",
          media_type: mediaType,
          posted_at: postedAt.toISOString(),
          scraped_at: new Date().toISOString(),
          followers_at_scrape: followers,
          views,
          likes,
          comments,
          views_followers_ratio: score.viewsFollowersRatio,
          like_rate: score.likeRate,
          comment_rate: score.commentRate,
          signal1: score.signal1,
          signal2: score.signal2,
          signal3: score.signal3,
          viral_score: score.total,
          flagged: score.flagged,
          days_old: daysOld,
        },
        { onConflict: "post_id" }
      );

      if (!error) {
        saved++;
        if (score.flagged) flagged++;
      }
    }

    // Update last_scraped_at and live follower counts
    const now = new Date().toISOString();
    await Promise.all(
      influencers.map((i) => {
        const patch: Record<string, unknown> = { last_scraped_at: now };
        if (updatedFollowers.has(i.handle)) patch.followers = updatedFollowers.get(i.handle);
        return sb.from("trend_influencers").update(patch).eq("handle", i.handle);
      })
    );

    if (logId) {
      await sb
        .from("trend_refresh_log")
        .update({ status: "done", posts_saved: saved, posts_flagged: flagged })
        .eq("id", logId);
    }

    return NextResponse.json({ ok: true, saved, flagged, total: apifyPosts.length });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (logId) {
      await sb.from("trend_refresh_log").update({ status: "failed", error: msg }).eq("id", logId);
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET — return last refresh log entry so UI can poll status
export async function GET() {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("trend_refresh_log")
    .select("*")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();

  if (error) return NextResponse.json(null);
  return NextResponse.json(data);
}
