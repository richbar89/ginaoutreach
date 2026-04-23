import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "ANTHROPIC_API_KEY not configured in Replit Secrets" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { profile, posts } = await req.json();
  if (!profile || !posts?.length) {
    return new Response(JSON.stringify({ error: "No data to analyse" }), { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  // Build analytics summary
  const totalLikes = posts.reduce((s: number, p: Record<string, number>) => s + (p.like_count || 0), 0);
  const totalComments = posts.reduce((s: number, p: Record<string, number>) => s + (p.comments_count || 0), 0);
  const avgLikes = Math.round(totalLikes / posts.length);
  const avgComments = Math.round(totalComments / posts.length);
  const engagementRate = ((avgLikes + avgComments) / (profile.followers_count || 1) * 100).toFixed(2);

  // Group by media type
  const byType: Record<string, { count: number; likes: number; comments: number; reach: number }> = {};
  for (const post of posts) {
    const t = (post.media_type as string) || "UNKNOWN";
    if (!byType[t]) byType[t] = { count: 0, likes: 0, comments: 0, reach: 0 };
    byType[t].count++;
    byType[t].likes += (post.like_count as number) || 0;
    byType[t].comments += (post.comments_count as number) || 0;
    byType[t].reach += (post.insights as Record<string, number>)?.reach || 0;
  }

  // Posting day/hour distribution
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const dayCounts: Record<string, number> = {};
  const hourCounts: Record<number, { count: number; totalEngagement: number }> = {};
  for (const post of posts) {
    const d = new Date(post.timestamp as string);
    const day = dayNames[d.getDay()];
    dayCounts[day] = (dayCounts[day] || 0) + 1;
    const h = d.getHours();
    if (!hourCounts[h]) hourCounts[h] = { count: 0, totalEngagement: 0 };
    hourCounts[h].count++;
    hourCounts[h].totalEngagement += ((post.like_count as number) || 0) + ((post.comments_count as number) || 0);
  }

  // Best hours by avg engagement
  const bestHours = Object.entries(hourCounts)
    .map(([h, v]) => ({ hour: Number(h), avgEngagement: Math.round(v.totalEngagement / v.count) }))
    .sort((a, b) => b.avgEngagement - a.avgEngagement)
    .slice(0, 3);

  // Top performing posts
  const topPosts = [...posts]
    .sort((a, b) =>
      ((b.like_count as number) + (b.comments_count as number) * 3) -
      ((a.like_count as number) + (a.comments_count as number) * 3)
    )
    .slice(0, 5)
    .map((p) => ({
      type: p.media_type,
      likes: p.like_count,
      comments: p.comments_count,
      reach: (p.insights as Record<string, number>)?.reach,
      saved: (p.insights as Record<string, number>)?.saved,
      caption: (p.caption as string)?.slice(0, 200) || "(no caption)",
      date: new Date(p.timestamp as string).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    }));

  // Recent posting frequency
  const sortedDates = posts
    .map((p: { timestamp: string }) => new Date(p.timestamp))
    .sort((a: Date, b: Date) => b.getTime() - a.getTime());
  const daysBetween = sortedDates.length > 1
    ? (sortedDates[0].getTime() - sortedDates[sortedDates.length - 1].getTime()) / (1000 * 60 * 60 * 24)
    : 30;
  const postsPerWeek = ((posts.length / daysBetween) * 7).toFixed(1);

  const prompt = `You are an expert social media strategist analysing Instagram for @${profile.username}. This is a food, drink and lifestyle brand/creator account in the UK.

## Account Overview
- Username: @${profile.username}
- Followers: ${profile.followers_count?.toLocaleString()}
- Total posts: ${profile.media_count}
- Bio: ${profile.biography || "Not provided"}

## Performance (last ${posts.length} posts)
- Average likes: ${avgLikes}
- Average comments: ${avgComments}
- Engagement rate: ${engagementRate}%
- Posting frequency: ~${postsPerWeek} posts/week

## Content Type Breakdown
${Object.entries(byType).map(([type, d]) => {
  const label = type === "IMAGE" ? "Photos" : type === "VIDEO" ? "Reels/Videos" : type === "CAROUSEL_ALBUM" ? "Carousels" : type;
  return `- ${label}: ${d.count} posts | avg ${Math.round(d.likes / d.count)} likes, ${Math.round(d.comments / d.count)} comments${d.reach > 0 ? `, avg ${Math.round(d.reach / d.count).toLocaleString()} reach` : ""}`;
}).join("\n")}

## Best Posting Hours (by avg engagement)
${bestHours.map(h => `- ${h.hour}:00–${h.hour + 1}:00 → avg ${h.avgEngagement} engagements`).join("\n")}

## Posting Days
${Object.entries(dayCounts).sort((a, b) => b[1] - a[1]).map(([day, count]) => `- ${day}: ${count} posts`).join("\n")}

## Top 5 Posts
${topPosts.map((p, i) => {
  const label = p.type === "IMAGE" ? "Photo" : p.type === "VIDEO" ? "Reel" : p.type === "CAROUSEL_ALBUM" ? "Carousel" : p.type;
  return `${i + 1}. [${label}] ${p.date} — ${p.likes} likes, ${p.comments} comments${p.reach ? `, ${p.reach.toLocaleString()} reach` : ""}${p.saved ? `, ${p.saved} saves` : ""}
   Caption: "${p.caption}"`;
}).join("\n\n")}

---

Please give a warm, specific, actionable analysis. Format with clear headers. Cover:

**1. What's Working**
Which content types, topics and formats are getting the best engagement — and why.

**2. Best Times & Days to Post**
Based on the data above, give specific time windows (not generic advice).

**3. Posting Frequency**
Is ${postsPerWeek} posts/week right? What does the data suggest?

**4. Content Ideas**
Based on the top performers, give 3–5 specific content ideas they should try this month.

**5. Your #1 Quick Win**
The single most impactful thing they could do differently starting this week.

Be direct, specific and encouraging. Avoid generic social media advice — reference the actual data.`;

  const stream = client.messages.stream({
    model: "claude-opus-4-6",
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });

  const encoder = new TextEncoder();
  const readable = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of stream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(readable, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
    },
  });
}
