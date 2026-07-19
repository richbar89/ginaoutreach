"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Send, Users, TrendingUp, ChevronRight, Clock,
  Star, Edit2, Check, Mail, AlertTriangle, RefreshCw,
} from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useDb } from "@/lib/useDb";
import { dbGetEmailLog, dbGetDeals, dbGetBrands, dbUpdateBrandDomain } from "@/lib/db";
import { getEmailAccount } from "@/lib/emailClient";
import BrandLogo from "@/components/BrandLogo";
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

function StatTile({ label, value, sub, alert }: { label: string; value: number | string; sub?: string; alert?: boolean }) {
  return (
    <div style={{
      background: "#FFFFFF", borderRadius: 16, border: "1px solid rgba(0,0,0,0.05)",
      boxShadow: "0 1px 8px rgba(0,0,0,0.04)", padding: "14px 18px",
      display: "flex", flexDirection: "column", gap: 4, minWidth: 0,
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#86868B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
        <span style={{ fontSize: 26, fontWeight: 700, letterSpacing: "-0.02em", color: alert ? "#E8622A" : "#1D1D1F", lineHeight: 1 }}>
          {value}
        </span>
        {sub && <span style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 500 }}>{sub}</span>}
      </div>
    </div>
  );
}

const FAV_KEY = "dashboard_fav_brands";
const DOMAINS_KEY = "dashboard_brand_domains";

const CARD: React.CSSProperties = {
  background: "#FFFFFF",
  borderRadius: 20,
  border: "1px solid rgba(0, 0, 0, 0.05)",
  boxShadow: "0 2px 12px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.03)",
};

const CARD_DIVIDER = "1px solid rgba(0, 0, 0, 0.06)";

type FollowUp = { email: string; name: string; subject: string; daysAgo: number };


