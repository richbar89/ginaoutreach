"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Users, TrendingUp, Bell, ChevronRight, Clock, Zap, AlertTriangle, X, CheckCircle2, Settings, BarChart2 } from "lucide-react";
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

type FollowUp = { email: string; name: string; subject: string; daysAgo: number };

function formatNum(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, "") + "m";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

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
      setFollowUps(chaseUps.slice(0, 5));

      const dealsData = await dbGetDeals(db);
      setDeals(dealsData);

      const brandsData = await dbGetBrands(db);
      setBrands(brandsData);
    })();
  }, [getDb]);

  const activeDeals = deals.filter(d => d.status !== "paid");
  const recentDeals = deals.slice(0, 5);

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

  const today = new Date().toLocaleDateString("en-GB", {
    day: "numeric", month: "short",
  });
  const weekAgo = new Date(Date.now() - 7 * 86400000).toLocaleDateString("en-GB", {
    day: "numeric", month: "short",
  });

  return (
    <div style={{ padding: "32px 36px", height: "100%", overflowY: "auto", display: "flex", flexDirection: "column", gap: 28 }}>

      {/* ── Banners ── */}
      {emailConnected === null && (
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl flex-shrink-0" style={{ background: "rgba(255,248,238,0.95)", border: "1px solid #FDE5B8" }}>
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
        <div className="flex items-center gap-3 px-5 py-3 rounded-2xl flex-shrink-0" style={{ background: "rgba(255,245,245,0.95)", border: "1px solid #FECACA" }}>
          <AlertTriangle size={14} style={{ color: "#EF4444", flexShrink: 0 }} />
          <p className="text-xs font-medium flex-1" style={{ color: "#7F1D1D" }}>
            <span className="font-bold">Gmail session expired.</span> Your emails won&apos;t send until you reconnect.
          </p>
          <Link href="/settings" className="text-xs font-bold whitespace-nowrap px-3 py-1.5 rounded-lg" style={{ color: "#B91C1C", background: "#FEE2E2", border: "1px solid #FECACA" }}>
            Reconnect →
          </Link>
        </div>
      )}

      {/* ── TOP ROW: Title + Stats + Upgrade card ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 24, alignItems: "start" }}>
        <div>
          {/* Title row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <h1 style={{ fontSize: 38, fontWeight: 900, letterSpacing: "-0.04em", color: "#111827", margin: 0 }}>
              Dashboard
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Link
                href="/send"
                className="inline-flex items-center gap-2 text-white text-sm font-bold rounded-xl transition-all"
                style={{ padding: "9px 18px", background: "#EA580C", boxShadow: "0 2px 14px rgba(234,88,12,0.35)" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#C2410C"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#EA580C"}
              >
                <Send size={13} />
                Quick Send
              </Link>
              <Link
                href="/settings"
                className="inline-flex items-center justify-center rounded-xl transition-all"
                style={{ width: 38, height: 38, background: "rgba(0,0,0,0.04)", border: "1px solid rgba(0,0,0,0.07)", color: "#9CA3AF" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.07)"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)"; (e.currentTarget as HTMLElement).style.color = "#9CA3AF"; }}
              >
                <Settings size={15} />
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "flex", gap: 44, alignItems: "flex-start" }}>
            {[
              { label: "Contacts", value: formatNum(contactCount), dotColor: "#4BBFB0", alert: false },
              { label: "Emails Sent", value: formatNum(emailsSent), dotColor: "#EF4444", alert: followUps.length > 0 },
              { label: "Active Deals", value: formatNum(activeDeals.length), dotColor: "#10B981", alert: false },
            ].map(({ label, value, dotColor, alert }) => (
              <div key={label}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.02em" }}>{label}</span>
                  {alert ? (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#EF4444", display: "inline-block", boxShadow: "0 0 0 2px rgba(239,68,68,0.2)" }} />
                  ) : (
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: dotColor, display: "inline-block" }} />
                  )}
                </div>
                <p style={{ fontSize: 34, fontWeight: 900, letterSpacing: "-0.04em", color: "#111827", lineHeight: 1, margin: 0 }}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade card */}
        <div style={{ borderRadius: 20, padding: "22px 24px", background: "#F5F0EA", position: "relative", overflow: "hidden", minHeight: 110 }}>
          <div style={{ position: "relative", zIndex: 1 }}>
            <p style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em", color: "#EA580C", lineHeight: 1.15, marginBottom: 6 }}>
              Upgrade Your<br />Plan
            </p>
            <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>Unlock more features</p>
          </div>
          <Link
            href="/settings"
            style={{
              position: "absolute", right: 20, top: "50%", transform: "translateY(-50%)",
              background: "#EA580C", color: "white", borderRadius: "50%",
              width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 900, fontSize: 10, letterSpacing: "0.05em", textDecoration: "none",
              boxShadow: "0 4px 14px rgba(234,88,12,0.4)", zIndex: 1,
            }}
          >
            NOW
          </Link>
          {/* Decorative concentric arcs */}
          <div style={{ position: "absolute", right: -28, top: -28, width: 130, height: 130, borderRadius: "50%", border: "22px solid rgba(75,191,176,0.25)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: -12, top: -12, width: 100, height: 100, borderRadius: "50%", border: "16px solid rgba(212,121,92,0.2)", pointerEvents: "none" }} />
          <div style={{ position: "absolute", right: 2, top: 2, width: 72, height: 72, borderRadius: "50%", border: "12px solid rgba(234,88,12,0.12)", pointerEvents: "none" }} />
        </div>
      </div>

      {/* ── MIDDLE ROW: Activity + Top Performers ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: 20 }}>

        {/* Activity / Deal Pipeline */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <h2 style={{ fontSize: 19, fontWeight: 800, color: "#111827", margin: 0 }}>Activity</h2>
              <span style={{ fontSize: 11, color: "#B0AAA4", fontWeight: 500 }}>Updates every 3 hours</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 11, color: "#6B7280", border: "1px solid #E5E7EB", borderRadius: 8, padding: "5px 12px", background: "white", fontWeight: 600 }}>
                {weekAgo} – {today}
              </span>
              <Link
                href="/pipeline"
                style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 600, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EA580C"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}
              >
                View all →
              </Link>
            </div>
          </div>

          {/* Checklist (inline) */}
          {showChecklist && (
            <div style={{ borderRadius: 16, border: "1px solid #FDE5C0", background: "#FFFBF7", marginBottom: 12, overflow: "hidden" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 16px", borderBottom: "1px solid #FDE5C0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <Zap size={13} style={{ color: "#EA580C" }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: "#111827" }}>Getting started</span>
                  <span style={{ fontSize: 10, fontWeight: 700, background: "#FEF0EB", color: "#EA580C", padding: "2px 7px", borderRadius: 20, border: "1px solid #FDDBC8" }}>
                    {checklistTasks.filter(t => t.done).length}/{checklistTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => { setChecklistDismissed(true); localStorage.setItem("checklist_dismissed", "true"); }}
                  style={{ color: "#9CA3AF", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}
                >
                  <X size={13} />
                </button>
              </div>
              {checklistTasks.map((task, i) => (
                <Link
                  key={task.id}
                  href={task.href}
                  className="flex items-center gap-3 hover:bg-orange-50/40 transition-colors"
                  style={{ padding: "10px 16px", borderBottom: i < checklistTasks.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}
                >
                  <CheckCircle2 size={16} style={{ flexShrink: 0, color: task.done ? "#10B981" : "#D1D5DB" }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: task.done ? "#9CA3AF" : "#111827", textDecoration: task.done ? "line-through" : "none", margin: 0 }}>{task.label}</p>
                    <p style={{ fontSize: 10, color: "#9CA3AF", margin: 0 }}>{task.sub}</p>
                  </div>
                  {!task.done && <ChevronRight size={13} style={{ color: "#D1D5DB", flexShrink: 0 }} />}
                </Link>
              ))}
            </div>
          )}

          {/* Deal pipeline list */}
          {deals.length === 0 ? (
            <div style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", background: "#FAFAFA", padding: "48px 24px", textAlign: "center" }}>
              <BarChart2 size={28} style={{ color: "#E5E7EB", margin: "0 auto 12px" }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", margin: "0 0 4px" }}>No deals yet.</p>
              <p style={{ fontSize: 11, color: "#D1D5DB", margin: 0 }}>Positive replies in your inbox get flagged automatically.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {recentDeals.map((deal) => {
                const accent = DEAL_STAGE_ACCENT[deal.status] || "#6B7280";
                return (
                  <div
                    key={deal.id}
                    style={{
                      borderRadius: 14,
                      padding: "14px 18px",
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      background: "white",
                      border: "1px solid rgba(0,0,0,0.06)",
                      borderLeft: `4px solid ${accent}`,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
                        {deal.company || deal.contactName}
                      </p>
                      {deal.company && (
                        <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 0 }}>{deal.contactName}</p>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      {deal.value && (
                        <span style={{ fontSize: 13, fontWeight: 800, color: "#059669" }}>{deal.value}</span>
                      )}
                      <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", padding: "5px 10px", borderRadius: 20, background: `${accent}18`, color: accent }}>
                        {DEAL_STAGE_LABELS[deal.status] || deal.status}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top performers = Top Brands */}
        <div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <h2 style={{ fontSize: 19, fontWeight: 800, color: "#111827", margin: 0 }}>Top performers</h2>
          </div>

          {brands.length === 0 ? (
            <div style={{ borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", background: "#FAFAFA", padding: "36px 20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", margin: "0 0 4px" }}>No brands yet.</p>
              <p style={{ fontSize: 11, color: "#D1D5DB", margin: 0 }}>Add brands to monitor in Settings.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {brands.slice(0, 5).map((brand, i) => {
                const pct = Math.max(10, Math.round((1 / (i + 1)) * 45));
                return (
                  <div
                    key={brand.name + i}
                    className="flex items-center gap-3 rounded-2xl hover:bg-gray-50 transition-colors"
                    style={{ padding: "11px 14px" }}
                  >
                    <div
                      style={{ width: 36, height: 36, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: BRAND_AVATAR_COLOURS[i % BRAND_AVATAR_COLOURS.length], color: "white", fontSize: 13, fontWeight: 800 }}
                    >
                      {brand.name[0]?.toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>{brand.name}</p>
                      <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0 }}>{brand.runningAds ? "Running ads" : "No active ads"}</p>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 800, color: brand.runningAds ? "#10B981" : "#9CA3AF", flexShrink: 0 }}>
                      {pct}%
                    </span>
                  </div>
                );
              })}
              {brands.length > 5 && (
                <Link href="/ads" style={{ display: "flex", alignItems: "center", gap: 1, padding: "8px 14px", fontSize: 12, fontWeight: 700, color: "#EA580C", textDecoration: "none" }}>
                  View More <ChevronRight size={13} />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── BOTTOM ROW: Channels / Follow-ups ── */}
      <div>
        <div style={{ display: "flex", gap: 16, alignItems: "stretch" }}>

          {/* Label block */}
          <div style={{ width: 180, flexShrink: 0, paddingTop: 4 }}>
            <h3 style={{ fontSize: 17, fontWeight: 800, color: "#111827", margin: "0 0 6px" }}>Follow-ups</h3>
            <p style={{ fontSize: 12, color: "#9CA3AF", margin: 0, lineHeight: 1.5 }}>
              Contacts awaiting a reply for <strong style={{ color: "#374151" }}>5+ days</strong>
            </p>
          </div>

          {/* Follow-up cards */}
          {followUps.length === 0 ? (
            <div style={{ flex: 1, borderRadius: 16, border: "1px solid rgba(0,0,0,0.06)", background: "#FAFAFA", padding: "20px 24px", display: "flex", alignItems: "center", gap: 12 }}>
              <Clock size={18} style={{ color: "#D1D5DB", flexShrink: 0 }} />
              <p style={{ fontSize: 13, fontWeight: 600, color: "#9CA3AF", margin: 0 }}>All up to date — no follow-ups needed right now.</p>
            </div>
          ) : (
            <>
              {followUps.slice(0, 3).map((f) => (
                <Link
                  key={f.email}
                  href={`/send?to=${encodeURIComponent(f.email)}&name=${encodeURIComponent(f.name)}`}
                  style={{ flex: 1, borderRadius: 18, background: "white", border: "1px solid rgba(0,0,0,0.07)", padding: "16px 18px", textDecoration: "none", display: "flex", flexDirection: "column", gap: 6, minWidth: 0 }}
                  className="hover:shadow-md transition-shadow"
                >
                  <div style={{ width: 36, height: 36, borderRadius: 11, background: "#F5F0EA", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 800, color: "#D4795C" }}>
                    {f.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 800, color: "#111827", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                    <p style={{ fontSize: 11, color: "#9CA3AF", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.email}</p>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: f.daysAgo >= 14 ? "#EF4444" : "#F59E0B" }}>
                    +{f.daysAgo} days
                  </span>
                </Link>
              ))}

              {/* Full Stats card */}
              <Link
                href="/contacts"
                style={{ width: 120, flexShrink: 0, borderRadius: 18, background: "#4BBFB0", padding: "16px 18px", textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}
                className="hover:opacity-90 transition-opacity"
              >
                <p style={{ fontSize: 14, fontWeight: 900, color: "white", textAlign: "center", margin: 0, lineHeight: 1.2 }}>Full<br />Stats</p>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <ChevronRight size={16} color="white" />
                </div>
              </Link>
            </>
          )}
        </div>
      </div>

      {/* ── Analytics platform row ── */}
      <div style={{ borderRadius: 20, padding: "20px 24px", background: "linear-gradient(135deg, #FB923C 0%, #EA580C 60%, #C2410C 100%)", boxShadow: "0 4px 20px rgba(234,88,12,0.2)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(255,255,255,0.65)", margin: "0 0 4px" }}>Your Audience</p>
            <p style={{ fontSize: 26, fontWeight: 900, letterSpacing: "-0.04em", color: "white", margin: 0 }}>
              {firstName}&apos;s social presence
            </p>
          </div>
          <Link
            href="/analytics"
            className="inline-flex items-center gap-2 text-white text-sm font-bold rounded-xl transition-all"
            style={{ padding: "9px 18px", background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.25)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.28)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)"}
          >
            View Analytics →
          </Link>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 16, marginTop: 16, display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {[
            { icon: <InstagramIcon size={20} />, bg: "linear-gradient(135deg,#E1306C,#833AB4)", count: "137K", label: "Instagram" },
            { icon: <TikTokIcon size={18} />,    bg: "#010101",                                  count: "84K",  label: "TikTok" },
            { icon: <FacebookIcon size={18} />,  bg: "#1877F2",                                  count: "52K",  label: "Facebook" },
          ].map(({ icon, bg, count, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.1)", borderRadius: 12, padding: "10px 14px" }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: bg, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {icon}
              </div>
              <div>
                <p style={{ fontSize: 18, fontWeight: 900, color: "white", margin: 0, letterSpacing: "-0.03em" }}>{count}</p>
                <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.6)", textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
