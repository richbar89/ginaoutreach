"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Users, TrendingUp, Bell, ChevronRight, Clock, Zap } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { getEmailLog, getContacts, getDeals, getBrands } from "@/lib/storage";
import type { Deal, Brand } from "@/lib/types";

const DEAL_STAGE_LABELS: Record<string, string> = {
  pitched: "Pitched", replied: "Replied", negotiating: "Negotiating",
  contracted: "Contracted", delivered: "Delivered", paid: "Paid",
};

const DEAL_CARD_COLOURS = [
  { bg: "#EFF6FF", border: "#BFDBFE" },
  { bg: "#F5F3FF", border: "#DDD6FE" },
  { bg: "#ECFDF5", border: "#A7F3D0" },
  { bg: "#FFF7ED", border: "#FED7AA" },
  { bg: "#FDF4FF", border: "#E9D5FF" },
  { bg: "#F0FDFA", border: "#99F6E4" },
];

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
  const [contactCount, setContactCount] = useState(0);
  const [emailsSent, setEmailsSent] = useState(0);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);

  useEffect(() => {
    const contactList = getContacts();
    setContactCount(contactList.length);

    const log = getEmailLog();
    setEmailsSent(log.length);

    const latestPerContact = new Map<string, { sentAt: string; subject: string; name: string }>();
    for (const r of log) {
      const existing = latestPerContact.get(r.contactEmail);
      if (!existing || r.sentAt > existing.sentAt) {
        const contact = contactList.find(c => c.email.toLowerCase() === r.contactEmail);
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
    setDeals(getDeals());
    setBrands(getBrands());
  }, []);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const recentDeals = deals.slice(0, 6);
  const activeDeals = deals.filter(d => d.status !== "paid");

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "var(--blush)" }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-8 pt-6 pb-5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-navy-400 mb-1">{today}</p>
          <h1 className="text-3xl font-black tracking-tight text-navy-900">Good morning, {firstName}.</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border text-navy-700 text-sm font-semibold rounded-xl transition-all hover:border-coral-300 hover:shadow-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <Users size={14} />
            New Campaign
          </Link>
          <Link
            href="/send"
            className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold rounded-xl transition-all shadow-sm"
          >
            <Send size={14} />
            Quick Send
          </Link>
        </div>
      </div>

      {/* Main grid */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 p-5">

        {/* ── LEFT COLUMN ── */}
        <div className="flex flex-col gap-4 min-h-0">

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
              <div className="flex-1 overflow-y-auto scrollbar-thin p-3 space-y-2">
                {recentDeals.map((deal, i) => {
                  const colours = DEAL_CARD_COLOURS[i % DEAL_CARD_COLOURS.length];
                  return (
                    <div
                      key={deal.id}
                      className="rounded-xl px-4 py-3 flex items-center gap-3"
                      style={{ background: colours.bg, border: `1px solid ${colours.border}` }}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-navy-900 truncate">
                          {deal.company || deal.contactName}
                        </p>
                        {deal.company && (
                          <p className="text-xs text-navy-500 font-medium truncate">{deal.contactName}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {deal.value && (
                          <span className="text-xs font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                            {deal.value}
                          </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${DEAL_STAGE_BADGE[deal.status] || "bg-navy-100 text-navy-600"}`}>
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
