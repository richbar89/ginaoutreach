"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import {
  RefreshCw, ChevronUp, ChevronDown, ExternalLink, X,
  Flame, Users, BarChart2, Plus, Eye, Heart, MessageCircle,
} from "lucide-react";

// ── Types ────────────────────────────────────────────────────

type TrendPost = {
  id: string;
  influencer_handle: string;
  post_id: string;
  post_url: string;
  thumbnail_url?: string;
  caption?: string;
  media_type: "REEL" | "CAROUSEL" | "IMAGE";
  posted_at: string;
  days_old: number;
  followers_at_scrape: number;
  views: number;
  likes: number;
  comments: number;
  views_followers_ratio: number;
  like_rate: number;
  comment_rate: number;
  signal1: number;
  signal2: number;
  signal3: number;
  viral_score: number;
  flagged: boolean;
  notes?: string;
};

type TrendInfluencer = {
  id: string;
  handle: string;
  followers?: number;
  last_scraped_at?: string;
  active: boolean;
};

type RefreshLog = {
  status: "running" | "done" | "failed";
  started_at: string;
  posts_saved?: number;
  posts_flagged?: number;
  error?: string;
};

type SortField = "viral_score" | "views" | "likes" | "comments" | "days_old";
type SortDir = "asc" | "desc";

// ── Helpers ──────────────────────────────────────────────────