export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "there";
  const getDb = useDb();

  const [emailsSent, setEmailsSent] = useState(0);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [allCompanies, setAllCompanies] = useState<string[]>([]);
  const [emailConnected, setEmailConnected] = useState<"connected" | "expired" | null>(null);
  const [adStatuses, setAdStatuses] = useState<Record<string, AdStatus>>({});
  const [favBrands, setFavBrands] = useState<string[]>([]);
  const [editingFavs, setEditingFavs] = useState(false);
  const [pickerSearch, setPickerSearch] = useState("");
  const [pickerCategory, setPickerCategory] = useState("");
  const [extraDomains, setExtraDomains] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(DOMAINS_KEY) ?? "{}"); } catch { return {}; }
  });
  const [resolvingDomains, setResolvingDomains] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [companyCategories, setCompanyCategories] = useState<Record<string, string>>({});
  const [emailDomainMap, setEmailDomainMap] = useState<Record<string, string>>({});

  useEffect(() => {
    getEmailAccount().then(acc => setEmailConnected(acc ? "connected" : null));
    const stored = localStorage.getItem(FAV_KEY);
    if (stored) {
      setFavBrands(JSON.parse(stored));
    } else {
      // Fall back to Supabase for cross-browser persistence
      getDb().then(db =>
        db.from("user_settings").select("fav_brands").maybeSingle()
      ).then(({ data }) => {
        if (data?.fav_brands?.length) {
          setFavBrands(data.fav_brands);
          localStorage.setItem(FAV_KEY, JSON.stringify(data.fav_brands));
        }
      }).catch(() => {});
    }
    getAllCachedStatuses().then(setAdStatuses);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      const [db, contactsRes] = await Promise.all([getDb(), fetch("/api/contacts")]);
      const contactsList: { email: string; name: string; company?: string; category?: string }[] =
        contactsRes.ok ? await contactsRes.json() : [];

      const companies = Array.from(
        new Set(contactsList.map(c => c.company).filter(Boolean))
      ) as string[];
      setAllCompanies(companies);

      const catMap: Record<string, string> = {};
      for (const c of contactsList) {
        if (c.company && c.category && !catMap[c.company]) catMap[c.company] = c.category;
      }
      setCompanyCategories(catMap);

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

      const brandsData = user?.id ? await dbGetBrands(db, user.id) : [];
      setBrands(brandsData);
      setLoadingData(false);

      // Push known domains into the localStorage cache immediately
      const domainsFromDb = brandsData.reduce<Record<string, string>>((acc, b) => {
        if (b.domain) acc[b.name] = b.domain;
        return acc;
      }, {});
      if (Object.keys(domainsFromDb).length > 0) {
        setExtraDomains(prev => {
          const next = { ...prev, ...domainsFromDb };
          localStorage.setItem(DOMAINS_KEY, JSON.stringify(next));
          return next;
        });
      }

      // Resolve and permanently store domains for any brands that don't have one yet
      const missing = brandsData.filter(b => !b.domain);
      if (missing.length > 0) {
        Promise.allSettled(missing.map(async (b) => {
          try {
            const res = await fetch(`/api/resolve-domain?name=${encodeURIComponent(b.name)}`);
            const { domain } = await res.json() as { domain: string };
            if (domain) {
              if (user?.id) await dbUpdateBrandDomain(db, b.name, domain, user.id);
              setBrands(prev => prev.map(p => p.name === b.name ? { ...p, domain } : p));
              setExtraDomains(prev => {
                const next = { ...prev, [b.name]: domain };
                localStorage.setItem(DOMAINS_KEY, JSON.stringify(next));
                return next;
              });
            }
          } catch { /* ignore */ }
        }));
      }

      const stored = localStorage.getItem(FAV_KEY);
      if (!stored && brandsData.length > 0) {
        const initial = brandsData.slice(0, 10).map(b => b.name);
        setFavBrands(initial);
        localStorage.setItem(FAV_KEY, JSON.stringify(initial));
        db.from("user_settings").upsert({ fav_brands: initial });
      }

      // Resolve domains for fav brands not already in the brands table
      const favStored: string[] = stored ? JSON.parse(stored) : [];
      const cachedDomains: Record<string, string> = (() => {
        try { return JSON.parse(localStorage.getItem(DOMAINS_KEY) ?? "{}"); } catch { return {}; }
      })();
      const unresolved = favStored.filter(name =>
        !brandsData.find(b => b.name === name && b.domain) && !cachedDomains[name]
      );
      if (unresolved.length > 0) {
        setResolvingDomains(true);
        Promise.allSettled(unresolved.map(async (name) => {
          try {
            const res = await fetch(`/api/resolve-domain?name=${encodeURIComponent(name)}`);
            const { domain } = await res.json() as { domain: string };
            if (domain) setExtraDomains(prev => {
              const next = { ...prev, [name]: domain };
              localStorage.setItem(DOMAINS_KEY, JSON.stringify(next));
              return next;
            });
          } catch { /* ignore */ }
        })).finally(() => setResolvingDomains(false));
      }
    })();
  }, [getDb]);

  function toggleFav(name: string) {
    setFavBrands(prev => {
      const next = prev.includes(name)
        ? prev.filter(n => n !== name)
        : prev.length < 10 ? [...prev, name] : prev;
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      getDb().then(db => db.from("user_settings").upsert({ fav_brands: next })).catch(() => {});
      return next;
    });
  }

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  });
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";
  const activeDeals = deals.filter(d => d.status !== "paid");
  const recentDeals = deals.slice(0, 5);
  const allBrandNames = Array.from(new Set([...brands.map(b => b.name), ...allCompanies])).sort();
  const displayedBrands = favBrands.map(name => {
    const dbBrand = brands.find(b => b.name === name);
    const cached = adStatuses[name];
    return { name, runningAds: cached?.hasAds ?? dbBrand?.runningAds ?? null, checkedAt: cached?.checkedAt ?? null, domain: dbBrand?.domain ?? extraDomains[name] };
  });

  const emailReady = emailConnected === "connected";

  return (
    <div style={{
      height: "100%",
      display: "flex",
      flexDirection: "column",
      padding: "28px 32px",
      gap: "20px",
      overflow: "hidden",
    }}>

      {/* ── Header: greeting on canvas, or connect prompt card ── */}
      {!emailReady ? (
        <div className="flex items-center justify-between flex-shrink-0" style={{ ...CARD, padding: "20px 28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, flex: 1 }}>
            <div style={{ width: 42, height: 42, borderRadius: 13, background: emailConnected === "expired" ? "#FEF2F2" : "#FFF4EE", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              {emailConnected === "expired"
                ? <AlertTriangle size={20} style={{ color: "#EF4444" }} />
                : <Mail size={20} style={{ color: "#E8622A" }} />}
            </div>
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.02em" }}>
                {emailConnected === "expired" ? "Email session expired" : `Welcome, ${firstName} — connect your email to get started`}
              </p>
              <p style={{ fontSize: 13, color: "#86868B", marginTop: 3 }}>
                {emailConnected === "expired"
                  ? "Your emails won't send until you reconnect."
                  : "Send outreach directly from your own inbox."}
              </p>
            </div>
            <Link
              href="/settings"
              className="inline-flex items-center gap-2 text-white text-sm font-semibold rounded-full transition-all flex-shrink-0"
              style={{ padding: "10px 20px", background: emailConnected === "expired" ? "#EF4444" : "#E8622A", boxShadow: `0 2px 14px ${emailConnected === "expired" ? "rgba(239,68,68,0.35)" : "rgba(232,98,42,0.28)"}`, marginLeft: "auto" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.opacity = "0.88"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.opacity = "1"}
            >
              {emailConnected === "expired" ? <><RefreshCw size={13} /> Reconnect</> : <><Mail size={13} /> Connect email</>}
            </Link>
          </div>
        </div>
      ) : (
        <div className="flex items-end justify-between flex-shrink-0">
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "#AEAEB2", marginBottom: 7 }}>
              {today}
            </p>
            <h1 style={{ fontSize: 32, fontWeight: 700, letterSpacing: "-0.03em", color: "#1D1D1F", lineHeight: 1 }}>
              {greeting}, {firstName}.
            </h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-2 text-sm font-semibold rounded-full transition-all"
              style={{ padding: "9px 18px", background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.08)", color: "#3A3A3D" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#E8622A"; (e.currentTarget as HTMLElement).style.color = "#E8622A"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(0,0,0,0.08)"; (e.currentTarget as HTMLElement).style.color = "#3A3A3D"; }}
            >
              <Users size={13} /> New Campaign
            </Link>
            <Link
              href="/send"
              className="inline-flex items-center gap-2 text-white text-sm font-semibold rounded-full transition-all"
              style={{ padding: "9px 18px", background: "#E8622A", boxShadow: "0 2px 14px rgba(232,98,42,0.28)" }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "#D14E1D"}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "#E8622A"}
            >
              <Send size={13} /> Quick Send
            </Link>
          </div>
        </div>
      )}

      {/* ── Stat strip ── */}
      {emailReady && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, flexShrink: 0 }}>
          <StatTile label="Emails sent" value={emailsSent} />
          <StatTile label="Active deals" value={activeDeals.length} />
          <StatTile label="Follow-ups due" value={followUps.length} alert={followUps.length > 0} />
          <StatTile
            label="Brands live on ads"
            value={displayedBrands.filter(b => b.runningAds === true).length}
            sub={`of ${favBrands.length} tracked`}
          />
        </div>
      )}

      {/* ── Main grid — fills remaining height, no scroll ── */}
      <div style={{
        flex: 1, minHeight: 0,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "20px",
      }}>

        {/* LEFT COLUMN — Meta Ads full height */}
        <div style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ ...CARD, flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 24px", borderBottom: CARD_DIVIDER, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", color: "#1D1D1F" }}>Ad Signals</span>
                <span style={{ fontSize: 11, fontWeight: 600, background: "#FFF4EE", color: "#D14E1D", padding: "2px 8px", borderRadius: 20 }}>
                  {favBrands.length}/10
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={() => { setEditingFavs(v => !v); setPickerSearch(""); setPickerCategory(""); }}
                  style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: editingFavs ? "#10B981" : "#86868B", background: editingFavs ? "rgba(16,185,129,0.08)" : "rgba(0,0,0,0.04)", border: `1px solid ${editingFavs ? "rgba(16,185,129,0.25)" : "rgba(0,0,0,0.08)"}`, borderRadius: 7, padding: "4px 10px", cursor: "pointer" }}
                >
                  {editingFavs ? <Check size={11} /> : <Edit2 size={11} />}
                  {editingFavs ? "Done" : "Edit"}
                </button>
                <Link href="/ads" style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 600, textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#E8622A"}
                  onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#AEAEB2"}
                >
                  Full scan →
                </Link>
              </div>
            </div>

            {resolvingDomains && !editingFavs && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "7px 20px", background: "rgba(232,98,42,0.04)", borderBottom: CARD_DIVIDER, flexShrink: 0 }}>
                <RefreshCw size={11} className="animate-spin" style={{ color: "#E8622A" }} />
                <span style={{ fontSize: 11, color: "#E8622A", fontWeight: 600 }}>Building brand intelligence…</span>
              </div>
            )}

            {editingFavs && (
              <div style={{ borderBottom: CARD_DIVIDER, background: "rgba(249,250,251,0.8)", flexShrink: 0 }}>
                {/* Search + category filter */}
                <div style={{ display: "flex", gap: 8, padding: "10px 16px" }}>
                  <input
                    type="text"
                    placeholder="Search brands..."
                    value={pickerSearch}
                    onChange={e => setPickerSearch(e.target.value)}
                    style={{ flex: 1, fontSize: 11, padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", outline: "none", color: "#1D1D1F" }}
                    autoFocus
                  />
                  {Object.keys(companyCategories).length > 0 && (
                    <select
                      value={pickerCategory}
                      onChange={e => setPickerCategory(e.target.value)}
                      style={{ fontSize: 11, padding: "6px 8px", borderRadius: 8, border: "1px solid rgba(0,0,0,0.1)", background: "#fff", color: "#3A3A3D", cursor: "pointer" }}
                    >
                      <option value="">All categories</option>
                      {Array.from(new Set(Object.values(companyCategories))).sort().map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  )}
                </div>
                {/* A-Z brand list */}
                <div className="scrollbar-thin" style={{ maxHeight: 180, overflowY: "auto", padding: "0 16px 10px" }}>
                  {(() => {
                    const filtered = allBrandNames.filter(name => {
                      const matchSearch = !pickerSearch || name.toLowerCase().includes(pickerSearch.toLowerCase());
                      const matchCat = !pickerCategory || companyCategories[name] === pickerCategory;
                      return matchSearch && matchCat;
                    });
                    if (filtered.length === 0) return (
                      <p style={{ fontSize: 11, color: "#D2D2D7", padding: "8px 0" }}>No brands match.</p>
                    );
                    const grouped = filtered.reduce<Record<string, string[]>>((acc, name) => {
                      const letter = name[0].toUpperCase();
                      if (!acc[letter]) acc[letter] = [];
                      acc[letter].push(name);
                      return acc;
                    }, {});
                    return Object.keys(grouped).sort().map(letter => (
                      <div key={letter}>
                        <p style={{ fontSize: 9, fontWeight: 800, color: "#AEAEB2", letterSpacing: "0.1em", textTransform: "uppercase", margin: "8px 0 4px" }}>{letter}</p>
                        {grouped[letter].map(name => {
                          const selected = favBrands.includes(name);
                          const atMax = !selected && favBrands.length >= 10;
                          return (
                            <button
                              key={name}
                              onClick={() => !atMax && toggleFav(name)}
                              style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "5px 8px", borderRadius: 8, border: "none", background: selected ? "rgba(232,98,42,0.08)" : "transparent", cursor: atMax ? "not-allowed" : "pointer", textAlign: "left", transition: "background 0.1s" }}
                            >
                              <span style={{ width: 14, height: 14, borderRadius: 4, border: `1.5px solid ${selected ? "#E8622A" : "rgba(0,0,0,0.15)"}`, background: selected ? "#E8622A" : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                {selected && <span style={{ color: "white", fontSize: 9, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                              </span>
                              <span style={{ fontSize: 11, fontWeight: 600, color: atMax && !selected ? "#D2D2D7" : selected ? "#E8622A" : "#3A3A3D" }}>{name}</span>
                              {companyCategories[name] && <span style={{ fontSize: 9, color: "#AEAEB2", marginLeft: "auto" }}>{companyCategories[name]}</span>}
                            </button>
                          );
                        })}
                      </div>
                    ));
                  })()}
                </div>
                <div style={{ padding: "6px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: 10, color: "#86868B" }}>{favBrands.length}/10 selected</span>
                  {favBrands.length > 0 && (
                    <button onClick={() => { setFavBrands([]); localStorage.setItem(FAV_KEY, JSON.stringify([])); }} style={{ fontSize: 10, color: "#EF4444", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>Clear all</button>
                  )}
                </div>
              </div>
            )}

            {displayedBrands.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32 }}>
                <Star size={24} style={{ color: "#E8E8ED", marginBottom: 10 }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: "#3A3A3D", marginBottom: 4 }}>Pick your 10 favourite brands</p>
                <p style={{ fontSize: 11, color: "#86868B", marginBottom: 14 }}>We'll track whether they're running Meta ads in real time.</p>
                <button
                  onClick={() => setEditingFavs(true)}
                  style={{ fontSize: 11, fontWeight: 700, padding: "8px 18px", borderRadius: 10, background: "#E8622A", color: "white", border: "none", cursor: "pointer" }}
                >
                  Select brands →
                </button>
              </div>
            ) : (
              <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", padding: "10px 18px", display: "flex", flexDirection: "column", gap: 6 }}>
                {displayedBrands.map((brand) => (
                  <div key={brand.name} className="flex items-center gap-3 rounded-2xl hover:bg-coral-50/50 transition-colors" style={{ padding: "9px 14px", border: "1px solid rgba(0,0,0,0.06)" }}>
                    <BrandLogo name={brand.name} size={34} domain={brand.domain} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ fontWeight: 700, color: "#1D1D1F", fontSize: 13, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>{brand.name}</span>
                      {brand.checkedAt && <span style={{ fontSize: 11, color: "#AEAEB2" }}>{Math.floor((Date.now() - new Date(brand.checkedAt).getTime()) / 3600000)}h ago</span>}
                    </div>
                    {brand.runningAds !== null ? (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, flexShrink: 0, background: brand.runningAds ? "#DCFCE7" : "#FEE2E2", color: brand.runningAds ? "#15803D" : "#DC2626", border: `1px solid ${brand.runningAds ? "#BBF7D0" : "#FECACA"}` }}>
                        {brand.runningAds ? "Live ads" : "No ads"}
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, flexShrink: 0, background: "#F5F5F7", color: "#86868B", border: "1px solid #E8E8ED" }}>
                        —
                      </span>
                    )}
                    <Link
                      href={`/contacts?q=${encodeURIComponent(brand.name)}`}
                      style={{ fontSize: 10, fontWeight: 700, padding: "4px 10px", borderRadius: 8, background: "rgba(232,98,42,0.08)", color: "#E8622A", border: "1px solid rgba(232,98,42,0.15)", textDecoration: "none", flexShrink: 0, whiteSpace: "nowrap" }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(232,98,42,0.15)"; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "rgba(232,98,42,0.08)"; }}
                    >
                      Contact
                    </Link>
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
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", color: "#1D1D1F" }}>Deals</span>
                {activeDeals.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, background: "#FFF4EE", color: "#D14E1D", padding: "2px 8px", borderRadius: 20 }}>
                    {activeDeals.length} active
                  </span>
                )}
              </div>
              <Link href="/pipeline" style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 600, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#E8622A"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#AEAEB2"}
              >
                View all →
              </Link>
            </div>

            {loadingData ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RefreshCw size={18} className="animate-spin" style={{ color: "#E8E8ED" }} />
              </div>
            ) : deals.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32 }}>
                <TrendingUp size={24} style={{ color: "#E8E8ED", marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#3A3A3D", marginBottom: 4 }}>No deals yet.</p>
                <p style={{ fontSize: 12, color: "#86868B", marginTop: 0 }}>Positive replies get flagged automatically.</p>
              </div>
            ) : (
              <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 7 }}>
                {recentDeals.map((deal) => {
                  const accent = DEAL_STAGE_ACCENT[deal.status] || "#6E6E73";
                  const companyName = deal.company || deal.contactName;
                  const domain = brands.find(b => b.name === companyName)?.domain ?? extraDomains[companyName];
                  return (
                    <div key={deal.id} style={{ borderRadius: 14, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.04)", borderLeft: `3px solid ${accent}` }}>
                      <BrandLogo name={companyName} domain={domain} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {companyName}
                        </p>
                        {deal.company && <p style={{ fontSize: 12, color: "#86868B", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{deal.contactName}</p>}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexShrink: 0 }}>
                        {deal.value && <span style={{ fontSize: 12, fontWeight: 800, color: "#059669" }}>{deal.value}</span>}
                        <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: `${accent}18`, color: accent }}>
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
                <span style={{ fontSize: 15, fontWeight: 600, letterSpacing: "-0.01em", color: "#1D1D1F" }}>Follow-ups</span>
                {followUps.length > 0 && (
                  <span style={{ fontSize: 11, fontWeight: 600, background: "#FEE2E2", color: "#DC2626", padding: "2px 8px", borderRadius: 20 }}>
                    {followUps.length} due
                  </span>
                )}
              </div>
              <Link href="/contacts" style={{ fontSize: 11, color: "#AEAEB2", fontWeight: 600, textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#E8622A"}
                onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#AEAEB2"}
              >
                View contacts →
              </Link>
            </div>

            {loadingData ? (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <RefreshCw size={18} className="animate-spin" style={{ color: "#E8E8ED" }} />
              </div>
            ) : followUps.length === 0 ? (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: 32 }}>
                <Clock size={20} style={{ color: "#E8E8ED", marginBottom: 12 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: "#3A3A3D", marginBottom: 4 }}>All up to date.</p>
                <p style={{ fontSize: 12, color: "#86868B", marginTop: 0 }}>Contacts emailed 5+ days ago appear here.</p>
              </div>
            ) : (
              <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto" }}>
                {followUps.map((f, i) => (
                  <div key={f.email} className="flex items-center gap-3 hover:bg-coral-50/40 transition-colors" style={{ padding: "13px 24px", borderBottom: i < followUps.length - 1 ? CARD_DIVIDER : "none" }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1D1D1F", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</p>
                      <p style={{ fontSize: 12, color: "#86868B", fontWeight: 500, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.subject}</p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 9px", borderRadius: 20, background: f.daysAgo >= 14 ? "#FEE2E2" : "#FEF3C7", color: f.daysAgo >= 14 ? "#DC2626" : "#D97706" }}>
                        {f.daysAgo}d ago
                      </span>
                      <Link
                        href={`/send?to=${encodeURIComponent(f.email)}&name=${encodeURIComponent(f.name)}`}
                        style={{ padding: 6, borderRadius: 7, color: "#AEAEB2", display: "flex", alignItems: "center", transition: "all 0.12s" }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "rgba(232,98,42,0.08)"; (e.currentTarget as HTMLElement).style.color = "#E8622A"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#AEAEB2"; }}
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
