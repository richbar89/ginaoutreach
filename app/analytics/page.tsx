"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart2, RefreshCw, Sparkles, Heart, MessageCircle,
  Eye, Bookmark, Image, Video, Layers, ExternalLink,
  AlertCircle, Loader2, LogIn, LogOut,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────
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

type ConnectionStatus = "checking" | "connected" | "disconnected";

// ── Helpers ───────────────────────────────────────────────────
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
function getOAuthError(code: string | null): string {
  switch (code) {
    case "auth_cancelled": return "Facebook login was cancelled.";
    case "token_exchange": return "Could not exchange login code for a token. Try again.";
    case "config": return "App is missing META_APP_ID or META_APP_SECRET.";
    case "server": return "An unexpected server error occurred during login.";
    default: return "Something went wrong. Please try connecting again.";
  }
}

// ── Placeholder weekly chart ──────────────────────────────────
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const PLACEHOLDER_VIEWS = [4200, 6800, 5100, 9400, 7700, 12300, 8600];

function WeeklyChart({ data = PLACEHOLDER_VIEWS, placeholder = false }: { data?: number[]; placeholder?: boolean }) {
  const max = Math.max(...data);
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 120 }}>
        {data.map((v, i) => {
          const pct = max > 0 ? (v / max) * 100 : 0;
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
              <span style={{ fontSize: 10, color: "#B5AFA8", fontWeight: 600 }}>
                {placeholder ? "" : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
              </span>
              <div
                style={{
                  width: "100%",
                  height: `${pct}%`,
                  minHeight: 8,
                  borderRadius: "6px 6px 0 0",
                  background: placeholder
                    ? "linear-gradient(180deg, #E8E2DA 0%, #F0EBE5 100%)"
                    : i === 5
                    ? "linear-gradient(180deg, #D4795C 0%, #E89478 100%)"
                    : "linear-gradient(180deg, #4BBFB0 0%, #7DD4CD 100%)",
                  transition: "height 0.5s ease",
                  opacity: placeholder ? 0.5 : 1,
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        {DAYS.map(d => (
          <div key={d} style={{ flex: 1, textAlign: "center", fontSize: 11, color: "#B5AFA8", fontWeight: 600 }}>{d}</div>
        ))}
      </div>
    </div>
  );
}

// ── Social platform cards ─────────────────────────────────────
const PLATFORMS = [
  {
    key: "instagram",
    label: "Instagram",
    color: "#E1306C",
    bg: "rgba(225,48,108,0.08)",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#E1306C" strokeWidth="2" fill="none"/>
        <circle cx="12" cy="12" r="4" stroke="#E1306C" strokeWidth="2" fill="none"/>
        <circle cx="17.5" cy="6.5" r="1.2" fill="#E1306C"/>
      </svg>
    ),
  },
  {
    key: "tiktok",
    label: "TikTok",
    color: "#010101",
    bg: "rgba(0,0,0,0.06)",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#010101">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.22 8.22 0 004.82 1.56V6.78a4.85 4.85 0 01-1.05-.09z"/>
      </svg>
    ),
  },
  {
    key: "youtube",
    label: "YouTube",
    color: "#FF0000",
    bg: "rgba(255,0,0,0.07)",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#FF0000">
        <path d="M23.5 6.19a3.02 3.02 0 00-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 00.5 6.19C0 8.08 0 12 0 12s0 3.92.5 5.81a3.02 3.02 0 002.12 2.14C4.5 20.5 12 20.5 12 20.5s7.5 0 9.38-.55a3.02 3.02 0 002.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.81zM9.75 15.52V8.48L15.82 12l-6.07 3.52z"/>
      </svg>
    ),
  },
  {
    key: "pinterest",
    label: "Pinterest",
    color: "#E60023",
    bg: "rgba(230,0,35,0.07)",
    icon: (
      <svg viewBox="0 0 24 24" width="22" height="22" fill="#E60023">
        <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
      </svg>
    ),
  },
];

function SocialCard({ platform, followers, placeholder }: { platform: typeof PLATFORMS[0]; followers?: number; placeholder?: boolean }) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #EDE8E1", borderRadius: 16, padding: "18px 20px", display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: platform.bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {platform.icon}
      </div>
      <div>
        <p style={{ fontSize: 11, fontWeight: 600, color: "#9E9790", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>{platform.label}</p>
        {placeholder ? (
          <div style={{ height: 20, width: 64, background: "#EDE8E1", borderRadius: 6, opacity: 0.6 }} />
        ) : (
          <p style={{ fontSize: 22, fontWeight: 800, color: "#1A1A1A", fontFamily: "'Sora', sans-serif", letterSpacing: "-0.04em", lineHeight: 1 }}>
            {followers !== undefined ? followers.toLocaleString() : "—"}
          </p>
        )}
      </div>
      {!placeholder && (
        <div style={{ marginLeft: "auto", fontSize: 11, fontWeight: 600, color: "#4BBFB0", background: "rgba(75,191,176,0.1)", borderRadius: 20, padding: "3px 10px" }}>Live</div>
      )}
    </div>
  );
}

// ── Stat card ─────────────────────────────────────────────────
function StatCard({ label, value, sub, icon, highlight }: {
  label: string; value: string | number; sub?: string; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div style={{ background: "#fff", border: "1.5px solid #EDE8E1", borderRadius: 16, padding: "18px 20px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9E9790" }}>{label}</p>
        <span style={{ color: highlight ? "#D4795C" : "#C5C0BA" }}>{icon}</span>
      </div>
      <p style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Sora', sans-serif", letterSpacing: "-0.04em", color: highlight ? "#D4795C" : "#1A1A1A", lineHeight: 1 }}>
        {value}
      </p>
      {sub && <p style={{ fontSize: 11, color: "#9E9790", marginTop: 4 }}>{sub}</p>}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("checking");
  const [connectedName, setConnectedName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [analysis, setAnalysis] = useState("");
  const [analysing, setAnalysing] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true); setError(""); setAnalysis("");
    try {
      const res = await fetch("/api/instagram");
      const data = await res.json();
      if (data.error) setError(data.error);
      else { setProfile(data.profile); setPosts(data.posts); }
    } catch { setError("Failed to connect to Instagram."); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const connected = params.get("connected");
    const errorCode = params.get("error");
    if (connected || errorCode) window.history.replaceState({}, "", "/analytics");
    if (errorCode) { setError(getOAuthError(errorCode)); setConnectionStatus("disconnected"); return; }
    (async () => {
      try {
        const res = await fetch("/api/auth/instagram/status");
        const data = await res.json();
        if (data.connected) { setConnectionStatus("connected"); setConnectedName(data.name || ""); fetchData(); }
        else { setConnectionStatus("disconnected"); if (data.expired) setError("Your Instagram connection has expired. Please reconnect."); }
      } catch { setConnectionStatus("disconnected"); }
    })();
  }, [fetchData]);

  const disconnect = async () => {
    await fetch("/api/auth/instagram/disconnect", { method: "POST" });
    setConnectionStatus("disconnected"); setConnectedName(""); setProfile(null); setPosts([]); setAnalysis(""); setError("");
  };

  const runAnalysis = async () => {
    if (!profile || !posts.length) return;
    setAnalysing(true); setAnalysis("");
    try {
      const res = await fetch("/api/instagram/analyze", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ profile, posts }) });
      if (!res.ok || !res.body) { const err = await res.json(); setError(err.error || "Analysis failed"); setAnalysing(false); return; }
      const reader = res.body.getReader(); const decoder = new TextDecoder(); let text = "";
      while (true) { const { done, value } = await reader.read(); if (done) break; text += decoder.decode(value, { stream: true }); setAnalysis(text); }
    } catch { setError("Analysis failed."); }
    finally { setAnalysing(false); }
  };

  const avgLikes = posts.length ? Math.round(posts.reduce((s, p) => s + p.like_count, 0) / posts.length) : 0;
  const avgComments = posts.length ? Math.round(posts.reduce((s, p) => s + p.comments_count, 0) / posts.length) : 0;
  const engagementRate = profile?.followers_count ? ((avgLikes + avgComments) / profile.followers_count * 100).toFixed(2) : "0";
  const byType = posts.reduce<Record<string, { count: number; likes: number }>>((acc, p) => {
    if (!acc[p.media_type]) acc[p.media_type] = { count: 0, likes: 0 };
    acc[p.media_type].count++; acc[p.media_type].likes += p.like_count;
    return acc;
  }, {});
  const bestType = Object.entries(byType).sort((a, b) => b[1].likes / b[1].count - a[1].likes / a[1].count)[0]?.[0];

  const isConnected = connectionStatus === "connected";

  return (
    <div style={{ padding: "32px", maxWidth: 960, margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16, marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#D4795C", marginBottom: 6 }}>Social Intelligence</p>
          <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: 30, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.035em", lineHeight: 1 }}>
            My Analytics
          </h1>
          <p style={{ fontSize: 14, color: "#9E9790", marginTop: 6 }}>
            {profile ? `@${profile.username} · ${profile.followers_count?.toLocaleString()} followers` : isConnected ? `Connected as ${connectedName}` : "Connect your platforms to see live data"}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
          {posts.length > 0 && !analysing && (
            <button onClick={runAnalysis} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#1A1A1A", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <Sparkles size={13} /> AI Analysis
            </button>
          )}
          {isConnected && (
            <button onClick={fetchData} disabled={loading} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "#D4795C", color: "#fff", border: "none", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: loading ? 0.6 : 1 }}>
              {loading ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Refresh
            </button>
          )}
          {isConnected && (
            <button onClick={disconnect} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "9px 16px", background: "transparent", color: "#9E9790", border: "1.5px solid #EDE8E1", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
              <LogOut size={13} /> Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "14px 16px", background: "#FEF2F2", border: "1.5px solid #FECACA", borderRadius: 14, marginBottom: 20 }}>
          <AlertCircle size={15} style={{ color: "#EF4444", flexShrink: 0, marginTop: 1 }} />
          <div><p style={{ fontSize: 13, fontWeight: 600, color: "#991B1B" }}>Error</p><p style={{ fontSize: 12, color: "#DC2626", marginTop: 2 }}>{error}</p></div>
        </div>
      )}

      {/* ── OVERVIEW: chart + social platforms ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 20 }}>

        {/* Weekly views chart */}
        <div style={{ background: "#fff", border: "1.5px solid #EDE8E1", borderRadius: 20, padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#9E9790", marginBottom: 3 }}>Weekly Views</p>
              <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.04em", lineHeight: 1 }}>
                {isConnected && profile ? profile.media_count?.toLocaleString() : "54.4k"}
              </p>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#4BBFB0", background: "rgba(75,191,176,0.1)", borderRadius: 20, padding: "4px 10px" }}>
              {isConnected ? "Live" : "Preview"}
            </div>
          </div>
          <WeeklyChart placeholder={!isConnected} />
        </div>

        {/* Social platforms */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PLATFORMS.map(p => (
            <SocialCard
              key={p.key}
              platform={p}
              followers={p.key === "instagram" && profile ? profile.followers_count : undefined}
              placeholder={!isConnected || p.key !== "instagram"}
            />
          ))}
        </div>
      </div>

      {/* Checking */}
      {connectionStatus === "checking" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
          <Loader2 size={20} style={{ color: "#C5C0BA", animation: "spin 1s linear infinite" }} />
        </div>
      )}

      {/* Connect prompt */}
      {connectionStatus === "disconnected" && (
        <div style={{ background: "#fff", border: "1.5px solid #EDE8E1", borderRadius: 20, padding: "48px 32px", textAlign: "center" }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: "rgba(24,119,242,0.08)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <svg viewBox="0 0 24 24" fill="#1877F2" style={{ width: 28, height: 28 }}>
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </div>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em", marginBottom: 8 }}>
            Connect your Instagram
          </h2>
          <p style={{ fontSize: 14, color: "#9E9790", maxWidth: 360, margin: "0 auto 24px", lineHeight: 1.6 }}>
            Connect your Instagram Business or Creator account via Facebook to see post performance, engagement rates, and AI-powered recommendations.
          </p>
          <a
            href="/api/auth/facebook"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#1877F2", color: "#fff", borderRadius: 12, fontSize: 14, fontWeight: 700, textDecoration: "none" }}
          >
            <LogIn size={15} /> Continue with Facebook
          </a>
          <p style={{ fontSize: 12, color: "#C5C0BA", marginTop: 16 }}>
            Requires an Instagram Business or Creator account linked to a Facebook page.
          </p>
        </div>
      )}

      {/* Loading skeleton */}
      {isConnected && loading && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
            {[...Array(4)].map((_, i) => <div key={i} style={{ background: "#F5F0EA", borderRadius: 16, height: 90, animation: "pulse 1.5s ease-in-out infinite" }} />)}
          </div>
          <div style={{ background: "#F5F0EA", borderRadius: 20, height: 200, animation: "pulse 1.5s ease-in-out infinite" }} />
        </div>
      )}

      {/* Connected data */}
      {profile && !loading && (
        <>
          {/* Profile card */}
          <div style={{ background: "#fff", border: "1.5px solid #EDE8E1", borderRadius: 20, padding: "20px 24px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16 }}>
            {profile.profile_picture_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile.profile_picture_url} alt={profile.username} style={{ width: 56, height: 56, borderRadius: 14, objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{ width: 56, height: 56, borderRadius: 14, background: "rgba(212,121,92,0.1)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: "#D4795C" }}>{profile.username?.charAt(0).toUpperCase()}</span>
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 17, fontWeight: 800, color: "#1A1A1A" }}>@{profile.username}</span>
                <a href={`https://instagram.com/${profile.username}`} target="_blank" rel="noopener noreferrer" style={{ color: "#C5C0BA" }}><ExternalLink size={12} /></a>
              </div>
              {profile.biography && <p style={{ fontSize: 12, color: "#9E9790", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 500 }}>{profile.biography}</p>}
            </div>
            <div style={{ display: "flex", gap: 28, flexShrink: 0, textAlign: "center" }}>
              {[{ v: profile.followers_count, l: "Followers" }, { v: profile.follows_count, l: "Following" }, { v: profile.media_count, l: "Posts" }].map(({ v, l }) => (
                <div key={l}>
                  <p style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em" }}>{v?.toLocaleString()}</p>
                  <p style={{ fontSize: 11, color: "#9E9790" }}>{l}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Stat row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 16 }}>
            <StatCard label="Avg Likes" value={avgLikes.toLocaleString()} icon={<Heart size={14} />} />
            <StatCard label="Avg Comments" value={avgComments.toLocaleString()} icon={<MessageCircle size={14} />} />
            <StatCard label="Engagement Rate" value={`${engagementRate}%`} sub="likes + comments / followers" icon={<BarChart2 size={14} />} highlight={parseFloat(engagementRate) >= 2} />
            <StatCard label="Best Content" value={bestType ? mediaTypeLabel(bestType) : "—"} sub="highest avg likes" icon={<Sparkles size={14} />} />
          </div>

          {/* Content breakdown */}
          {Object.keys(byType).length > 0 && (
            <div style={{ background: "#fff", border: "1.5px solid #EDE8E1", borderRadius: 20, padding: "20px 24px", marginBottom: 16 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A", marginBottom: 16 }}>Content Breakdown</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(byType).sort((a, b) => b[1].likes / b[1].count - a[1].likes / a[1].count).map(([type, data]) => {
                  const avgL = Math.round(data.likes / data.count);
                  const maxAvg = Math.max(...Object.values(byType).map(d => Math.round(d.likes / d.count)));
                  return (
                    <div key={type}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ color: "#9E9790" }}>{mediaTypeIcon(type)}</span>
                          <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A1A" }}>{mediaTypeLabel(type)}</span>
                          <span style={{ fontSize: 11, color: "#C5C0BA" }}>{data.count} posts</span>
                        </div>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>{avgL.toLocaleString()} avg likes</span>
                      </div>
                      <div style={{ height: 8, background: "#F0EBE5", borderRadius: 99, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${Math.round((avgL / maxAvg) * 100)}%`, background: "linear-gradient(90deg, #4BBFB0, #7DD4CD)", borderRadius: 99, transition: "width 0.5s ease" }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent posts */}
          {posts.length > 0 && (
            <div style={{ background: "#fff", border: "1.5px solid #EDE8E1", borderRadius: 20, overflow: "hidden", marginBottom: 16 }}>
              <div style={{ padding: "16px 24px", borderBottom: "1px solid #F0EBE5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>Recent Posts</p>
                <span style={{ fontSize: 12, color: "#C5C0BA" }}>{posts.length} posts analysed</span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)" }}>
                {posts.slice(0, 10).map(post => (
                  <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer"
                    style={{ position: "relative", aspectRatio: "1", overflow: "hidden", display: "block", background: "#F5F0EA" }}>
                    {(post.thumbnail_url || post.media_url) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.thumbnail_url || post.media_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>{mediaTypeIcon(post.media_type)}</div>
                    )}
                    <div className="group-hover:opacity-100" style={{ position: "absolute", inset: 0, background: "rgba(26,26,26,0.7)", opacity: 0, transition: "opacity 0.2s", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#fff", fontSize: 11, fontWeight: 600 }}><Heart size={10} /> {post.like_count?.toLocaleString()}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#fff", fontSize: 11 }}><MessageCircle size={10} /> {post.comments_count?.toLocaleString()}</div>
                      {post.insights?.reach && <div style={{ display: "flex", alignItems: "center", gap: 4, color: "#fff", fontSize: 11 }}><Eye size={10} /> {post.insights.reach?.toLocaleString()}</div>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* AI Analysis */}
          <div style={{ background: "#fff", border: "1.5px solid #EDE8E1", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ padding: "16px 24px", borderBottom: "1px solid #F0EBE5", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Sparkles size={14} style={{ color: "#D4795C" }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: "#1A1A1A" }}>AI Analysis</p>
              </div>
              {!analysis && !analysing && (
                <button onClick={runAnalysis} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "7px 14px", background: "#D4795C", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                  <Sparkles size={11} /> Analyse Now
                </button>
              )}
              {analysing && <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#9E9790" }}><Loader2 size={12} className="animate-spin" /> Analysing…</div>}
            </div>
            <div style={{ padding: "20px 24px" }}>
              {!analysis && !analysing && (
                <div style={{ textAlign: "center", padding: "32px 0" }}>
                  <Sparkles size={24} style={{ color: "#C5C0BA", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 13, color: "#9E9790" }}>Click &ldquo;Analyse Now&rdquo; and Claude will review your data and give personalised recommendations.</p>
                  <p style={{ fontSize: 11, color: "#C5C0BA", marginTop: 4 }}>Takes about 10–15 seconds.</p>
                </div>
              )}
              {(analysis || analysing) && (
                <div style={{ fontSize: 13, color: "#4B4540", lineHeight: 1.7 }}>
                  {analysis.split("\n").map((line, i) => {
                    if (line.startsWith("**") && line.endsWith("**")) return <p key={i} style={{ fontWeight: 700, color: "#1A1A1A", marginTop: 14, marginBottom: 4 }}>{line.replace(/\*\*/g, "")}</p>;
                    if (line.startsWith("- ") || line.startsWith("• ")) return <p key={i} style={{ marginLeft: 14, marginBottom: 2 }}>{line}</p>;
                    if (line.trim() === "") return <div key={i} style={{ height: 6 }} />;
                    return <p key={i} style={{ marginBottom: 2 }}>{line.replace(/\*\*(.*?)\*\*/g, "$1")}</p>;
                  })}
                  {analysing && <span style={{ display: "inline-block", width: 6, height: 16, background: "#D4795C", borderRadius: 2, marginLeft: 2, animation: "pulse 1s ease-in-out infinite" }} />}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
