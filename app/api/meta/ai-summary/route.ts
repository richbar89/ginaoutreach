import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { profile, insights, posts, engagementRate } = body;

  if (!profile) {
    return NextResponse.json(
      { error: "No analytics data provided" },
      { status: 400 },
    );
  }

  // Build a plain-English data summary to send to Claude
  const topPosts = [...(posts ?? [])]
    .sort(
      (
        a: { like_count?: number; comments_count?: number },
        b: { like_count?: number; comments_count?: number },
      ) =>
        (b.like_count ?? 0) +
        (b.comments_count ?? 0) -
        ((a.like_count ?? 0) + (a.comments_count ?? 0)),
    )
    .slice(0, 5);

  // Summarise insight metrics
  const metricSummary: Record<string, { total: number; count: number }> = {};
  for (const metric of insights ?? []) {
    const name = metric.name as string;
    const values = metric.values as { value: number }[];
    const total = values.reduce(
      (s: number, v: { value: number }) => s + (v.value ?? 0),
      0,
    );
    metricSummary[name] = { total, count: values.length };
  }

  const dataText = `
Instagram account: @${profile.username}
Followers: ${profile.followers_count?.toLocaleString()}
Total posts: ${profile.media_count}
Engagement rate (last 30 days avg): ${engagementRate}%

Last 30 days metrics:
- Total impressions: ${metricSummary.impressions?.total?.toLocaleString() ?? "N/A"}
- Total reach: ${metricSummary.reach?.total?.toLocaleString() ?? "N/A"}
- Profile views: ${metricSummary.profile_views?.total?.toLocaleString() ?? "N/A"}

Top 5 posts by engagement:
${topPosts
  .map(
    (
      p: {
        caption?: string;
        like_count?: number;
        comments_count?: number;
        media_type?: string;
      },
      i: number,
    ) =>
      `${i + 1}. [${p.media_type}] ${(p.caption ?? "").slice(0, 80)}... — ${p.like_count ?? 0} likes, ${p.comments_count ?? 0} comments`,
  )
  .join("\n")}
  `.trim();

  try {
    const message = await client.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: `You are a social media strategist. Analyse this Instagram data for a content creator and write a concise, actionable summary in plain English (no jargon). Cover: what's working well, what content formats are performing best, engagement health, and 3 specific improvement suggestions. Be direct and encouraging. Keep it under 250 words.

${dataText}`,
        },
      ],
    });

    const summary =
      message.content[0].type === "text" ? message.content[0].text : "";

    return NextResponse.json({ summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("AI summary error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