function fmt(n: number) {
  if (!n && n !== 0) return "—";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function scoreStyle(score: number) {
  if (score > 65) return { bg: "#FEF2F2", text: "#B91C1C", border: "#FECACA" };
  if (score >= 50) return { bg: "#FFFBEB", text: "#92400E", border: "#FDE68A" };
  return { bg: "var(--blush)", text: "#505D44", border: "var(--border)" };
}

// ── Component ────────────────────────────────────────────────

export default function TrendsPage() {
  const [posts, setPosts] = useState<TrendPost[]>([]);
  const [influencers, setInfluencers] = useState<TrendInfluencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshStatus, setRefreshStatus] = useState<RefreshLog | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPost, setSelectedPost] = useState<TrendPost | null>(null);
  const [notes, setNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const [showAccounts, setShowAccounts] = useState(false);

  // Filters
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const [filterHandle, setFilterHandle] = useState("all");
  const [filterMedia, setFilterMedia] = useState("all");
  const [filterDays, setFilterDays] = useState(14);
  const [minScore, setMinScore] = useState(0);

  // Sort
  const [sortField, setSortField] = useState<SortField>("viral_score");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Add influencer
  const [newHandle, setNewHandle] = useState("");
  const [newFollowers, setNewFollowers] = useState("");
  const [addingInfluencer, setAddingInfluencer] = useState(false);

  // ── Data fetching ─────────────────────────────────────────

  const loadPosts = useCallback(async () => {
    const params = new URLSearchParams({ days: filterDays.toString() });
    if (flaggedOnly) params.set("flagged", "1");
    if (filterHandle !== "all") params.set("handle", filterHandle);
    if (filterMedia !== "all") params.set("mediaType", filterMedia);

    const res = await fetch(`/api/trends/posts?${params}`);
    if (res.ok) setPosts(await res.json());
  }, [filterDays, flaggedOnly, filterHandle, filterMedia]);

  const loadInfluencers = async () => {
    const res = await fetch("/api/trends/influencers");
    if (res.ok) setInfluencers(await res.json());
  };

  const loadRefreshStatus = async () => {
    const res = await fetch("/api/trends/refresh");
    if (res.ok) {
      const data = await res.json();
      setRefreshStatus(data);
      if (data?.status === "running") setIsRefreshing(true);
      else setIsRefreshing(false);
    }
  };

  useEffect(() => {
    Promise.all([loadPosts(), loadInfluencers(), loadRefreshStatus()])
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { loadPosts(); }, [loadPosts]);

  // Poll while refresh is running
  useEffect(() => {
    if (!isRefreshing) return;
    const interval = setInterval(async () => {
      await loadRefreshStatus();
      if (refreshStatus?.status !== "running") {
        await loadPosts();
        clearInterval(interval);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [isRefreshing]);

  // ── Actions ───────────────────────────────────────────────

  const handleRefresh = async () => {
    setIsRefreshing(true);
    const res = await fetch("/api/trends/refresh", { method: "POST" });
    if (!res.ok) {
      setIsRefreshing(false);
    } else {
      loadRefreshStatus();
    }
  };

  const handleAddInfluencer = async () => {
    if (!newHandle.trim()) return;
    setAddingInfluencer(true);
    await fetch("/api/trends/influencers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: newHandle.trim().replace(/^@/, ""),
        followers: parseInt(newFollowers) || null,
      }),
    });
    setNewHandle("");
    setNewFollowers("");
    setAddingInfluencer(false);
    await loadInfluencers();
  };

  const handleRemoveInfluencer = async (handle: string) => {
    await fetch("/api/trends/influencers", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle }),
    });
    await loadInfluencers();
  };

  const handleSaveNotes = async () => {
    if (!selectedPost) return;
    setSavingNotes(true);
    const res = await fetch("/api/trends/posts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selectedPost.id, notes }),
    });
    if (res.ok) {
      const updated = await res.json();
      setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedPost(updated);
    }
    setSavingNotes(false);
  };

  // ── Sort & filter ─────────────────────────────────────────

  const sorted = useMemo(() => {
    return [...posts]
      .filter((p) => p.viral_score >= minScore)
      .sort((a, b) => {
        const va = (a[sortField] as number) ?? 0;
        const vb = (b[sortField] as number) ?? 0;
        return sortDir === "desc" ? vb - va : va - vb;
      });
  }, [posts, sortField, sortDir, minScore]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir((d) => (d === "desc" ? "asc" : "desc"));
    else { setSortField(field); setSortDir("desc"); }
  };

  const SortIcon = ({ field }: { field: SortField }) =>
    sortField !== field
      ? <ChevronDown size={11} className="opacity-25" />
      : sortDir === "desc"
      ? <ChevronDown size={11} className="text-coral-600" />
      : <ChevronUp size={11} className="text-coral-600" />;

  // ── Derived stats ─────────────────────────────────────────

  const flaggedCount = posts.filter((p) => p.flagged).length;
  const avgScore = posts.length
    ? Math.round(posts.reduce((s, p) => s + p.viral_score, 0) / posts.length)
    : 0;

  const lastRefreshLabel = refreshStatus
    ? refreshStatus.status === "running"
      ? "Refreshing…"
      : refreshStatus.status === "failed"
      ? `Failed: ${refreshStatus.error?.slice(0, 40)}`
      : `Last refresh: ${new Date(refreshStatus.started_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })} · ${refreshStatus.posts_saved} posts`
    : "Never refreshed";

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "var(--blush)" }}>

      {/* ── Header ── */}
      <div
        className="flex items-center justify-between px-8 pt-6 pb-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <h1 className="text-2xl font-black text-navy-900 tracking-tight">Trend Monitor</h1>
          <p className="text-xs font-medium text-navy-400 mt-0.5">{lastRefreshLabel}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAccounts((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border text-navy-700 text-sm font-semibold rounded-xl hover:border-coral-400 transition-all"
            style={{ borderColor: "var(--border)" }}
          >
            <Users size={14} />
            {influencers.length} accounts
          </button>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-all"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            {isRefreshing ? "Running…" : "Refresh Now"}
          </button>
        </div>
      </div>

      {/* ── Accounts panel ── */}
      {showAccounts && (
        <div
          className="px-8 py-4 flex-shrink-0 bg-white"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex gap-4">
            <div className="flex items-center gap-2 flex-shrink-0">
              <input
                type="text"
                value={newHandle}
                onChange={(e) => setNewHandle(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddInfluencer()}
                placeholder="@handle"
                className="input-base w-36 text-sm"
              />
              <input
                type="number"
                value={newFollowers}
                onChange={(e) => setNewFollowers(e.target.value)}
                placeholder="Followers"
                className="input-base w-28 text-sm"
              />
              <button
                onClick={handleAddInfluencer}
                disabled={addingInfluencer || !newHandle.trim()}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-50"
              >
                <Plus size={13} />
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 flex-1 items-center">
              {influencers.length === 0 ? (
                <p className="text-xs text-navy-400">No accounts yet — add one to get started.</p>
              ) : (
                influencers.map((inf) => (
                  <span
                    key={inf.handle}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-navy-50 border text-xs font-semibold text-navy-700"
                    style={{ borderColor: "var(--border)" }}
                  >
                    @{inf.handle}
                    {inf.followers ? (
                      <span className="text-navy-400 font-medium">· {fmt(inf.followers)}</span>
                    ) : null}
                    <button
                      onClick={() => handleRemoveInfluencer(inf.handle)}
                      className="ml-0.5 text-navy-300 hover:text-red-500 transition-colors"
                    >
                      <X size={11} />
                    </button>
                  </span>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Stats row ── */}
      <div className="grid grid-cols-4 gap-4 px-8 py-4 flex-shrink-0">
        {[
          { label: "Posts Tracked", value: posts.length, sub: `last ${filterDays} days` },
          { label: "Accounts", value: influencers.length, sub: "monitored" },
          { label: "Viral Wave 🔥", value: flaggedCount, sub: "score > 65", hot: flaggedCount > 0 },
          { label: "Avg Score", value: avgScore, sub: "across all posts" },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl px-4 py-3 border"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-[10px] font-black uppercase tracking-widest text-navy-400 mb-1.5">{s.label}</p>
            <p className={`text-2xl font-black leading-none ${s.hot ? "text-red-600" : "text-navy-900"}`}>
              {s.value}
            </p>
            <p className="text-[11px] text-navy-400 mt-1">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ── */}
      <div className="flex items-center gap-3 px-8 pb-3 flex-shrink-0 flex-wrap">
        <button
          onClick={() => setFlaggedOnly((v) => !v)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
            flaggedOnly
              ? "bg-red-500 text-white border-red-500"
              : "bg-white text-navy-600 border-[var(--border)]"
          }`}
        >
          <Flame size={12} />
          Viral Wave only
        </button>

        {[
          {
            value: filterHandle,
            onChange: setFilterHandle,
            options: [
              { value: "all", label: "All accounts" },
              ...influencers.map((i) => ({ value: i.handle, label: `@${i.handle}` })),
            ],
          },
          {
            value: filterMedia,
            onChange: setFilterMedia,
            options: [
              { value: "all", label: "All media" },
              { value: "REEL", label: "Reels" },
              { value: "CAROUSEL", label: "Carousels" },
              { value: "IMAGE", label: "Images" },
            ],
          },
          {
            value: filterDays.toString(),
            onChange: (v: string) => setFilterDays(parseInt(v)),
            options: [
              { value: "7", label: "Last 7 days" },
              { value: "14", label: "Last 14 days" },
              { value: "30", label: "Last 30 days" },
            ],
          },
        ].map((sel, i) => (
          <select
            key={i}
            value={sel.value}
            onChange={(e) => sel.onChange(e.target.value)}
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border bg-white text-navy-700 focus:outline-none focus:ring-2 focus:ring-coral-300/40"
            style={{ borderColor: "var(--border)" }}
          >
            {sel.options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        ))}

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-xs font-semibold text-navy-500">Min score</span>
          <input
            type="range" min={0} max={100} value={minScore}
            onChange={(e) => setMinScore(parseInt(e.target.value))}
            className="w-24 accent-[#A0C172]"
          />
          <span className="text-xs font-black text-navy-800 w-5">{minScore}</span>
        </div>
      </div>

      {/* ── Table ── */}
      <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thin px-8 pb-6">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <RefreshCw size={22} className="animate-spin text-navy-300" />
          </div>
        ) : sorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <BarChart2 size={32} className="text-navy-200 mb-3" />
            <p className="text-sm font-black text-navy-400">No posts yet.</p>
            <p className="text-xs text-navy-300 mt-1">Add accounts above, then hit Refresh Now.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)" }}>
                {(
                  [
                    { label: "Account" },
                    { label: "Post" },
                    { label: "Age", field: "days_old" },
                    { label: "Views", field: "views" },
                    { label: "Likes", field: "likes" },
                    { label: "Comments", field: "comments" },
                    { label: "V/F", title: "Views ÷ Followers" },
                    { label: "Score", field: "viral_score" },
                    { label: "Type" },
                  ] as { label: string; field?: string; title?: string }[]
                ).map((col) => (
                  <th
                    key={col.label}
                    title={col.title}
                    onClick={col.field ? () => toggleSort(col.field as SortField) : undefined}
                    className={`pb-2.5 pr-5 text-[10px] font-black uppercase tracking-widest text-navy-400 whitespace-nowrap ${
                      col.field ? "cursor-pointer select-none hover:text-navy-700" : ""
                    }`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {col.label}
                      {col.field && <SortIcon field={col.field as SortField} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sorted.map((post) => {
                const ss = scoreStyle(post.viral_score);
                return (
                  <tr
                    key={post.id}
                    onClick={() => { setSelectedPost(post); setNotes(post.notes ?? ""); }}
                    className="cursor-pointer transition-colors"
                    style={{
                      borderBottom: "1px solid var(--border)",
                      background: post.flagged ? "rgba(254,226,226,0.3)" : undefined,
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = post.flagged ? "rgba(254,226,226,0.5)" : "rgba(0,0,0,0.02)")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = post.flagged ? "rgba(254,226,226,0.3)" : "")}
                  >
                    <td className="py-3 pr-5">
                      <a
                        href={`https://instagram.com/${post.influencer_handle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-bold text-navy-800 hover:text-coral-600 transition-colors"
                      >
                        @{post.influencer_handle}
                      </a>
                    </td>
                    <td className="py-3 pr-5">
                      {post.thumbnail_url ? (
                        <img
                          src={post.thumbnail_url}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-navy-100 flex items-center justify-center">
                          <Eye size={12} className="text-navy-300" />
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-5 text-sm font-semibold text-navy-500">{post.days_old ?? "—"}d</td>
                    <td className="py-3 pr-5 text-sm font-bold text-navy-800">{fmt(post.views)}</td>
                    <td className="py-3 pr-5 text-sm font-bold text-navy-800">{fmt(post.likes)}</td>
                    <td className="py-3 pr-5 text-sm font-bold text-navy-800">{fmt(post.comments)}</td>
                    <td className="py-3 pr-5 text-sm font-bold text-navy-800">
                      {post.views_followers_ratio?.toFixed(2)}×
                    </td>
                    <td className="py-3 pr-5">
                      <span
                        className="inline-flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-lg border"
                        style={{ background: ss.bg, color: ss.text, borderColor: ss.border }}
                      >
                        {post.flagged && <Flame size={10} />}
                        {post.viral_score?.toFixed(0)}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                          post.media_type === "REEL"
                            ? "bg-violet-100 text-violet-700"
                            : post.media_type === "CAROUSEL"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-navy-100 text-navy-600"
                        }`}
                      >
                        {post.media_type}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Detail slide-over ── */}
      {selectedPost && (
        <>
          <div
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setSelectedPost(null)}
          />
          <div
            className="fixed top-5 right-5 bottom-5 w-[380px] bg-white rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden"
            style={{ border: "1px solid var(--border)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div>
                <span className="font-black text-navy-900 text-sm">@{selectedPost.influencer_handle}</span>
                <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-navy-400">
                  {selectedPost.media_type} · {selectedPost.days_old}d ago
                </span>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-1.5 rounded-lg hover:bg-navy-50 transition-colors"
              >
                <X size={15} className="text-navy-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-4">
              {/* Thumbnail */}
              {selectedPost.thumbnail_url && (
                <img
                  src={selectedPost.thumbnail_url}
                  alt=""
                  className="w-full rounded-xl object-cover aspect-square"
                />
              )}

              {/* Open button */}
              <a
                href={selectedPost.post_url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold rounded-xl transition-all"
              >
                <ExternalLink size={14} />
                Open on Instagram
              </a>

              {/* Score breakdown */}
              <div
                className="rounded-xl p-4 space-y-2.5"
                style={{ background: "var(--blush)", border: "1px solid var(--border)" }}
              >
                <p className="text-[10px] font-black uppercase tracking-widest text-navy-400 mb-1">
                  Viral Score Breakdown
                </p>
                {[
                  { label: "Views / Followers (40%)", score: selectedPost.signal1, value: `${selectedPost.views_followers_ratio?.toFixed(2)}×` },
                  { label: "Likes / Followers (35%)", score: selectedPost.signal2, value: `${selectedPost.like_rate?.toFixed(2)}%` },
                  { label: "Comments / Followers (25%)", score: selectedPost.signal3, value: `${selectedPost.comment_rate?.toFixed(2)}%` },
                ].map((row) => (
                  <div key={row.label} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-navy-600">{row.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-navy-400">{row.value}</span>
                      <span className="font-black text-navy-900 w-8 text-right">{row.score?.toFixed(0)}</span>
                    </div>
                  </div>
                ))}
                <div
                  className="border-t pt-2.5 flex items-center justify-between"
                  style={{ borderColor: "var(--border)" }}
                >
                  <span className="text-xs font-black text-navy-700">Total</span>
                  <span
                    className="text-sm font-black px-2.5 py-0.5 rounded-lg"
                    style={(() => { const s = scoreStyle(selectedPost.viral_score); return { background: s.bg, color: s.text }; })()}
                  >
                    {selectedPost.viral_score?.toFixed(0)} / 100
                    {selectedPost.flagged ? " 🔥" : ""}
                  </span>
                </div>
              </div>

              {/* Raw metrics */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { Icon: Eye, label: "Views", value: fmt(selectedPost.views) },
                  { Icon: Heart, label: "Likes", value: fmt(selectedPost.likes) },
                  { Icon: MessageCircle, label: "Comments", value: fmt(selectedPost.comments) },
                ].map(({ Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3 text-center border"
                    style={{ background: "var(--blush)", borderColor: "var(--border)" }}
                  >
                    <Icon size={13} className="text-navy-400 mx-auto mb-1.5" />
                    <p className="text-base font-black text-navy-900 leading-none">{value}</p>
                    <p className="text-[10px] font-semibold text-navy-400 mt-1">{label}</p>
                  </div>
                ))}
              </div>

              {/* Meta info */}
              <div
                className="rounded-xl p-3 space-y-1.5 text-xs border"
                style={{ borderColor: "var(--border)" }}
              >
                {[
                  { label: "Followers (at scrape)", value: fmt(selectedPost.followers_at_scrape) },
                  { label: "Posted", value: new Date(selectedPost.posted_at).toLocaleDateString("en-GB", { dateStyle: "medium" }) },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="font-semibold text-navy-500">{label}</span>
                    <span className="font-bold text-navy-800">{value}</span>
                  </div>
                ))}
              </div>

              {/* Caption */}
              {selectedPost.caption && (
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-navy-400 mb-2">
                    Caption
                  </p>
                  <p
                    className="text-xs text-navy-700 leading-relaxed rounded-xl p-3 whitespace-pre-wrap border"
                    style={{ background: "var(--blush)", borderColor: "var(--border)" }}
                  >
                    {selectedPost.caption}
                  </p>
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-navy-400 mb-2">
                  My Analysis Notes
                </p>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Hook style, audio, reel length, posting time, patterns…"
                  className="input-base resize-none text-xs"
                />
                <button
                  onClick={handleSaveNotes}
                  disabled={savingNotes}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-2 bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-60"
                >
                  {savingNotes ? "Saving…" : "Save Notes"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
