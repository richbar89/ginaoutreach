"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send, Users, TrendingUp, Bell, ChevronRight, Clock,
  Star, Edit2, Check, Mail, AlertTriangle, RefreshCw,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useDb } from "@/lib/useDb";
import { dbGetEmailLog, dbGetDeals, dbGetBrands } from "@/lib/db";
import { getGoogleUser, isGoogleTokenExpired } from "@/lib/googleClient";
import { getMicrosoftUser } from "@/lib/graphClient";
import { getAllCachedStatuses } from "@/lib/metaAds";
import type { Deal, Brand } from "@/lib/types";
import type { AdStatus } from "@/lib/metaAds";

const DEAL_STAGE_LABELS: Record<string, string> = {
  pitched: "Pitched", replied: "Replied", negotiating: "Negotiating",
  contracted: "Contracted", delivered: "Delivered", paid: "Paid",
};

const DEAL_STAGE_ACCENT: Record<string, string> = {
  pitched:     "#3B82F6",
  replied:     "#6366F1",
  negotiating: "#F59E0B",
  contracted:  "#8B5CF6",
  delivered:   "#06B6D4",
  paid:        "#10B981",
};

const BRAND_AVATAR_COLOURS = [
  "#3B82F6","#8B5CF6","#10B981","#F59E0B",
  "#EF4444","#EC4899","#06B6D4","#84CC16","#F97316","#6366F1",
];

const FAV_KEY = "dashboard_fav_brands";

const CARD: React.CSSProperties = {
  background: "linear-gradient(150deg, #C97B5C 0%, #B5684E 55%, #9A4535 100%)",
  borderRadius: 24,
  border: "1px solid rgba(255, 255, 255, 0.18)",
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.06)",
};

const CARD_DIVIDER = "1px solid rgba(255, 255, 255, 0.12)";

type FollowUp = { email: string; name: string; subject: string; daysAgo: number };

// ── Sparkline ────────────────────────────────────────────────
const DEMO_VIEWS = [3800, 5200, 4600, 6800, 5900, 7400, 6100, 8300, 7700, 9100,
  8500, 10200, 9400, 11000, 10100, 9200, 11800, 12400, 11200, 13100,
  12300, 11600, 14000, 13500, 12800, 15200, 14600, 13900, 16100, 15400];

function Sparkline({ data, color = "#4BBFB0", height = 64 }: { data: number[]; color?: string; height?: number }) {
  const W = 500; const H = height; const pad = 4;
  const max = Math.max(...data); const min = Math.min(...data); const range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: pad + (1 - (v - min) / range) * (H - pad * 2),
  }));
  const line = pts.reduce((d, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1]; const cx = (prev.x + p.x) / 2;
    return `${d} C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
  }, "");
  const area = `${line} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="4" fill={color} stroke="white" strokeWidth="2" />
    </svg>
  );
}

