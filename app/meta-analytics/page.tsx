"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  BarChart2,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Users,
  Eye,
  Heart,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Image,
  Film,
  Layers,
} from "lucide-react";

interface Post {
  id: string;
  caption?: string;
  media_type: string;
  media_url?: string;
  thumbnail_url?: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  permalink: string;
}

interface Profile {
  username: string;
  name: string;
  followers_count: number;
  follows_count: number;
  media_count: number;
  profile_picture_url?: string;
}

interface InsightValue {
  value: number;
  end_time: string;
}
interface Insight {
  name: string;
  values: InsightValue[];
}
interface AnalyticsData {
  profile: Profile;
  insights: Insight[];
  posts: Post[];
  engagementRate: string;
}

function MediaTypeIcon({ type }: { type: string }) {
  if (type === "VIDEO") return <Film size={12} className="text-violet-400" />;
  if (type === "CAROUSEL_ALBUM")
    return <Layers size={12} className="text-blue-400" />;
  return <Image size={12} className="text-slate-400" />;
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
}) {
  return (
    <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm">{label}</span>
        <Icon size={16} className="text-slate-500" />
      </div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function MetaAnalyticsInner() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [error, setError] = useState("");
  const [connected, setConnected] = useState(false);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/meta/analytics");
      const json = await res.json();
      if (json.error === "not_connected") {
        setConnected(false);
      } else if (json.error) {
        setError(json.error);
      } else {
        setData(json);
        setConnected(true);
      }
    } catch {
      setError("Failed to fetch analytics. Check your connection.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) setError(decodeURIComponent(errorParam));
    fetchAnalytics();
  }, [searchParams, fetchAnalytics]);

  async function generateAiSummary() {
    if (!data) return;
    setAiLoading(true);
    setAiSummary("");
    try {
      const res = await fetch("/api/meta/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setAiSummary(json.summary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "AI summary failed");
    } finally {
      setAiLoading(false);
    }
  }

  function getMetricTotal(name: string) {
    if (!data?.insights) return "—";
    const metric = data.insights.find((m) => m.name === name);
    if (!metric) return "—";
    return metric.values
      .reduce((s, v) => s + (v.value ?? 0), 0)
      .toLocaleString();
  }

  const topPosts = data
    ? [...data.posts]
        .sort(
          (a, b) =>
            b.like_count + b.comments_count - (a.like_count + a.comments_count),
        )
        .slice(0, 6)
    : [];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-violet-600 rounded-xl flex items-center justify-center">
              <BarChart2 size={18} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Meta Analytics</h1>
              <p className="text-slate-400 text-sm">
                Last 30 days · Instagram Business
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {connected && data && (
              <button
                onClick={generateAiSummary}
                disabled={aiLoading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-500 text-sm font-medium transition-colors disabled:opacity-50"
              >
                <Sparkles size={15} />
                {aiLoading ? "Generating…" : "AI Summary"}
              </button>
            )}
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-sm font-medium transition-colors disabled:opacity-50"
            >
              <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 px-4 py-3 rounded-lg bg-red-950 border border-red-800 text-red-300 text-sm">
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        {!connected && !loading && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center mb-5">
              <BarChart2 size={28} className="text-slate-500" />
            </div>
            <h2 className="text-lg font-semibold mb-2">
              Connect your Meta account
            </h2>
            <p className="text-slate-400 text-sm max-w-sm mb-6">
              Link your Instagram Business account to start pulling analytics.
              You&apos;ll need a Facebook Page connected to your Instagram.
            </p>
            <a
              href="/api/meta/auth"
              className="flex items-center gap-2 px-6 py-3 rounded-lg bg-violet-600 hover:bg-violet-500 font-medium transition-colors"
            >
              Connect with Meta <ExternalLink size={15} />
            </a>
            <p className="text-slate-600 text-xs mt-4">
              No posting access is requested.
            </p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-24">
            <RefreshCw size={24} className="animate-spin text-slate-500" />
          </div>
        )}

        {connected && data && !loading && (
          <>
            <div className="flex items-center gap-2 mb-6 text-sm text-emerald-400">
              <CheckCircle2 size={15} />
              Connected as @{data.profile.username}
            </div>

            {aiSummary && (
              <div className="mb-6 p-5 rounded-xl bg-violet-950 border border-violet-800">
                <div className="flex items-center gap-2 mb-3 text-violet-300 text-sm font-medium">
                  <Sparkles size={14} />
                  AI Summary
                </div>
                <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">
                  {aiSummary}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Followers"
                value={data.profile.followers_count?.toLocaleString() ?? "—"}
                icon={Users}
                sub={`${data.profile.media_count} posts total`}
              />
              <StatCard
                label="Impressions (30d)"
                value={getMetricTotal("impressions")}
                icon={Eye}
                sub="Total views"
              />
              <StatCard
                label="Reach (30d)"
                value={getMetricTotal("reach")}
                icon={TrendingUp}
                sub="Unique accounts"
              />
              <StatCard
                label="Engagement Rate"
                value={`${data.engagementRate}%`}
                icon={Heart}
                sub="Avg per post"
              />
            </div>

            <div>
              <h2 className="text-base font-semibold mb-4 text-slate-200">
                Top Posts by Engagement
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topPosts.map((post) => (
                  <a
                    key={post.id}
                    href={post.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group bg-slate-800 rounded-xl border border-slate-700 hover:border-violet-600 transition-colors overflow-hidden"
                  >
                    {(post.media_url || post.thumbnail_url) && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={post.thumbnail_url ?? post.media_url}
                        alt="Post thumbnail"
                        className="w-full h-40 object-cover"
                      />
                    )}
                    <div className="p-4">
                      <div className="flex items-center gap-1.5 mb-2">
                        <MediaTypeIcon type={post.media_type} />
                        <span className="text-xs text-slate-500 capitalize">
                          {post.media_type?.toLowerCase().replace("_", " ")}
                        </span>
                        <span className="text-xs text-slate-600 ml-auto">
                          {new Date(post.timestamp).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short" },
                          )}
                        </span>
                      </div>
                      {post.caption && (
                        <p className="text-slate-300 text-xs line-clamp-2 mb-3">
                          {post.caption}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span className="flex items-center gap-1">
                          <Heart size={11} /> {post.like_count.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          💬 {post.comments_count.toLocaleString()}
                        </span>
                        <ExternalLink
                          size={11}
                          className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity"
                        />
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function MetaAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <RefreshCw size={24} className="animate-spin text-slate-500" />
        </div>
      }
    >
      <MetaAnalyticsInner />
    </Suspense>
  );
}
