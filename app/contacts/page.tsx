"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, X, Plus, Linkedin, Send, UtensilsCrossed, Sun, Sparkles, Dumbbell } from "lucide-react";
import { getAllCachedStatuses } from "@/lib/metaAds";
import type { AdStatus } from "@/lib/metaAds";
import InitialsAvatar from "@/components/InitialsAvatar";

type ContactRow = {
  id: string;
  name: string;
  email: string;
  position: string | null;
  company: string | null;
  linkedin: string | null;
  category: string | null;
  subcategory: string | null;
  country: string | null;
};

// ── Vertical definitions ────────────────────────────────────────────────────
const VERTICALS = [
  {
    key: "Food & Drink",
    label: "Foodies",
    icon: UtensilsCrossed,
    description: "Food & beverage brands",
    accent: "#E8622A",
    bg: "#FFF4EF",
    border: "#FCDDD0",
  },
  {
    key: "Lifestyle",
    label: "Lifestyle",
    icon: Sun,
    description: "Home, fashion & living",
    accent: "#7C3AED",
    bg: "#F5F0FF",
    border: "#DDD6FE",
  },
  {
    key: "Beauty",
    label: "Beauty",
    icon: Sparkles,
    description: "Skincare, makeup & wellness",
    accent: "#DB2777",
    bg: "#FFF0F7",
    border: "#FBCFE8",
  },
  {
    key: "Fitness",
    label: "Fitness",
    icon: Dumbbell,
    description: "Sports, health & active",
    accent: "#059669",
    bg: "#EFFFFA",
    border: "#A7F3D0",
  },
] as const;

type VerticalKey = (typeof VERTICALS)[number]["key"] | null;

// ── Subcategory badge colours ─────────────────────────────────────────────
const SUBCATEGORY_COLOURS: Record<string, { bg: string; text: string; dot: string }> = {
  "Snacks & Crisps":             { bg: "bg-amber-50 border-amber-200",    text: "text-amber-800",   dot: "bg-amber-400" },
  "Confectionery":               { bg: "bg-pink-50 border-pink-200",      text: "text-pink-800",    dot: "bg-pink-400" },
  "Drinks":                      { bg: "bg-cyan-50 border-cyan-200",      text: "text-cyan-800",    dot: "bg-cyan-400" },
  "Coffee & Tea":                { bg: "bg-yellow-50 border-yellow-200",  text: "text-yellow-800",  dot: "bg-yellow-400" },
  "Beer & Brewing":              { bg: "bg-orange-50 border-orange-200",  text: "text-orange-800",  dot: "bg-orange-400" },
  "Wine & Spirits":              { bg: "bg-purple-50 border-purple-200",  text: "text-purple-800",  dot: "bg-purple-400" },
  "Bakery & Bread":              { bg: "bg-lime-50 border-lime-200",      text: "text-lime-800",    dot: "bg-lime-400" },
  "Dairy & Alternatives":        { bg: "bg-sky-50 border-sky-200",        text: "text-sky-800",     dot: "bg-sky-400" },
  "Casual Dining & Restaurants": { bg: "bg-rose-50 border-rose-200",      text: "text-rose-800",    dot: "bg-rose-400" },
  "Grocery & Food Brands":       { bg: "bg-green-50 border-green-200",    text: "text-green-800",   dot: "bg-green-400" },
  "Health & Wellness Food":      { bg: "bg-teal-50 border-teal-200",      text: "text-teal-800",    dot: "bg-teal-400" },
  "Baby & Kids Food":            { bg: "bg-indigo-50 border-indigo-200",  text: "text-indigo-800",  dot: "bg-indigo-400" },
  "Other":                       { bg: "bg-gray-50 border-gray-200",      text: "text-gray-600",    dot: "bg-gray-400" },
};

const FALLBACK_BADGE = { bg: "bg-gray-50 border-gray-200", text: "text-gray-600", dot: "bg-gray-400" };

function SubcategoryBadge({ subcategory }: { subcategory: string | null }) {
  if (!subcategory) return null;
  const c = SUBCATEGORY_COLOURS[subcategory] ?? FALLBACK_BADGE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {subcategory}
    </span>
  );
}

function AdBadge({ status }: { status: AdStatus | null | undefined }) {
  if (!status?.hasAds) return null;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-coral-50 border border-coral-200 text-coral-700 text-[11px] font-semibold rounded-full whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-coral-500 animate-pulse" />
      Ads running
    </span>
  );
}

