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

const DEAL_STAGE_BADGE: Record<string, string> = {
  pitched:     "bg-blue-100 text-blue-700",
  replied:     "bg-indigo-100 text-indigo-700",
  negotiating: "bg-amber-100 text-amber-700",
  contracted:  "bg-violet-100 text-violet-700",
  delivered:   "bg-teal-100 text-teal-700",
  paid:        "bg-emerald-100 text-emerald-700",
};

const BRAND_AVATAR_COLOURS = ["#3B82F6","#8B5CF6","#10B981","#F59E0B","#EF4444","#EC4899","#06B6D4","#84CC16","#F97316","#6366F1"];

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
    // Check email connection status (client-side localStorage)
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
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "var(--blush)" }}>

      {/* Email not connected banner */}
      {emailConnected === null && (
        <div className="flex items-center gap-3 px-6 py-2.5 flex-shrink-0" style={{ background: "#FFF8EE", borderBottom: "1px solid #FDE5B8" }}>
          <AlertTriangle size={13} style={{ color: "#D97706", flexShrink: 0 }} />
          <p className="text-xs font-medium flex-1" style={{ color: "#92400E" }}>
            <span className="font-bold">No email connected.</span> Connect Gmail or Microsoft to send outreach.
          </p>
          <Link href="/settings" className="text-xs font-bold whitespace-nowrap px-3 py-1 rounded-lg transition-colors" style={{ color: "#B45309", background: "#FEF3C7", border: "1px solid #FDE68A" }}>
            Connect now →
          </Link>
        </div>
      )}

      {/* Gmail token expired banner */}
      {emailConnected === "expired" && (
        <div className="flex items-center gap-3 px-6 py-2.5 flex-shrink-0" style={{ background: "#FFF5F5", borderBottom: "1px solid #FECACA" }}>
          <AlertTriangle size={13} style={{ color: "#EF4444", flexShrink: 0 }} />
          <p className="text-xs font-medium flex-1" style={{ color: "#7F1D1D" }}>
            <span className="font-bold">Gmail session expired.</span> Your emails won&apos;t send until you reconnect.
          </p>
          <Link href="/settings" className="text-xs font-bold whitespace-nowrap px-3 py-1 rounded-lg transition-colors" style={{ color: "#B91C1C", background: "#FEE2E2", border: "1px solid #FECACA" }}>
            Reconnect →
          </Link>
        </div>
      )}

      {/* Header */}
      <div
        className="flex items-center justify-between px-8 pt-6 pb-5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)", background: "#fff" }}
      >
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest mb-1" style={{ color: "#9CA3AF" }}>{today}</p>
          <h1 className="text-[28px] font-black tracking-tight" style={{ color: "#0D1B2A", letterSpacing: "-0.035em" }}>Good morning, {firstName}.</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all"
            style={{ background: "#fff", border: "1px solid var(--border)", color: "#374151" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E8622A"; (e.currentTarget as HTMLElement).style.color = "#E8622A"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "var(--border)"; (e.currentTarget as HTMLElement).style.color = "#374151"; }}
          >
            <Users size={13} />
            New Campaign
          </Link>
          <Link
            href="/send"
            className="inline-flex items-center gap-2 px-4 py-2 text-white text-sm font-bold rounded-xl transition-all"
            style={{ background: "#E8622A", boxShadow: "0 1px 8px rgba(232,98,42,0.35)" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#d45520"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#E8622A"}
          >
            <Send size={13} />
            Quick Send
          </Link>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-3 p-4">

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-4 min-h-0">

          {/* Getting started checklist */}
          {showChecklist && (
            <div className="bg-white rounded-2xl border flex-shrink-0 overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between px-5 py-3.5 border-b" style={{ borderColor: "var(--border)" }}>
                <div className="flex items-center gap-2">
                  <Zap size={14} className="text-coral-500" />
                  <span className="text-sm font-black text-navy-900">Getting started</span>
                  <span className="text-[10px] font-bold bg-coral-100 text-coral-600 px-2 py-0.5 rounded-full">
                    {checklistTasks.filter(t => t.done).length}/{checklistTasks.length}
                  </span>
                </div>
                <button
                  onClick={() => { setChecklistDismissed(true); localStorage.setItem("checklist_dismissed", "true"); }}
                  className="text-navy-300 hover:text-navy-600 transition-colors"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="divide-y" style={{ borderColor: "var(--border)" }}>
                {checklistTasks.map((task) => (
                  <Link
                    key={task.id}
                    href={task.href}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-cream-50 transition-colors group"
                  >
                    <CheckCircle2
                      size={18}
                      className={`flex-shrink-0 transition-colors ${task.done ? "text-emerald-500" : "text-cream-300 group-hover:text-navy-300"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${task.done ? "text-navy-400 line-through" : "text-navy-900"}`}>
                        {task.label}
                      </p>
                      <p className="text-xs text-navy-400">{task.sub}</p>
                    </div>
                    {!task.done && <ChevronRight size={14} className="text-navy-300 group-hover:text-navy-500 flex-shrink-0" />}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Analytics Card */}
          <div
            className="rounded-2xl p-5 flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #0D1B2A 0%, #162540 55%, #1C3358 100%)" }}
          >
            {/* Title */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "#93B8D4" }}>Analytics</p>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full" style={{ color: "#F08050", background: "rgba(232,98,42,0.15)", border: "1px solid rgba(232,98,42,0.3)" }}>
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#E8622A" }} />
                Live Data
              </span>
            </div>

            {/* Avg views */}
            <div className="mb-5 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
              <p className="text-xs font-medium mb-1" style={{ color: "#93B8D4" }}>Avg. Views per Post — last 7 days</p>
              <div className="flex items-end gap-3">
                <p className="text-white text-5xl font-black tracking-tight leading-none">—</p>
                <p className="text-xs mb-1" style={{ color: "#5A88A8" }}>Connect Meta API to populate</p>
              </div>
            </div>

            {/* Follower counts */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Instagram */}
              <div className="flex flex-col items-center gap-3 rounded-xl py-4 px-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #F58529 0%, #DD2A7B 50%, #8134AF 100%)" }}
                >
                  <InstagramIcon size={28} />
                </div>
                <div className="text-center">
                  <p className="text-white text-3xl font-black leading-none tracking-tight mb-1">137K</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#93B8D4" }}>Instagram</p>
                </div>
              </div>

              {/* TikTok */}
              <div className="flex flex-col items-center gap-3 rounded-xl py-4 px-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #010101 0%, #69C9D0 100%)" }}
                >
                  <TikTokIcon size={26} />
                </div>
                <div className="text-center">
                  <p className="text-white text-3xl font-black leading-none tracking-tight mb-1">84K</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#93B8D4" }}>TikTok</p>
                </div>
              </div>

              {/* Facebook */}
              <div className="flex flex-col items-center gap-3 rounded-xl py-4 px-3" style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: "#1877F2" }}
                >
                  <FacebookIcon size={26} />
                </div>
                <div className="text-center">
                  <p className="text-white text-3xl font-black leading-none tracking-tight mb-1">52K</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#93B8D4" }}>Facebook</p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Brands + Ads Alerts */}
          <div
            className="flex-1 min-h-0 bg-white rounded-2xl border flex flex-col overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-coral-500" />
                <span className="text-base font-black text-navy-900">Top Brands</span>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-navy-400">Ads Alerts</span>
            </div>
            {brands.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <p className="text-sm font-semibold text-navy-400">No brands added yet.</p>
                <p className="text-xs text-navy-300 mt-1">Add brands to monitor in Settings.</p>
              </div>
            ) : (
              <div className="flex-1 grid grid-cols-2 content-start p-3 gap-2 overflow-hidden">
                {brands.map((brand, i) => (
                  <div
                    key={brand.name + i}
                    className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-navy-50/40 transition-colors border"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <div
                      className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 text-white text-[10px] font-black"
                      style={{ background: BRAND_AVATAR_COLOURS[i % BRAND_AVATAR_COLOURS.length] }}
                    >
                      {brand.name[0]?.toUpperCase()}
                    </div>
                    <span className="flex-1 font-bold text-navy-900 text-xs truncate">{brand.name}</span>
                    {brand.runningAds ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600" title="Running Ads">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse flex-shrink-0" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400" title="No Ads">
                        <span className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="flex flex-col gap-4 min-h-0">

          {/* Deal Pipeline */}
          <div
            className="flex-1 min-h-0 bg-white rounded-2xl border flex flex-col overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <TrendingUp size={15} className="text-coral-500" />
                <span className="text-base font-black text-navy-900">Deal Pipeline</span>
                {activeDeals.length > 0 && (
                  <span className="text-[10px] font-bold bg-coral-100 text-coral-600 px-2 py-0.5 rounded-full">
                    {activeDeals.length} active
                  </span>
                )}
              </div>
              <Link href="/pipeline" className="text-[11px] text-navy-400 hover:text-coral-500 transition-colors font-semibold">
                View all →
              </Link>
            </div>

            {deals.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <TrendingUp size={28} className="text-navy-200 mb-3" />
                <p className="text-sm font-semibold text-navy-400">No deals yet.</p>
                <p className="text-xs text-navy-300 mt-1">Positive replies in your inbox get flagged automatically.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-1.5">
                {recentDeals.map((deal) => {
                  const accent = DEAL_STAGE_ACCENT[deal.status] || "#6B7280";
                  return (
                    <div
                      key={deal.id}
                      className="rounded-xl px-3.5 py-3 flex items-center gap-3"
                      style={{
                        background: "#fff",
                        border: "1px solid var(--border)",
                        borderLeft: `3px solid ${accent}`,
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: "#0D1B2A" }}>
                          {deal.company || deal.contactName}
                        </p>
                        {deal.company && (
                          <p className="text-xs truncate" style={{ color: "#9CA3AF" }}>{deal.contactName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {deal.value && (
                          <span className="text-xs font-bold" style={{ color: "#059669" }}>
                            {deal.value}
                          </span>
                        )}
                        <span className="text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-md"
                          style={{ background: `${accent}15`, color: accent }}>
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
          <div
            className="flex-1 min-h-0 bg-white rounded-2xl border flex flex-col overflow-hidden"
            style={{ borderColor: "var(--border)" }}
          >
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="flex items-center gap-2">
                <Bell size={15} className="text-coral-500" />
                <span className="text-base font-black text-navy-900">Follow-up Reminders</span>
                {followUps.length > 0 && (
                  <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                    {followUps.length} due
                  </span>
                )}
              </div>
              <Link href="/contacts" className="text-[11px] text-navy-400 hover:text-coral-500 transition-colors font-semibold">
                View contacts →
              </Link>
            </div>

            {followUps.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
                <Clock size={24} className="text-navy-200 mb-3" />
                <p className="text-sm font-semibold text-navy-400">All up to date.</p>
                <p className="text-xs text-navy-300 mt-1">Contacts emailed 5+ days ago appear here.</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto scrollbar-thin divide-y" style={{ borderColor: "var(--border)" }}>
                {followUps.map((f) => (
                  <div
                    key={f.email}
                    className="flex items-center gap-3 px-5 py-3 hover:bg-navy-50/40 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-navy-900 truncate">{f.name}</p>
                      <p className="text-xs text-navy-400 font-medium truncate">{f.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span
                        className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                          f.daysAgo >= 14 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                        }`}
                      >
                        {f.daysAgo}d ago
                      </span>
                      <Link
                        href={`/send?to=${encodeURIComponent(f.email)}&name=${encodeURIComponent(f.name)}`}
                        className="p-1.5 hover:bg-coral-50 rounded-lg transition-colors"
                      >
                        <ChevronRight size={13} className="text-navy-400" />
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
