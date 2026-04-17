"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send, Users, TrendingUp, Bell, ChevronRight, Clock,
  Zap, AlertTriangle, X, CheckCircle2, Star, Edit2, Check,
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

// Floating card base
const CARD: React.CSSProperties = {
  background: "rgba(255, 253, 251, 0.97)",
  backdropFilter: "blur(16px)",
  WebkitBackdropFilter: "blur(16px)",
  borderRadius: 26,
  border: "1px solid rgba(255, 255, 255, 0.9)",
  boxShadow: "0 12px 48px rgba(0, 0, 0, 0.18), 0 2px 8px rgba(0, 0, 0, 0.08)",
};

const CARD_DIVIDER = "1px solid rgba(0, 0, 0, 0.06)";

type FollowUp = { email: string; name: string; subject: string; daysAgo: number };

// ── Sparkline SVG ─────────────────────────────────────────────
const DEMO_VIEWS = [3800, 5200, 4600, 6800, 5900, 7400, 6100, 8300, 7700, 9100,
  8500, 10200, 9400, 11000, 10100, 9200, 11800, 12400, 11200, 13100,
  12300, 11600, 14000, 13500, 12800, 15200, 14600, 13900, 16100, 15400];

function Sparkline({ data, color = "#4BBFB0", height = 90 }: { data: number[]; color?: string; height?: number }) {
  const W = 500;
  const H = height;
  const pad = 8;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const pts = data.map((v, i) => ({
    x: pad + (i / (data.length - 1)) * (W - pad * 2),
    y: pad + (1 - (v - min) / range) * (H - pad * 2),
  }));

  const line = pts.reduce((d, p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1];
    const cx = (prev.x + p.x) / 2;
    return `${d} C ${cx} ${prev.y} ${cx} ${p.y} ${p.x} ${p.y}`;
  }, "");

  const area = `${line} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

  const last = pts[pts.length - 1];

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#sg)" />
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={last.x} cy={last.y} r="4" fill={color} stroke="white" strokeWidth="2" />
    </svg>
  );
}

// ── Day labels for sparkline ──────────────────────────────────
function last7Labels() {
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push(days[d.getDay()]);
  }
  return out;
}

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "there";
  const getDb = useDb();

  const [contactCount, setContactCount] = useState(0);
  const [emailsSent, setEmailsSent] = useState(0);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allCompanies, setAllCompanies] = useState<string[]>([]);
  const [emailConnected, setEmailConnected] = useState<"gmail" | "microsoft" | "expired" | null>(null);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const [adStatuses, setAdStatuses] = useState<Record<string, AdStatus>>({});
  const [favBrands, setFavBrands] = useState<string[]>([]);
  const [editingFavs, setEditingFavs] = useState(false);

  useEffect(() => {
    const gUser = getGoogleUser();
    const mUser = getMicrosoftUser();
    if (gUser) {
      setEmailConnected(isGoogleTokenExpired() ? "expired" : "gmail");
    } else if (mUser) {
      setEmailConnected("microsoft");
    } else {
      setEmailConnected(null);
    }
    setChecklistDismissed(localStorage.getItem("checklist_dismissed") === "true");
    const stored = localStorage.getItem(FAV_KEY);
    if (stored) setFavBrands(JSON.parse(stored));
    setAdStatuses(getAllCachedStatuses());
  }, []);

  useEffect(() => {
    (async () => {
      const [db, contactsRes] = await Promise.all([getDb(), fetch("/api/contacts")]);
      const contactsList: { email: string; name: string; company?: string }[] =
        contactsRes.ok ? await contactsRes.json() : [];
      setContactCount(contactsList.length);

      // Unique company names for brand selector
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
          latestPerContact.set(r.contactEmail, {
            sentAt: r.sentAt, subject: r.subject,
            name: contact?.name || r.contactEmail,
          });
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

      // Auto-populate favs from brands table if none saved yet
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
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const activeDeals = deals.filter(d => d.status !== "paid");
  const recentDeals = deals.slice(0, 6);

  const checklistTasks = [
    {
      id: "email", label: "Connect your email",
      sub: "Send outreach from your own inbox",
      done: emailConnected === "gmail" || emailConnected === "microsoft",
      href: "/settings",
    },
    {
      id: "send", label: "Send your first email",
      sub: "Pick a contact and reach out",
      done: emailsSent > 0, href: "/contacts",
    },
    {
      id: "deal", label: "Add a deal to your pipeline",
      sub: "Track a brand conversation",
      done: deals.length > 0, href: "/pipeline",
    },
  ];
  const allChecklistDone = checklistTasks.every(t => t.done);
  const showChecklist = !checklistDismissed && !allChecklistDone;

  // All selectable brand names (DB brands + unique contact companies)
  const allBrandNames = Array.from(
    new Set([...brands.map(b => b.name), ...allCompanies])
  ).sort();

  // The 8 favourited brands to display, with ad status
  const displayedBrands = favBrands.map(name => {
    const dbBrand = brands.find(b => b.name === name);
    const cached = adStatuses[name];
    return {
      name,
      runningAds: cached?.hasAds ?? dbBrand?.runningAds ?? null,
      checkedAt: cached?.checkedAt ?? null,
    };
  });

  const dayLabels = last7Labels();
  const sparkData = DEMO_VIEWS.slice(-7);

  return (
    <div style={{
      height: "100%", display: "flex", flexDirection: "column",
      padding: "40px", gap: "28px", overflow: "hidden",
    }}>

      {/* ── Banners ── */}
      {emailConnected === null && (
        <div className="flex items-center gap-3 px-6 py-3.5 flex-shrink-0" style={{ ...CARD, background: "rgba(255,248,238,0.97)", border: "1px solid #FDE5B8" }}>
          <AlertTriangle size={14} style={{ color: "#D97706", flexShrink: 0 }} />
          <p className="text-xs font-medium flex-1" style={{ color: "#92400E" }}>
            <span className="font-bold">No email connected.</span> Connect Gmail or Microsoft to send outreach.
          </p>
          <Link href="/settings" className="text-xs font-bold whitespace-nowrap px-3 py-1.5 rounded-lg" style={{ color: "#B45309", background: "#FEF3C7", border: "1px solid #FDE68A" }}>
            Connect now →
          </Link>
        </div>
      )}
      {emailConnected === "expired" && (
        <div className="flex items-center gap-3 px-6 py-3.5 flex-shrink-0" style={{ ...CARD, background: "rgba(255,245,245,0.97)", border: "1px solid #FECACA" }}>
          <AlertTriangle size={14} style={{ color: "#EF4444", flexShrink: 0 }} />
          <p className="text-xs font-medium flex-1" style={{ color: "#7F1D1D" }}>
            <span className="font-bold">Gmail session expired.</span> Your emails won&apos;t send until you reconnect.
          </p>
          <Link href="/settings" className="text-xs font-bold whitespace-nowrap px-3 py-1.5 rounded-lg" style={{ color: "#B91C1C", background: "#FEE2E2", border: "1px solid #FECACA" }}>
            Reconnect →
          </Link>
        </div>
      )}

      {/* ── Header card ── */}
      <div className="flex items-center justify-between flex-shrink-0" style={{ ...CARD, padding: "28px 44px" }}>
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9CA3AF", marginBottom: 8 }}>
            {today}
          </p>
          <h1 style={{ fontSize: 36, fontWeight: 900, letterSpacing: "-0.04em", color: "#111827", lineHeight: 1 }}>
            Hey {firstName}!
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl transition-all"
            style={{ padding: "10px 20px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", color: "#374151" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#EA580C"; (e.currentTarget as HTMLElement).style.color = "#EA580C"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}
          >
            <Users size={14} />
            New Campaign
          </Link>
          <Link
            href="/send"
            className="inline-flex items-center gap-2 text-white text-sm font-bold rounded-xl transition-all"
            style={{ padding: "10px 20px", background: "#EA580C", boxShadow: "0 2px 14px rgba(234,88,12,0.40)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#C2410C"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#EA580C"}
          >
            <Send size={14} />
            Quick Send
          </Link>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px", overflow: "hidden" }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px", minHeight: 0 }}>

          {/* Getting started checklist */}
          {showChecklist && (
            <div style={{ ...CARD, flexShrink: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 32px", borderBottom: CARD_DIVIDER }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <Zap size={14} style={{ color: "#EA580C" }} />
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#111827" }}>Getting started</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#FEF0EB", color: "#EA580C", padding: "2px 8px", borderRadius: 20, border: "1px solid #FDDBC8" }}>
                    {checklistTasks.filter(t => t.done).length}/{checklistTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => { setChecklistDismissed(true); localStorage.setItem("checklist_dismissed", "true"); }}
                  style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: 4, borderRadius: 6, display: "flex" }}
                >
                  <X size={14} />
                </button>
              </div>
              {checklistTasks.map((task, i) => (
                <Link
                  key={task.id}
                  href={task.href}
                  className="flex items-center gap-3 hover:bg-orange-50/40 transition-colors group"
                  style={{ padding: "18px 32px", borderBottom: i < checklistTasks.length - 1 ? CARD_DIVIDER : "none" }}
                >
                  <CheckCircle2 size={18} style={{ flexShrink: 0, color: task.done ? "#10B981" : "#D1D5DB" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: task.done ? "#9CA3AF" : "#111827", textDecoration: task.done ? "line-through" : "none" }}>
                      {task.label}
                    </p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>{task.sub}</p>
                  </div>
                  {!task.done && <ChevronRight size={14} style={{ color: "#D1D5DB", flexShrink: 0 }} />}
                </Link>
              ))}
            </div>
          )}

          {/* ── Analytics / Sparkline card ── */}
          <div style={{ ...CARD, flexShrink: 0, padding: "28px 32px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9CA3AF", marginBottom: 4 }}>Analytics</p>
                <p style={{ fontSize: 24, fontWeight: 900, letterSpacing: "-0.04em", color: "#111827", lineHeight: 1 }}>
                  Daily Social Views
                </p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  className="inline-flex items-center gap-1.5"
                  style={{ fontSize: 10, fontWeight: 700, padding: "5px 11px", borderRadius: 20, color: "#4BBFB0", background: "rgba(75,191,176,0.1)", border: "1px solid rgba(75,191,176,0.25)" }}
                >
                  <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "#4BBFB0", display: "inline-block" }} />
                  Live
                </span>
                <Link href="/analytics" style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EA580C"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}
                >
                  Full analytics →
                </Link>
              </div>
            </div>

            {/* Chart */}
            <div style={{ marginBottom: 8 }}>
              <Sparkline data={sparkData} color="#4BBFB0" height={88} />
            </div>

            {/* Day labels */}
            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: 4 }}>
              {dayLabels.map(d => (
                <span key={d} style={{ fontSize: 10, fontWeight: 600, color: "#D1D5DB" }}>{d}</span>
              ))}
            </div>

            {/* Stats row */}
            <div style={{ borderTop: CARD_DIVIDER, marginTop: 18, paddingTop: 18, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {[
                { label: "Instagram", count: "137K", colour: "#E1306C" },
                { label: "TikTok",    count: "84K",  colour: "#010101" },
                { label: "Facebook",  count: "52K",  colour: "#1877F2" },
              ].map(({ label, count, colour }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", color: "#111827", lineHeight: 1, marginBottom: 3 }}>{count}</p>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: colour }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Meta Ads card ── */}
          <div style={{ ...CARD, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 32px", borderBottom: CARD_DIVIDER, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Star size={14} style={{ color: "#EA580C" }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Meta Ads</span>
                <span style={{ fontSize: 10, fontWeight: 700, background: "#FEF0EB", color: "#EA580C", padding: "2px 8px", borderRadius: 20, border: "1px solid #FDDBC8" }}>
                  {favBrands.length}/8
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <button
                  onClick={() => setEditingFavs(v => !v)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    fontSize: 11, fontWeight: 700, color: editingFavs ? "#10B981" : "#9CA3AF",
                    background: editingFavs ? "rgba(16,185,129,0.08)" : "rgba(0,0,0,0.04)",
                    border: `1px solid ${editingFavs ? "rgba(16,185,129,0.25)" : "rgba(0,0,0,0.08)"}`,
                    borderRadius: 8, padding: "5px 10px", cursor: "pointer",
                  }}
                >
                  {editingFavs ? <Check size={12} /> : <Edit2 size={12} />}
                  {editingFavs ? "Done" : "Edit"}
                </button>
                <Link href="/ads" style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EA580C"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}
                >
                  Full scan →
                </Link>
              </div>
            </div>

            {/* Edit mode: brand selector */}
            {editingFavs && (
              <div style={{ padding: "16px 32px", borderBottom: CARD_DIVIDER, background: "rgba(249,250,251,0.8)", flexShrink: 0 }}>
                <p style={{ fontSize: 11, color: "#9CA3AF", marginBottom: 10, fontWeight: 600 }}>
                  Select up to 8 brands to pin — pulls live from your 24h ad scan
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxHeight: 120, overflowY: "auto" }}>
                  {allBrandNames.length === 0 ? (
                    <p style={{ fontSize: 12, color: "#D1D5DB" }}>No brands or companies found. Add contacts with company names.</p>
                  ) : allBrandNames.map(name => {
                    const selected = favBrands.includes(name);
                    const atMax = !selected && favBrands.length >= 8;
                    return (
                      <button
                        key={name}
                        onClick={() => !atMax && toggleFav(name)}
                        style={{
                          fontSize: 11, fontWeight: 700,
                          padding: "5px 12px", borderRadius: 20, cursor: atMax ? "not-allowed" : "pointer",
                          background: selected ? "#EA580C" : "rgba(0,0,0,0.05)",
                          color: selected ? "white" : atMax ? "#D1D5DB" : "#374151",
                          border: `1px solid ${selected ? "#EA580C" : "rgba(0,0,0,0.08)"}`,
                          transition: "all 0.12s",
                        }}
                      >
                        {selected && "✓ "}{name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Favourited brands list */}
            {displayedBrands.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 40 }}>
                <Star size={28} style={{ color: "#E5E7EB", marginBottom: 12 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>No brands pinned yet.</p>
                <p style={{ fontSize: 11, color: "#D1D5DB", marginTop: 4 }}>Click Edit to select up to 8 brands to watch.</p>
              </div>
            ) : (
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", alignContent: "start", padding: "16px 24px", gap: 10, overflowY: "auto" }}>
                {displayedBrands.map((brand, i) => {
                  const hasData = brand.runningAds !== null;
                  return (
                    <div
                      key={brand.name}
                      className="flex items-center gap-3 rounded-2xl hover:bg-orange-50/30 transition-colors"
                      style={{ padding: "14px 16px", border: "1px solid rgba(0,0,0,0.06)" }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: BRAND_AVATAR_COLOURS[i % BRAND_AVATAR_COLOURS.length], color: "white", fontSize: 13, fontWeight: 800 }}>
                        {brand.name[0]?.toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontWeight: 700, color: "#111827", fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{brand.name}</span>
                        {brand.checkedAt && (
                          <span style={{ fontSize: 10, color: "#D1D5DB" }}>
                            {Math.floor((Date.now() - new Date(brand.checkedAt).getTime()) / 3600000)}h ago
                          </span>
                        )}
                      </div>
                      {hasData ? (
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 8px", borderRadius: 20, flexShrink: 0, background: brand.runningAds ? "#DCFCE7" : "#FEE2E2", color: brand.runningAds ? "#15803D" : "#DC2626", border: `1px solid ${brand.runningAds ? "#BBF7D0" : "#FECACA"}` }}>
                          {brand.runningAds ? "Active" : "Paused"}
                        </span>
                      ) : (
                        <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 8px", borderRadius: 20, flexShrink: 0, background: "#F3F4F6", color: "#9CA3AF", border: "1px solid #E5E7EB" }}>
                          Unseen
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "28px", minHeight: 0 }}>

          {/* Deal Pipeline */}
          <div style={{ ...CARD, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 32px", borderBottom: CARD_DIVIDER, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <TrendingUp size={14} style={{ color: "#EA580C" }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Deal Pipeline</span>
                {activeDeals.length > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#FEF0EB", color: "#EA580C", padding: "2px 8px", borderRadius: 20, border: "1px solid #FDDBC8" }}>
                    {activeDeals.length} active
                  </span>
                )}
              </div>
              <Link
                href="/pipeline"
                style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EA580C"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}
              >
                View all →
              </Link>
            </div>

            {deals.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 48 }}>
                <TrendingUp size={28} style={{ color: "#E5E7EB", marginBottom: 12 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>No deals yet.</p>
                <p style={{ fontSize: 11, color: "#D1D5DB", marginTop: 4 }}>Positive replies in your inbox get flagged automatically.</p>
              </div>
            ) : (
              <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", padding: "18px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
                {recentDeals.map((deal) => {
                  const accent = DEAL_STAGE_ACCENT[deal.status] || "#6B7280";
                  return (
                    <div
                      key={deal.id}
                      style={{
                        borderRadius: 16, padding: "16px 20px",
                        display: "flex", alignItems: "center", gap: 16,
                        background: "rgba(255,255,255,0.72)",
                        border: "1px solid rgba(0,0,0,0.04)",
                        borderLeft: `4px solid ${accent}`,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {deal.company || deal.contactName}
                        </p>
                        {deal.company && (
                          <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deal.contactName}</p>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                        {deal.value && (
                          <span style={{ fontSize: 13, fontWeight: 800, color: "#059669" }}>{deal.value}</span>
                        )}
                        <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "5px 10px", borderRadius: 20, background: `${accent}15`, color: accent }}>
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "22px 32px", borderBottom: CARD_DIVIDER, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Bell size={14} style={{ color: "#EA580C" }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Follow-up Reminders</span>
                {followUps.length > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#FEE2E2", color: "#DC2626", padding: "2px 8px", borderRadius: 20, border: "1px solid #FECACA" }}>
                    {followUps.length} due
                  </span>
                )}
              </div>
              <Link
                href="/contacts"
                style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EA580C"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}
              >
                View contacts →
              </Link>
            </div>

            {followUps.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 48 }}>
                <Clock size={24} style={{ color: "#E5E7EB", marginBottom: 12 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>All up to date.</p>
                <p style={{ fontSize: 11, color: "#D1D5DB", marginTop: 4 }}>Contacts emailed 5+ days ago appear here.</p>
              </div>
            ) : (
              <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto" }}>
                {followUps.map((f, i) => (
                  <div
                    key={f.email}
                    className="flex items-center gap-3 hover:bg-orange-50/20 transition-colors"
                    style={{ padding: "18px 32px", borderBottom: i < followUps.length - 1 ? CARD_DIVIDER : "none" }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 800, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                      <p style={{ fontSize: 12, color: "#9CA3AF", fontWeight: 500, marginTop: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.subject}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: "5px 10px", borderRadius: 20, background: f.daysAgo >= 14 ? "#FEE2E2" : "#FEF3C7", color: f.daysAgo >= 14 ? "#DC2626" : "#D97706" }}>
                        {f.daysAgo}d ago
                      </span>
                      <Link
                        href={`/send?to=${encodeURIComponent(f.email)}&name=${encodeURIComponent(f.name)}`}
                        style={{ padding: 8, borderRadius: 8, color: "#9CA3AF", display: "flex", alignItems: "center", transition: "all 0.12s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(234,88,12,0.08)"; (e.currentTarget as HTMLElement).style.color = "#EA580C"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}
                      >
                        <ChevronRight size={13} />
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