function last7Labels() {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(); d.setDate(d.getDate() - (6 - i)); return days[d.getDay()];
  });
}

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "there";
  const getDb = useDb();

  const [emailsSent, setEmailsSent] = useState(0);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allCompanies, setAllCompanies] = useState<string[]>([]);
  const [emailConnected, setEmailConnected] = useState<"gmail" | "microsoft" | "expired" | null>(null);
  const [adStatuses, setAdStatuses] = useState<Record<string, AdStatus>>({});
  const [favBrands, setFavBrands] = useState<string[]>([]);
  const [editingFavs, setEditingFavs] = useState(false);

  useEffect(() => {
    const gUser = getGoogleUser();
    const mUser = getMicrosoftUser();
    if (gUser) setEmailConnected(isGoogleTokenExpired() ? "expired" : "gmail");
    else if (mUser) setEmailConnected("microsoft");
    else setEmailConnected(null);
    const stored = localStorage.getItem(FAV_KEY);
    if (stored) setFavBrands(JSON.parse(stored));
    setAdStatuses(getAllCachedStatuses());
  }, []);

  useEffect(() => {
    (async () => {
      const [db, contactsRes] = await Promise.all([getDb(), fetch("/api/contacts")]);
      const contactsList: { email: string; name: string; company?: string }[] =
        contactsRes.ok ? await contactsRes.json() : [];

      const companies = Array.from(
        new Set(contactsList.map(c => (c as any).company).filter(Boolean))
      ) as string[];
      setAllCompanies(companies);

      const log = await dbGetEmailLog(db);
      setEmailsSent(log.length);

      const latestPerContact = new Map<string, { sentAt: string; subject: string; name: string }>();
      for (const r of log) {
        const existing = latestPerContact.get(r.contactEmail);
        if (!existing || r.sentAt > existing.sentAt) {
          const contact = contactsList.find(c => c.email.toLowerCase() === r.contactEmail);
          latestPerContact.set(r.contactEmail, { sentAt: r.sentAt, subject: r.subject, name: contact?.name || r.contactEmail });
        }
      }
      const now = Date.now();
      const chaseUps: FollowUp[] = [];
      for (const [email, { sentAt, subject, name }] of latestPerContact.entries()) {
        const daysAgo = Math.floor((now - new Date(sentAt).getTime()) / 86400000);
        if (daysAgo >= 5) chaseUps.push({ email, name, subject, daysAgo });
      }
      chaseUps.sort((a, b) => b.daysAgo - a.daysAgo);
      setFollowUps(chaseUps.slice(0, 6));

      const dealsData = await dbGetDeals(db);
      setDeals(dealsData);

      const brandsData = await dbGetBrands(db);
      setBrands(brandsData);

      const stored = localStorage.getItem(FAV_KEY);
      if (!stored && brandsData.length > 0) {
        const initial = brandsData.slice(0, 8).map(b => b.name);
        setFavBrands(initial);
        localStorage.setItem(FAV_KEY, JSON.stringify(initial));
      }
    })();
  }, [getDb]);

  function toggleFav(name: string) {
    setFavBrands(prev => {
      const next = prev.includes(name)
        ? prev.filter(n => n !== name)
        : prev.length < 8 ? [...prev, name] : prev;
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      return next;
    });
  }

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
  const activeDeals = deals.filter(d => d.status !== "paid");
  const recentDeals = deals.slice(0, 5);
  const allBrandNames = Array.from(new Set([...brands.map(b => b.name), ...allCompanies])).sort();
  const displayedBrands = favBrands.map(name => {
    const dbBrand = brands.find(b => b.name === name);
    const cached = adStatuses[name];
    return { name, runningAds: cached?.hasAds ?? dbBrand?.runningAds ?? null, checkedAt: cached?.checkedAt ?? null };
  });

  const emailReady = emailConnected === "gmail" || emailConnected === "microsoft";
  const sparkData = DEMO_VIEWS.slice(-7);
  const dayLabels = last7Labels();

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "28px 32px",
      gap: "20px",
      overflow: "hidden",
    }}>

      {/* ── Header: greeting OR email prompt ── */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ ...CARD, padding: "20px 32px" }}>
        {!emailReady ? (
          /* Email connect prompt */
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: emailConnected === "expired" ? "#FEF2F2" : "#FFF7ED", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {emailConnected === "expired"
                ? <AlertTriangle size={20} style={{ color: "#EF4444" }} />
                : <Mail size={20} style={{ color: "#EA580C" }} />}
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 800, color: "rgba(255,255,255,0.95)", letterSpacing: "-0.02em" }}>
                {emailConnected === "expired" ? "Gmail session expired" : `Welcome, ${firstName} — connect your email to get started`}
              </p>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 2 }}>
                {emailConnected === "expired"
                  ? "Your emails won't send until you reconnect."
                  : "Send outreach directly from your Gmail or Microsoft inbox."}
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-white text-sm font-bold rounded-xl transition-all flex-shrink-0"
              style={{ padding: "10px 20px", background: emailConnected === "expired" ? "#EF4444" : "#EA580C", boxShadow: `0 2px 14px ${emailConnected === "expired" ? "rgba(239,68,68,0.35)" : "rgba(234,88,12,0.35)"}`, marginLeft: "auto" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.88"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            >
              {emailConnected === "expired" ? <><RefreshCw size={13} /> Reconnect</> : <><Mail size={13} /> Connect email</>}
            </Link>
          </div>
        ) : (
          /* Normal greeting */
          <>
            <div>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: 4 }}>
                {today}
              </p>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: "-0.04em", color: "rgba(255,255,255,0.95)", lineHeight: 1 }}>
                Hey {firstName}!
              </h1>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                href="/contacts"
                className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl transition-all"
                style={{ padding: "9px 18px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.25)", color: "rgba(255,255,255,0.9)" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.18)"; (e.currentTarget as HTMLElement).style.color = "#ffffff"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.9)"; }}
              >
                <Users size={13} /> New Campaign
              </Link>
              <Link
                href="/send"
                className="inline-flex items-center gap-2 text-white text-sm font-bold rounded-xl transition-all"
                style={{ padding: "9px 18px", background: "#EA580C", boxShadow: "0 2px 14px rgba(234,88,12,0.38)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#C2410C"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#EA580C"}
              >
                <Send size={13} /> Quick Send
              </Link>
            </div>
          </>
        )}
      </div>

      {/* ── Main grid — fills remaining height, no scroll ── */}
      <div style={{
        flex: 1, minHeight: 0,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
      }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", minHeight: 0 }}>

          {/* Analytics sparkline card */}
          <div style={{ ...CARD, flexShrink: 0, padding: "20px 26px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <p style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Analytics</p>
                <p style={{ fontSize: 18, fontWeight: 900, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.95)", lineHeight: 1 }}>Daily Social Views</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: "#4BBFB0", background: "rgba(75,191,176,0.1)", border: "1px solid rgba(75,191,176,0.25)" }}>
                  <span className="animate-pulse" style={{ width: 5, height: 5, borderRadius: "50%", background: "#4BBFB0", display: "inline-block" }} />
                  Live
                </span>
                <Link href="/analytics" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", fontWeight: 600, textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EA580C"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"}
                >
                  View all →
                </Link>
              </div>
            </div>
            <Sparkline data={sparkData} color="#4BBFB0" height={60} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
              {dayLabels.map(d => (
                <span key={d} style={{ fontSize: 9, fontWeight: 600, color: "rgba(255,255,255,0.38)" }}>{d}</span>
              ))}
            </div>
            <div style={{ borderTop: CARD_DIVIDER, marginTop: 14, paddingTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
              {[
                { label: "Instagram", count: "137K", colour: "#E1306C" },
                { label: "TikTok",    count: "84K",  colour: "#111111" },
                { label: "Facebook",  count: "52K",  colour: "#1877F2" },
              ].map(({ label, count, colour }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 17, fontWeight: 900, letterSpacing: "-0.03em", color: "rgba(255,255,255,0.95)", lineHeight: 1, marginBottom: 2 }}>{count}</p>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: colour }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Meta Ads card — grows to fill */}
          <div style={{ ...CARD, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: CARD_DIVIDER, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Star size={13} style={{ color: "#EA580C" }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.95)" }}>Meta Ads</span>
                <span style={{ fontSize: 9, fontWeight: 700, background: "#FEF0EB", color: "#EA580C", padding: "2px 7px", borderRadius: 20, border: "1px solid #FDDBC8" }}>
                  {favBrands.length}/8
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={() => setEditingFavs(v => !v)}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 10, fontWeight: 700, color: editingFavs ? "#ffffff" : "rgba(255,255,255,0.7)", background: editingFavs ? "rgba(255,255,255,0.18)" : "rgba(255,255,255,0.1)", border: `1px solid ${editingFavs ? "rgba(255,255,255,0.4)" : "rgba(255,255,255,0.2)"}`, borderRadius: 7, padding: "4px 9px", cursor: "pointer" }}
                >
                  {editingFavs ? <Check size={11} /> : <Edit2 size={11} />}
                  {editingFavs ? "Done" : "Edit"}
                </button>
                <Link href="/ads" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EA580C"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"}
                >
                  Full scan →
                </Link>
              </div>
            </div>

            {editingFavs && (
              <div style={{ padding: "12px 24px", borderBottom: CARD_DIVIDER, background: "rgba(0,0,0,0.12)", flexShrink: 0 }}>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginBottom: 8, fontWeight: 600 }}>
                  Pin up to 8 brands — pulls live from your 24h ad scan
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, maxHeight: 90, overflowY: "auto" }}>
                  {allBrandNames.length === 0 ? (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>No companies found. Add contacts with company names.</p>
                  ) : allBrandNames.map(name => {
                    const selected = favBrands.includes(name);
                    const atMax = !selected && favBrands.length >= 8;
                    return (
                      <button key={name} onClick={() => !atMax && toggleFav(name)} style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, cursor: atMax ? "not-allowed" : "pointer", background: selected ? "#EA580C" : "rgba(0,0,0,0.05)", color: selected ? "white" : atMax ? "#D1D5DB" : "#374151", border: `1px solid ${selected ? "#EA580C" : "rgba(0,0,0,0.08)"}`, transition: "all 0.12s" }}>
                        {selected && "✓ "}{name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {displayedBrands.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32 }}>
                <Star size={24} style={{ color: "rgba(255,255,255,0.25)", marginBottom: 10 }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>No brands pinned yet.</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>Click Edit to select up to 8 brands.</p>
              </div>
            ) : (
              <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", alignContent: "start", padding: "12px 18px", gap: 8 }}>
                {displayedBrands.map((brand, i) => (
                  <div key={brand.name} className="flex items-center gap-2 rounded-2xl transition-colors" style={{ padding: "10px 12px", border: "1px solid rgba(255,255,255,0.12)" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.08)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <div style={{ width: 30, height: 30, borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: BRAND_AVATAR_COLOURS[i % BRAND_AVATAR_COLOURS.length], color: "white", fontSize: 11, fontWeight: 800 }}>
                      {brand.name[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, color: "rgba(255,255,255,0.95)", fontSize: 11, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{brand.name}</span>
                      {brand.checkedAt && <span style={{ fontSize: 9, color: "rgba(255,255,255,0.38)" }}>{Math.floor((Date.now() - new Date(brand.checkedAt).getTime()) / 3600000)}h ago</span>}
                    </div>
                    {brand.runningAds !== null ? (
                      <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "3px 7px", borderRadius: 20, flexShrink: 0, background: brand.runningAds ? "#DCFCE7" : "#FEE2E2", color: brand.runningAds ? "#15803D" : "#DC2626", border: `1px solid ${brand.runningAds ? "#BBF7D0" : "#FECACA"}` }}>
                        {brand.runningAds ? "Active" : "Paused"}
                      </span>
                    ) : (
                      <span style={{ fontSize: 8, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "3px 7px", borderRadius: 20, flexShrink: 0, background: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.2)" }}>
                        —
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", minHeight: 0 }}>

          {/* Deal Pipeline */}
          <div style={{ ...CARD, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: CARD_DIVIDER, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={13} style={{ color: "#EA580C" }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.95)" }}>Deal Pipeline</span>
                {activeDeals.length > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, background: "#FEF0EB", color: "#EA580C", padding: "2px 7px", borderRadius: 20, border: "1px solid #FDDBC8" }}>
                    {activeDeals.length} active
                  </span>
                )}
              </div>
              <Link href="/pipeline" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EA580C"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#C4B5A5"}
              >
                View all →
              </Link>
            </div>

            {deals.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32 }}>
                <TrendingUp size={24} style={{ color: "rgba(255,255,255,0.25)", marginBottom: 10 }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>No deals yet.</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>Positive replies get flagged automatically.</p>
              </div>
            ) : (
              <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 7 }}>
                {recentDeals.map((deal) => {
                  const accent = DEAL_STAGE_ACCENT[deal.status] || "#6B7280";
                  return (
                    <div key={deal.id} style={{ borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, background: "rgba(0,0,0,0.08)", border: "1px solid rgba(255,255,255,0.1)", borderLeft: `3px solid ${accent}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.95)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {deal.company || deal.contactName}
                        </p>
                        {deal.company && <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deal.contactName}</p>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                        {deal.value && <span style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>{deal.value}</span>}
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "4px 9px", borderRadius: 20, background: `${accent}18`, color: accent }}>
                          {DEAL_STAGE_LABELS[deal.status] || deal.status}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Follow-up Reminders */}
          <div style={{ ...CARD, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: CARD_DIVIDER, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bell size={13} style={{ color: "#EA580C" }} />
                <span style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.95)" }}>Follow-up Reminders</span>
                {followUps.length > 0 && (
                  <span style={{ fontSize: 9, fontWeight: 700, background: "#FEE2E2", color: "#DC2626", padding: "2px 7px", borderRadius: 20, border: "1px solid #FECACA" }}>
                    {followUps.length} due
                  </span>
                )}
              </div>
              <Link href="/contacts" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontWeight: 600, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EA580C"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#C4B5A5"}
              >
                View contacts →
              </Link>
            </div>

            {followUps.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32 }}>
                <Clock size={20} style={{ color: "rgba(255,255,255,0.25)", marginBottom: 10 }} />
                <p style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.55)" }}>All up to date.</p>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 3 }}>Contacts emailed 5+ days ago appear here.</p>
              </div>
            ) : (
              <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto" }}>
                {followUps.map((f, i) => (
                  <div key={f.email} className="flex items-center gap-3 transition-colors" style={{ padding: "13px 24px", borderBottom: i < followUps.length - 1 ? CARD_DIVIDER : "none" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.07)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "rgba(255,255,255,0.95)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                      <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", fontWeight: 500, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.subject}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                      <span style={{ fontSize: 9, fontWeight: 700, padding: "4px 9px", borderRadius: 20, background: f.daysAgo >= 14 ? "#FEE2E2" : "#FEF3C7", color: f.daysAgo >= 14 ? "#DC2626" : "#D97706" }}>
                        {f.daysAgo}d ago
                      </span>
                      <Link
                        href={`/send?to=${encodeURIComponent(f.email)}&name=${encodeURIComponent(f.name)}`}
                        style={{ padding: 6, borderRadius: 7, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", transition: "all 0.12s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.15)"; (e.currentTarget as HTMLElement).style.color = "#ffffff"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.4)"; }}
                      >
                        <ChevronRight size={12} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
