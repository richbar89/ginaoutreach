"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Users, TrendingUp, Bell, ChevronRight, Clock, Zap, AlertTriangle, X, CheckCircle2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useDb } from "@/lib/useDb";
import {
  dbGetEmailLog,
  dbGetDeals,
  dbGetBrands,
} from "@/lib/db";
import { getGoogleUser, isGoogleTokenExpired } from "@/lib/googleClient";
import { getMicrosoftUser } from "@/lib/graphClient";
import type { Deal, Brand } from "@/lib/types";

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

const BRAND_AVATAR_COLOURS = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#EC4899","#06B6D4","#84CC16","#F97316","#6366F1"];

// Floating card base style
const CARD: React.CSSProperties = {
  background: "rgba(255, 253, 251, 0.97)",
  backdropFilter: "blur(12px)",
  WebkitBackdropFilter: "blur(12px)",
  borderRadius: 22,
  border: "1px solid rgba(255, 255, 255, 0.85)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.10), 0 1px 4px rgba(0, 0, 0, 0.05)",
};

const CARD_DIVIDER = "1px solid rgba(0, 0, 0, 0.06)";

type FollowUp = { email: string; name: string; subject: string; daysAgo: number };

function InstagramIcon({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
      <circle cx="12" cy="12" r="4"/>
      <circle cx="17.5" cy="6.5" r="1" fill="white" stroke="none"/>
    </svg>
  );
}

function TikTokIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.52V6.77a4.85 4.85 0 01-1.02-.08z"/>
    </svg>
  );
}

function FacebookIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="white">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
    </svg>
  );
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
  const [emailConnected, setEmailConnected] = useState<"gmail" | "microsoft" | "expired" | null>(null);
  const [checklistDismissed, setChecklistDismissed] = useState(false);

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
    const dismissed = localStorage.getItem("checklist_dismissed") === "true";
    setChecklistDismissed(dismissed);
  }, []);

  useEffect(() => {
    (async () => {
      const [db, contactsRes] = await Promise.all([getDb(), fetch("/api/contacts")]);
      const contactsList: { email: string; name: string }[] = contactsRes.ok ? await contactsRes.json() : [];
      setContactCount(contactsList.length);

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
    })();
  }, [getDb]);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const recentDeals = deals.slice(0, 6);
  const activeDeals = deals.filter(d => d.status !== "paid");

  const checklistTasks = [
    {
      id: "email",
      label: "Connect your email",
      sub: "Send outreach from your own inbox",
      done: emailConnected === "gmail" || emailConnected === "microsoft",
      href: "/settings",
    },
    {
      id: "send",
      label: "Send your first email",
      sub: "Pick a contact and reach out",
      done: emailsSent > 0,
      href: "/contacts",
    },
    {
      id: "deal",
      label: "Add a deal to your pipeline",
      sub: "Track a brand conversation",
      done: deals.length > 0,
      href: "/pipeline",
    },
  ];
  const allChecklistDone = checklistTasks.every((t) => t.done);
  const showChecklist = !checklistDismissed && !allChecklistDone;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: "16px", gap: "12px", overflow: "hidden" }}>

      {/* Email not connected banner */}
      {emailConnected === null && (
        <div
          className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
          style={{ ...CARD, background: "rgba(255,248,238,0.95)", border: "1px solid #FDE5B8" }}
        >
          <AlertTriangle size={14} style={{ color: "#D97706", flexShrink: 0 }} />
          <p className="text-xs font-medium flex-1" style={{ color: "#92400E" }}>
            <span className="font-bold">No email connected.</span> Connect Gmail or Microsoft to send outreach.
          </p>
          <Link href="/settings" className="text-xs font-bold whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors" style={{ color: "#B45309", background: "#FEF3C7", border: "1px solid #FDE68A" }}>
            Connect now →
          </Link>
        </div>
      )}

      {/* Gmail token expired banner */}
      {emailConnected === "expired" && (
        <div
          className="flex items-center gap-3 px-5 py-3 flex-shrink-0"
          style={{ ...CARD, background: "rgba(255,245,245,0.95)", border: "1px solid #FECACA" }}
        >
          <AlertTriangle size={14} style={{ color: "#EF4444", flexShrink: 0 }} />
          <p className="text-xs font-medium flex-1" style={{ color: "#7F1D1D" }}>
            <span className="font-bold">Gmail session expired.</span> Your emails won&apos;t send until you reconnect.
          </p>
          <Link href="/settings" className="text-xs font-bold whitespace-nowrap px-3 py-1.5 rounded-lg transition-colors" style={{ color: "#B91C1C", background: "#FEE2E2", border: "1px solid #FECACA" }}>
            Reconnect →
          </Link>
        </div>
      )}

      {/* ── Header card ── */}
      <div
        className="flex items-center justify-between flex-shrink-0"
        style={{ ...CARD, padding: "18px 28px" }}
      >
        <div>
          <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9CA3AF", marginBottom: 6 }}>
            {today}
          </p>
          <h1 style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.04em", color: "#111827", lineHeight: 1 }}>
            Hey {firstName}!
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 text-sm font-semibold rounded-xl transition-all"
            style={{ padding: "9px 16px", background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.08)", color: "#374151" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#EA580C"; (e.currentTarget as HTMLElement).style.color = "#EA580C"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}
          >
            <Users size={14} />
            New Campaign
          </Link>
          <Link
            href="/send"
            className="inline-flex items-center gap-2 text-white text-sm font-bold rounded-xl transition-all"
            style={{ padding: "9px 16px", background: "#EA580C", boxShadow: "0 2px 14px rgba(234,88,12,0.40)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#C2410C"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#EA580C"}
          >
            <Send size={14} />
            Quick Send
          </Link>
        </div>
      </div>

      {/* ── Main grid ── */}
      <div style={{ flex: 1, minHeight: 0, display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", overflow: "hidden" }}>

        {/* LEFT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: 0, overflow: "hidden" }}>

          {/* Getting started checklist */}
          {showChecklist && (
            <div style={{ ...CARD, flexShrink: 0, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: CARD_DIVIDER }}>
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
                  style={{ padding: "12px 20px", borderBottom: i < checklistTasks.length - 1 ? CARD_DIVIDER : "none" }}
                >
                  <CheckCircle2 size={18} style={{ flexShrink: 0, color: task.done ? "#10B981" : "#D1D5DB" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: task.done ? "#9CA3AF" : "#111827", textDecoration: task.done ? "line-through" : "none" }}>
                      {task.label}
                    </p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>{task.sub}</p>
                  </div>
                  {!task.done && <ChevronRight size={14} style={{ color: "#D1D5DB", flexShrink: 0 }} />}
                </Link>
              ))}
            </div>
          )}

          {/* Analytics card — orange gradient hero */}
          <div
            style={{
              flexShrink: 0,
              borderRadius: 22,
              padding: "24px",
              background: "linear-gradient(135deg, #FB923C 0%, #EA580C 50%, #C2410C 100%)",
              boxShadow: "0 4px 16px rgba(234,88,12,0.18)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.7)" }}>Analytics</p>
              <span
                className="inline-flex items-center gap-1.5 animate-live-badge"
                style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 20, color: "white", background: "rgba(255,255,255,0.2)" }}
              >
                <span className="animate-pulse" style={{ width: 6, height: 6, borderRadius: "50%", background: "white", display: "inline-block" }} />
                Live Data
              </span>
            </div>

            <div style={{ marginBottom: 18 }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.65)", marginBottom: 6 }}>Avg. Views per Post — last 7 days</p>
              <p style={{ color: "white", fontSize: 52, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1 }}>—</p>
              <p style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 6 }}>Connect Meta API to populate</p>
            </div>

            <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}>
              {[
                { icon: <InstagramIcon size={20} />, count: "137K", label: "Instagram" },
                { icon: <TikTokIcon size={18} />,    count: "84K",  label: "TikTok" },
                { icon: <FacebookIcon size={18} />,  count: "52K",  label: "Facebook" },
              ].map(({ icon, count, label }) => (
                <div key={label} style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", justifyContent: "center", marginBottom: 6, opacity: 0.85 }}>{icon}</div>
                  <p style={{ color: "white", fontSize: 22, fontWeight: 900, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 3 }}>{count}</p>
                  <p style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "rgba(255,255,255,0.6)" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Top Brands */}
          <div style={{ ...CARD, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: CARD_DIVIDER, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Zap size={14} style={{ color: "#EA580C" }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#111827" }}>Top Brands</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: "#9CA3AF" }}>Ads Alerts</span>
            </div>
            {brands.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>No brands added yet.</p>
                <p style={{ fontSize: 11, color: "#D1D5DB", marginTop: 4 }}>Add brands to monitor in Settings.</p>
              </div>
            ) : (
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", alignContent: "start", padding: 12, gap: 8, overflow: "hidden" }}>
                {brands.map((brand, i) => (
                  <div
                    key={brand.name + i}
                    className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-orange-50/30 transition-colors"
                    style={{ border: "1px solid rgba(0,0,0,0.06)" }}
                  >
                    <div
                      style={{ width: 34, height: 34, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: BRAND_AVATAR_COLOURS[i % BRAND_AVATAR_COLOURS.length], color: "white", fontSize: 13, fontWeight: 800 }}
                    >
                      {brand.name[0]?.toUpperCase()}
                    </div>
                    <span style={{ flex: 1, fontWeight: 700, color: "#111827", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{brand.name}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.06em", padding: "3px 8px", borderRadius: 20, flexShrink: 0, background: brand.runningAds ? "#DCFCE7" : "#FEE2E2", color: brand.runningAds ? "#15803D" : "#DC2626", border: `1px solid ${brand.runningAds ? "#BBF7D0" : "#FECACA"}` }}>
                      {brand.runningAds ? "Active" : "Paused"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: 0, overflow: "hidden" }}>

          {/* Deal Pipeline */}
          <div style={{ ...CARD, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: CARD_DIVIDER, flexShrink: 0 }}>
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
                style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textDecoration: "none", transition: "color 0.12s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EA580C"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}
              >
                View all →
              </Link>
            </div>

            {deals.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
                <TrendingUp size={28} style={{ color: "#E5E7EB", marginBottom: 12 }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF" }}>No deals yet.</p>
                <p style={{ fontSize: 11, color: "#D1D5DB", marginTop: 4 }}>Positive replies in your inbox get flagged automatically.</p>
              </div>
            ) : (
              <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", padding: "10px 12px", display: "flex", flexDirection: "column", gap: 6 }}>
                {recentDeals.map((deal) => {
                  const accent = DEAL_STAGE_ACCENT[deal.status] || "#6B7280";
                  return (
                    <div
                      key={deal.id}
                      style={{
                        borderRadius: 16,
                        padding: "14px 16px",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
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
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 20px", borderBottom: CARD_DIVIDER, flexShrink: 0 }}>
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
                style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textDecoration: "none", transition: "color 0.12s" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EA580C"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}
              >
                View contacts →
              </Link>
            </div>

            {followUps.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 24 }}>
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
                    style={{ padding: "14px 20px", borderBottom: i < followUps.length - 1 ? CARD_DIVIDER : "none" }}
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
                        style={{ padding: 6, borderRadius: 8, color: "#9CA3AF", display: "flex", alignItems: "center", transition: "all 0.12s" }}
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