function RequestContactModal({ onClose }: { onClose: () => void }) {
  const [brandName, setBrandName] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  const submit = async () => {
    if (!brandName.trim() || !brandUrl.trim()) return;
    setStatus("saving");
    const res = await fetch("/api/tickets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brand_name: brandName, brand_url: brandUrl, notes }),
    });
    setStatus(res.ok ? "done" : "error");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-navy-900">Request Brand Contact</h2>
          <button onClick={onClose} className="text-navy-300 hover:text-navy-600"><X size={18} /></button>
        </div>
        {status === "done" ? (
          <div className="text-center py-6">
            <p className="text-emerald-600 font-bold text-sm mb-1">Request submitted!</p>
            <p className="text-navy-400 text-xs mb-4">We&apos;ll add the contact details as soon as possible.</p>
            <button onClick={onClose} className="px-4 py-2 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600">Done</button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-bold text-navy-500 mb-1 block">Brand Name *</label>
                <input type="text" value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. Innocent Drinks" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-coral-300" />
              </div>
              <div>
                <label className="text-xs font-bold text-navy-500 mb-1 block">Brand Website *</label>
                <input type="url" value={brandUrl} onChange={e => setBrandUrl(e.target.value)} placeholder="https://innocentdrinks.co.uk" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-coral-300" />
              </div>
              <div>
                <label className="text-xs font-bold text-navy-500 mb-1 block">Notes (optional)</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Any context about the brand or who you&apos;re trying to reach…" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-coral-300 resize-none" />
              </div>
            </div>
            {status === "error" && <p className="text-red-500 text-xs mb-3">Something went wrong. Please try again.</p>}
            <div className="flex gap-2">
              <button onClick={submit} disabled={status === "saving" || !brandName.trim() || !brandUrl.trim()} className="flex-1 py-2.5 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600 disabled:opacity-50">
                {status === "saving" ? "Submitting…" : "Submit Request"}
              </button>
              <button onClick={onClose} className="px-4 py-2.5 bg-gray-100 text-navy-600 text-sm font-bold rounded-xl hover:bg-gray-200">Cancel</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [activeVertical, setActiveVertical] = useState<VerticalKey>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState("All");
  const [adStatuses] = useState<Record<string, AdStatus>>(() => getAllCachedStatuses());
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetch("/api/contacts")
      .then(r => r.json())
      .then(data => setContacts(Array.isArray(data) ? data : []))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  // Count contacts per vertical
  const verticalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of VERTICALS) counts[v.key] = 0;
    for (const c of contacts) {
      if (c.category && c.category in counts) counts[c.category]++;
    }
    return counts;
  }, [contacts]);

  // Subcategories for the active vertical
  const subcategoryOptions = useMemo(() => {
    if (!activeVertical) return [];
    const subs = new Set<string>();
    for (const c of contacts) {
      if (c.category === activeVertical && c.subcategory) subs.add(c.subcategory);
    }
    return Array.from(subs).sort();
  }, [contacts, activeVertical]);

  const countryOptions = useMemo(() => {
    const countries = new Set<string>();
    for (const c of contacts) if (c.country) countries.add(c.country);
    return Array.from(countries).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    let result = contacts;
    if (activeVertical) result = result.filter(c => c.category === activeVertical);
    if (activeSubcategory) result = result.filter(c => c.subcategory === activeSubcategory);
    if (activeCountry !== "All") result = result.filter(c => c.country === activeCountry);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(c =>
        c.name.toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q) ||
        (c.position ?? "").toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [contacts, activeVertical, activeSubcategory, activeCountry, query]);

  const PAGE_SIZE = 20;
  const isFiltering = !!(activeVertical || activeSubcategory || query.trim() || activeCountry !== "All");
  const visible = isFiltering ? filtered : filtered.slice(0, PAGE_SIZE);

  const activeVerticalDef = VERTICALS.find(v => v.key === activeVertical);

  const handleVerticalClick = (key: VerticalKey) => {
    if (activeVertical === key) {
      setActiveVertical(null);
      setActiveSubcategory(null);
    } else {
      setActiveVertical(key);
      setActiveSubcategory(null);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {showRequestModal && <RequestContactModal onClose={() => setShowRequestModal(false)} />}

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-3xl font-black text-navy-900 tracking-tight">Brand Contacts</h1>
          <p className="text-navy-400 text-sm mt-1">
            {loading ? "Loading…" : `${contacts.length.toLocaleString()} verified marketing contacts`}
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600 transition-colors shadow-sm"
        >
          <Plus size={14} /> Request Contact
        </button>
      </div>

      {/* Vertical selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {VERTICALS.map(v => {
          const isActive = activeVertical === v.key;
          const Icon = v.icon;
          const count = verticalCounts[v.key] ?? 0;
          return (
            <button
              key={v.key}
              onClick={() => handleVerticalClick(v.key)}
              className="relative flex flex-col items-start p-4 rounded-2xl border-2 transition-all text-left group"
              style={{
                borderColor: isActive ? v.accent : "#E5E7EB",
                background: isActive ? v.bg : "#FFFFFF",
              }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors"
                style={{ background: isActive ? v.accent : v.bg, border: `1.5px solid ${isActive ? v.accent : v.border}` }}
              >
                <Icon size={16} style={{ color: isActive ? "#fff" : v.accent }} />
              </div>
              <p className="text-sm font-black text-navy-900 leading-tight">{v.label}</p>
              <p className="text-xs text-navy-400 mt-0.5 leading-tight">{v.description}</p>
              <p
                className="mt-2 text-xs font-bold"
                style={{ color: count > 0 ? v.accent : "#9CA3AF" }}
              >
                {loading ? "—" : `${count.toLocaleString()} contacts`}
              </p>
              {isActive && (
                <span
                  className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-black"
                  style={{ background: v.accent }}
                >
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Subcategory pills — only shown when a vertical is active */}
      {activeVertical && subcategoryOptions.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          <button
            onClick={() => setActiveSubcategory(null)}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border"
            style={
              !activeSubcategory
                ? { background: activeVerticalDef?.accent, color: "#fff", borderColor: activeVerticalDef?.accent }
                : { background: "#fff", color: "#374151", borderColor: "#E5E7EB" }
            }
          >
            All {activeVerticalDef?.label}
          </button>
          {subcategoryOptions.map(sub => (
            <button
              key={sub}
              onClick={() => setActiveSubcategory(activeSubcategory === sub ? null : sub)}
              className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border"
              style={
                activeSubcategory === sub
                  ? { background: activeVerticalDef?.accent, color: "#fff", borderColor: activeVerticalDef?.accent }
                  : { background: "#fff", color: "#374151", borderColor: "#E5E7EB" }
              }
            >
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* Search + country */}
      <div className="flex gap-3 mb-5">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300" />
          <input
            type="text"
            placeholder="Search by name, company or position…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border border-cream-200 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent shadow-sm"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600">
              <X size={14} />
            </button>
          )}
        </div>
        {countryOptions.length > 1 && (
          <select
            value={activeCountry}
            onChange={e => setActiveCountry(e.target.value)}
            className="px-4 py-3 bg-white border border-cream-200 rounded-xl text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-coral-400 shadow-sm"
          >
            <option value="All">All countries</option>
            {countryOptions.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        )}
      </div>

      {/* Results count */}
      {isFiltering && !loading && (
        <p className="text-sm text-navy-400 mb-4">
          {filtered.length.toLocaleString()} result{filtered.length !== 1 ? "s" : ""}
          {activeVertical && !activeSubcategory && <> in <span className="font-semibold text-navy-700">{activeVerticalDef?.label}</span></>}
          {activeSubcategory && <> in <span className="font-semibold text-navy-700">{activeSubcategory}</span></>}
          {query.trim() && <> matching <span className="font-semibold text-navy-700">&ldquo;{query}&rdquo;</span></>}
        </p>
      )}

      {/* Table */}
      <div className="bg-white border border-cream-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="px-6 py-16 text-center text-sm text-navy-300">Loading contacts…</div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <p className="text-sm text-navy-300 mb-2">No contacts match your search.</p>
            {activeVertical && verticalCounts[activeVertical] === 0 && (
              <p className="text-xs text-navy-200">This category is coming soon — check back shortly.</p>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-cream-200 bg-cream-50/60">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-navy-400 uppercase tracking-widest">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-navy-400 uppercase tracking-widest">Company</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-navy-400 uppercase tracking-widest">Category</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {visible.map(l => (
                <tr key={l.id} className="hover:bg-cream-50 transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={l.name || l.email} email={l.email} size="sm" />
                      <div>
                        <Link
                          href={`/contacts/${encodeURIComponent(l.email)}`}
                          className="text-sm font-semibold text-navy-900 hover:text-coral-600 transition-colors"
                        >
                          {l.name || l.email}
                        </Link>
                        {l.position && <p className="text-xs text-navy-400">{l.position}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-navy-700">
                    {l.company || <span className="text-navy-200">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <SubcategoryBadge subcategory={l.subcategory} />
                      <AdBadge status={adStatuses[l.company?.toLowerCase() ?? ""]} />
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      {l.linkedin ? (
                        <a
                          href={l.linkedin.startsWith("http") ? l.linkedin : `https://${l.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-cream-200 hover:border-navy-300 text-navy-500 hover:text-navy-800 text-xs font-semibold rounded-lg transition-colors"
                        >
                          <Linkedin size={11} /> LinkedIn
                        </a>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-cream-100 text-navy-200 text-xs rounded-lg cursor-default">
                          <Linkedin size={11} /> LinkedIn
                        </span>
                      )}
                      <Link
                        href={`/send?to=${encodeURIComponent(l.email)}&name=${encodeURIComponent(l.name || "")}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold rounded-lg transition-colors"
                      >
                        <Send size={11} /> Email
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!isFiltering && filtered.length > PAGE_SIZE && (
        <p className="text-xs text-navy-400 text-center mt-4">
          Showing {PAGE_SIZE} of {filtered.length.toLocaleString()} contacts — pick a category or search to see more.
        </p>
      )}
      {isFiltering && filtered.length > 0 && (
        <p className="text-xs text-navy-300 text-center mt-4">
          {filtered.length.toLocaleString()} result{filtered.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
