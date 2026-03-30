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
  Loader2,
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
  if (type === "VIDEO") return <Film size={12} className="text-coral-400" />;
  if (type === "CAROUSEL_ALBUM") return <Layers size={12} className="text-navy-400" />;
  return <Image size={12} className="text-navy-300" />;
}

function StatCard({
  label,
  value,
  icon: Icon,
  sub,
  highlight,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-white border border-navy-200 rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400">{label}</p>
        <Icon size={15} className={highlight ? "text-coral-500" : "text-navy-300"} />
      </div>
      <p className={`text-3xl font-bold leading-none ${highlight ? "text-coral-500" : "text-navy-900"}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-navy-400 mt-1">{sub}</p>}
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
              Meta Analytics
            </h1>
            <p className="mt-2 text-navy-500 text-base">
              {connected && data
                ? `@${data.profile.username} · Last 30 days`
                : "Connect your Instagram Business account"}
            </p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {connected && data && (
              <button
                onClick={generateAiSummary}
                disabled={aiLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-navy-800 hover:bg-navy-900 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
              >
                {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                {aiLoading ? "Generating…" : "AI Summary"}
              </button>
            )}
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
            >
              {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 flex items-start gap-3 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl">
          <AlertCircle size={16} className="text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-24">
          <Loader2 size={20} className="animate-spin text-navy-300" />
        </div>
      )}

      {/* Not connected */}
      {!connected && !loading && (
        <div className="bg-white border border-navy-200 rounded-2xl p-16 text-center shadow-sm">
          <div className="w-16 h-16 rounded-2xl bg-coral-50 flex items-center justify-center mx-auto mb-5">
            <BarChart2 size={28} className="text-coral-400" />
          </div>
          <h2 className="text-2xl font-bold text-navy-800 mb-2">
            Connect your Meta account
          </h2>
          <p className="text-sm text-navy-400 max-w-sm mx-auto mb-8 leading-relaxed">
            Link your Instagram Business account to pull analytics.
            You&apos;ll need a Facebook Page connected to your Instagram.
          </p>
          <a
            href="/api/meta/auth"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
          >
            Connect with Meta <ExternalLink size={15} />
          </a>
          <p className="text-xs text-navy-300 mt-5">No posting access is requested.</p>
        </div>
      )}

      {/* Connected & loaded */}
      {connected && data && !loading && (
        <>
          <div className="flex items-center gap-2 mb-6 text-sm text-emerald-600 font-medium">
            <CheckCircle2 size={15} />
            Connected as @{data.profile.username}
          </div>

          {/* AI Summary */}
          {aiSummary && (
            <div className="mb-6 bg-white border border-navy-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-navy-100 flex items-center gap-2">
                <Sparkles size={14} className="text-coral-500" />
                <h3 className="text-sm font-semibold text-navy-800">AI Summary</h3>
              </div>
              <div className="px-6 py-5">
                <p className="text-sm text-navy-700 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
              </div>
            </div>
          )}

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
              highlight={parseFloat(data.engagementRate) >= 2}
            />
          </div>

          {/* Top posts */}
          <div className="bg-white border border-navy-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-navy-100 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-navy-800">Top Posts by Engagement</h3>
              <span className="text-xs text-navy-400">{topPosts.length} posts</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 divide-y md:divide-y-0 md:divide-x divide-navy-100">
              {topPosts.map((post) => (
                <a
                  key={post.id}
                  href={post.permalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group hover:bg-cream-50 transition-colors overflow-hidden"
                >
                  {(post.media_url || post.thumbnail_url) && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.thumbnail_url ?? post.media_url}
                      alt="Post thumbnail"
                      className="w-full h-36 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <div className="flex items-center gap-1.5 mb-2">
                      <MediaTypeIcon type={post.media_type} />
                      <span className="text-xs text-navy-400 capitalize">
                        {post.media_type?.toLowerCase().replace("_", " ")}
                      </span>
                      <span className="text-xs text-navy-300 ml-auto">
                        {new Date(post.timestamp).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {post.caption && (
                      <p className="text-xs text-navy-600 line-clamp-2 mb-3">{post.caption}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-navy-400">
                      <span className="flex items-center gap-1">
                        <Heart size={11} className="text-coral-400" /> {post.like_count.toLocaleString()}
                      </span>
                      <span className="flex items-center gap-1">
                        💬 {post.comments_count.toLocaleString()}
                      </span>
                      <ExternalLink size={11} className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-navy-400" />
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function MetaAnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <Loader2 size={20} className="animate-spin text-navy-300" />
        </div>
      }
    >
      <MetaAnalyticsInner />
    </Suspense>
  );
}
