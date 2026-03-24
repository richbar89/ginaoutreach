"use client";

import { useState } from "react";
import {
  BarChart2, RefreshCw, Sparkles, Heart, MessageCircle,
  Eye, Bookmark, Users, Image, Video, Layers, ExternalLink,
  AlertCircle, Loader2,
} from "lucide-react";

type Post = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  timestamp: string;
  like_count: number;
  comments_count: number;
  permalink: string;
  thumbnail_url?: string;
  media_url?: string;
  insights?: { reach?: number; impressions?: number; saved?: number; video_views?: number };
};

type Profile = {
  id: string;
  username: string;
  name?: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  profile_picture_url?: string;
  biography?: string;
};

function mediaTypeLabel(t: string) {
  if (t === "VIDEO") return "Reel";
  if (t === "CAROUSEL_ALBUM") return "Carousel";
  return "Photo";
}

function mediaTypeIcon(t: string) {
  if (t === "VIDEO") return <Video size={10} />;
  if (t === "CAROUSEL_ALBUM") return <Layers size={10} />;
  return <Image size={10} />;
}

function StatCard({
  label, value, sub, icon, highlight,
}: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">{label}</p>
        <span className={`${highlight ? "text-coral-500" : "text-navy-300"}`}>{icon}</span>
      </div>
      <p className={`font-serif text-3xl font-bold leading-none ${highlight ? "text-coral-500" : "text-navy-900"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-navy-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [analysing, setAnalysing] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    setAnalysis("");
    try {
      const res = await fetch("/api/instagram");
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setProfile(data.profile);
        setPosts(data.posts);
      }
    } catch {
      setError("Failed to connect to Instagram. Check your token has the right permissions.");
    } finally {
      setLoading(false);
    }
  };

  const runAnalysis = async () => {
    if (!profile || !posts.length) return;
    setAnalysing(true);
    setAnalysis("");
    try {
      const res = await fetch("/api/instagram/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile, posts }),
      });
      if (!res.ok || !res.body) {
        const err = await res.json();
        setError(err.error || "Analysis failed");
        setAnalysing(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let text = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        text += decoder.decode(value, { stream: true });
        setAnalysis(text);
      }
    } catch {
      setError("Analysis failed. Check your ANTHROPIC_API_KEY is set in Replit Secrets.");
    } finally {
      setAnalysing(false);
    }
  };

  // Compute stats
  const avgLikes = posts.length
    ? Math.round(posts.reduce((s, p) => s + p.like_count, 0) / posts.length)
    : 0;
  const avgComments = posts.length
    ? Math.round(posts.reduce((s, p) => s + p.comments_count, 0) / posts.length)
    : 0;
  const engagementRate = profile?.followers_count
    ? ((avgLikes + avgComments) / profile.followers_count * 100).toFixed(2)
    : "0";

  const byType = posts.reduce<Record<string, { count: number; likes: number }>>((acc, p) => {
    if (!acc[p.media_type]) acc[p.media_type] = { count: 0, likes: 0 };
    acc[p.media_type].count++;
    acc[p.media_type].likes += p.like_count;
    return acc;
  }, {});

  const bestType = Object.entries(byType).sort(
    (a, b) => b[1].likes / b[1].count - a[1].likes / a[1].count
  )[0]?.[0];

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-10 bg-coral-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">
            Social Intelligence
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold text-navy-900 leading-tight">
              My Analytics
            </h1>
            <p className="mt-2 text-navy-500 text-base">
              {profile ? `@${profile.username} · ${profile.followers_count?.toLocaleString()} followers` : "Connect your Instagram to get started"}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {posts.length > 0 && !analysing && (
              <button
                onClick={runAnalysis}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-900 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Sparkles size={14} />
                AI Analysis
              </button>
            )}
            <button
              onClick={fetchData}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              {posts.length ? "Refresh" : "Connect Instagram"}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-red-800">Error</p>
            <p className="text-xs text-red-600 mt-0.5">{error}</p>
            {error.includes("permission") || error.includes("token") ? (
              <p className="text-xs text-red-500 mt-2">
                Regenerate your META_ACCESS_TOKEN with these permissions:{" "}
                <code className="bg-red-100 px-1 rounded">instagram_basic</code>{" "}
                <code className="bg-red-100 px-1 rounded">instagram_manage_insights</code>{" "}
                <code className="bg-red-100 px-1 rounded">pages_read_engagement</code>{" "}
                <code className="bg-red-100 px-1 rounded">pages_show_list</code>
              </p>
            ) : null}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!profile && !loading && !error && (
        <div className="bg-white border border-cream-200 rounded-2xl p-16 text-center shadow-sm">
          <BarChart2 size={40} className="text-cream-300 mx-auto mb-4" />
          <h2 className="font-serif text-xl font-bold text-navy-800 mb-2">Connect your Instagram</h2>
          <p className="text-sm text-navy-400 max-w-sm mx-auto mb-8">
            Fetch your recent post data and let AI analyse what&apos;s working — best times, top content types, and specific recommendations.
          </p>
          <button
            onClick={fetchData}
            className="inline-flex items-center gap-2 px-6 py-3 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <RefreshCw size={14} /> Fetch My Data
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-cream-200 rounded-2xl p-5 h-24 animate-pulse" />
            ))}
          </div>
          <div className="bg-white border border-cream-200 rounded-2xl p-6 h-48 animate-pulse" />
        </div>
      )}

      {/* Data loaded */}
      {profile && !loading && (
        <>
          {/* Profile header */}
          <div className="bg-white border border-cream-200 rounded-2xl p-6 mb-6 shadow-sm flex items-center gap-5">
            {profile.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.profile_picture_url}
                alt={profile.username}
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-coral-100 flex items-center justify-center flex-shrink-0">
                <span className="font-serif text-2xl font-bold text-coral-500">
                  {profile.username?.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="font-serif text-xl font-bold text-navy-900">@{profile.username}</h2>
                <a
                  href={`https://instagram.com/${profile.username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-navy-300 hover:text-navy-600"
                >
                  <ExternalLink size={13} />
                </a>
              </div>
              {profile.name && <p className="text-sm text-navy-500">{profile.name}</p>}
              {profile.biography && (
                <p className="text-xs text-navy-400 mt-1 truncate max-w-lg">{profile.biography}</p>
              )}
            </div>
            <div className="flex items-center gap-6 flex-shrink-0 text-center">
              <div>
                <p className="font-serif text-2xl font-bold text-navy-900">{profile.followers_count?.toLocaleString()}</p>
                <p className="text-xs text-navy-400">Followers</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-navy-900">{profile.follows_count?.toLocaleString()}</p>
                <p className="text-xs text-navy-400">Following</p>
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-navy-900">{profile.media_count?.toLocaleString()}</p>
                <p className="text-xs text-navy-400">Posts</p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <StatCard label="Avg Likes" value={avgLikes.toLocaleString()} icon={<Heart size={15} />} />
            <StatCard label="Avg Comments" value={avgComments.toLocaleString()} icon={<MessageCircle size={15} />} />
            <StatCard
              label="Engagement Rate"
              value={`${engagementRate}%`}
              sub="likes + comments / followers"
              icon={<BarChart2 size={15} />}
              highlight={parseFloat(engagementRate) >= 2}
            />
            <StatCard
              label="Best Content Type"
              value={bestType ? mediaTypeLabel(bestType) : "—"}
              sub="highest avg likes"
              icon={<Sparkles size={15} />}
            />
          </div>

          {/* Content type breakdown */}
          {Object.keys(byType).length > 0 && (
            <div className="bg-white border border-cream-200 rounded-2xl p-6 mb-6 shadow-sm">
              <h3 className="text-sm font-semibold text-navy-800 mb-4">Content Breakdown</h3>
              <div className="space-y-3">
                {Object.entries(byType)
                  .sort((a, b) => b[1].likes / b[1].count - a[1].likes / a[1].count)
                  .map(([type, data]) => {
                    const avgL = Math.round(data.likes / data.count);
                    const maxAvg = Math.max(
                      ...Object.values(byType).map((d) => Math.round(d.likes / d.count))
                    );
                    const pct = Math.round((avgL / maxAvg) * 100);
                    return (
                      <div key={type}>
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-2">
                            <span className="text-navy-400">{mediaTypeIcon(type)}</span>
                            <span className="text-sm font-medium text-navy-700">{mediaTypeLabel(type)}</span>
                            <span className="text-xs text-navy-400">{data.count} posts</span>
                          </div>
                          <span className="text-sm font-semibold text-navy-800">{avgL.toLocaleString()} avg likes</span>
                        </div>
                        <div className="h-2 bg-cream-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-coral-400 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Recent posts grid */}
          {posts.length > 0 && (
            <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm mb-6">
              <div className="px-6 py-4 border-b border-cream-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-navy-800">Recent Posts</h3>
                <span className="text-xs text-navy-400">{posts.length} posts analysed</span>
              </div>
              <div className="grid grid-cols-5 gap-0 divide-x divide-cream-100">
                {posts.slice(0, 10).map((post) => (
                  <a
                    key={post.id}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-square overflow-hidden block hover:opacity-90 transition-opacity bg-cream-50"
                  >
                    {(post.thumbnail_url || post.media_url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.thumbnail_url || post.media_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-cream-100">
                        {mediaTypeIcon(post.media_type)}
                      </div>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-navy-900/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                      <div className="flex items-center gap-1 text-white text-xs font-semibold">
                        <Heart size={11} /> {post.like_count?.toLocaleString()}
                      </div>
                      <div className="flex items-center gap-1 text-white text-xs">
                        <MessageCircle size={11} /> {post.comments_count?.toLocaleString()}
                      </div>
                      {post.insights?.reach ? (
                        <div className="flex items-center gap-1 text-white text-xs">
                          <Eye size={11} /> {post.insights.reach?.toLocaleString()}
                        </div>
                      ) : null}
                      {post.insights?.saved ? (
                        <div className="flex items-center gap-1 text-white text-xs">
                          <Bookmark size={11} /> {post.insights.saved?.toLocaleString()}
                        </div>
                      ) : null}
                    </div>
                    {/* Type badge */}
                    <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 bg-black/50 rounded text-white text-[9px] font-medium">
                      {mediaTypeIcon(post.media_type)}
                      <span className="ml-0.5">{mediaTypeLabel(post.media_type)}</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-cream-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-coral-500" />
                <h3 className="text-sm font-semibold text-navy-800">AI Analysis</h3>
              </div>
              {!analysis && !analysing && (
                <button
                  onClick={runAnalysis}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold rounded-xl transition-colors"
                >
                  <Sparkles size={12} /> Analyse Now
                </button>
              )}
              {analysing && (
                <div className="flex items-center gap-1.5 text-xs text-navy-400">
                  <Loader2 size={12} className="animate-spin" /> Analysing…
                </div>
              )}
            </div>
            <div className="px-6 py-5">
              {!analysis && !analysing && (
                <div className="text-center py-8">
                  <Sparkles size={28} className="text-cream-300 mx-auto mb-3" />
                  <p className="text-sm text-navy-400">
                    Click &quot;Analyse Now&quot; and Claude will review your data and give personalised recommendations.
                  </p>
                  <p className="text-xs text-navy-300 mt-1">Takes about 10–15 seconds.</p>
                </div>
              )}
              {(analysis || analysing) && (
                <div className="prose prose-sm max-w-none text-navy-700 leading-relaxed">
                  {analysis.split("\n").map((line, i) => {
                    if (line.startsWith("**") && line.endsWith("**")) {
                      return (
                        <p key={i} className="font-semibold text-navy-900 mt-4 mb-1">
                          {line.replace(/\*\*/g, "")}
                        </p>
                      );
                    }
                    if (line.startsWith("- ") || line.startsWith("• ")) {
                      return (
                        <p key={i} className="ml-4 text-sm text-navy-600 my-0.5">
                          {line}
                        </p>
                      );
                    }
                    if (line.trim() === "") return <div key={i} className="h-2" />;
                    return (
                      <p key={i} className="text-sm text-navy-700 my-0.5">
                        {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                      </p>
                    );
                  })}
                  {analysing && (
                    <span className="inline-block w-1.5 h-4 bg-coral-400 animate-pulse ml-0.5 rounded-sm" />
                  )}
                </div>
              )}
            </div>
          </div>
        </>
      )}

    </div>
  );
}
