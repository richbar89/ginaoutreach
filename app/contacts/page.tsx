"use client";

import { useState, useMemo, useEffect, useRef, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, X, Plus, Linkedin, Send, UtensilsCrossed, Sun, Sparkles, Dumbbell, BookmarkPlus, List, Trash2, Check } from "lucide-react";
import { getAllCachedStatuses } from "@/lib/metaAds";
import type { AdStatus } from "@/lib/metaAds";
import InitialsAvatar from "@/components/InitialsAvatar";

type ContactList = {
  id: string;
  name: string;
  vertical: string | null;
  subcategory: string | null;
  country: string | null;
  query: string | null;
  created_at: string;
};

type ContactRow = {
  id: string;
  name: string;
  email: string;
  position: string | null;
  company: string | null;
  linkedin: string | null;
  category: string | null;
  subcategory: string | null;
  subcategories: string[] | null;
  categories: string[] | null;
  country: string | null;
};

// ── Category normalisation ───────────────────────────────────────────────────

// Specific granular subcategory values (set by admin or auto-detected on import)
const FOOD_SUBCATS = new Set([
  "Snacks & Crisps", "Confectionery", "Drinks", "Coffee & Tea",
  "Beer & Brewing", "Wine & Spirits", "Bakery & Bread",
  "Dairy & Alternatives", "Casual Dining & Restaurants",
  "Grocery & Food Brands", "Health & Wellness Food", "Baby & Kids Food", "Other",
]);

// Broad values that signal "Food & Drink" vertical (Apollo industries etc.)
function isFoodVertical(cat: string | null): boolean {
  if (!cat) return false;
  if (FOOD_SUBCATS.has(cat)) return true;
  const l = cat.toLowerCase();
  return l.includes("food") || l.includes("drink") || l.includes("beverage")
    || l.includes("restaurant") || l.includes("bakery") || l.includes("dairy")
    || l.includes("snack") || l.includes("coffee") || l.includes("tea")
    || l.includes("beer") || l.includes("wine") || l.includes("brew")
    || l.includes("confection") || l.includes("grocery");
}

// Which top-level vertical a contact belongs to
function effectiveCategory(c: ContactRow): string | null {
  if (!c.category) return null;
  if (isFoodVertical(c.category)) return "Food & Drink";
  return c.category; // Lifestyle, Beauty, Fitness pass through directly
}

// All subcategories for a contact (new multi-value or legacy single)
function allSubcategories(c: ContactRow): string[] {
  if (c.subcategories && c.subcategories.length > 0) return c.subcategories;
  if (c.subcategory) return [c.subcategory];
  if (c.category && FOOD_SUBCATS.has(c.category)) return [c.category];
  return [];
}

// Primary subcategory for display
function effectiveSubcategory(c: ContactRow): string | null {
  const subs = allSubcategories(c);
  return subs[0] ?? null;
}

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
    subcategories: [
      "Snacks & Crisps", "Confectionery", "Drinks", "Coffee & Tea",
      "Beer & Brewing", "Wine & Spirits", "Bakery & Bread",
      "Dairy & Alternatives", "Casual Dining & Restaurants",
      "Grocery & Food Brands", "Health & Wellness Food",
      "Baby & Kids Food", "Other",
    ],
  },
  {
    key: "Lifestyle",
    label: "Lifestyle",
    icon: Sun,
    description: "Home, fashion & living",
    accent: "#7C3AED",
    bg: "#F5F0FF",
    border: "#DDD6FE",
    subcategories: [
      "Fashion & Clothing", "Home & Interiors", "Travel", "Pets",
      "Sustainability", "Media & Publishing", "Gifting & Occasions",
    ],
  },
  {
    key: "Beauty",
    label: "Beauty",
    icon: Sparkles,
    description: "Skincare, makeup & wellness",
    accent: "#DB2777",
    bg: "#FFF0F7",
    border: "#FBCFE8",
    subcategories: [
      "Skincare", "Makeup & Cosmetics", "Haircare",
      "Fragrance", "Nails", "Wellness & Supplements",
    ],
  },
  {
    key: "Fitness",
    label: "Fitness",
    icon: Dumbbell,
    description: "Sports, health & active",
    accent: "#059669",
    bg: "#EFFFFA",
    border: "#A7F3D0",
    subcategories: [
      "Activewear & Apparel", "Supplements & Nutrition", "Equipment & Gear",
      "Running & Cycling", "Gyms & Studios", "Sports Brands",
    ],
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

function ContactsPage() {
  const searchParams = useSearchParams();
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [activeVertical, setActiveVertical] = useState<VerticalKey>(null);
  const [activeSubcategory, setActiveSubcategory] = useState<string | null>(null);
  const [activeCountry, setActiveCountry] = useState("All");
  const [adStatuses, setAdStatuses] = useState<Record<string, AdStatus>>({});

  useEffect(() => {
    getAllCachedStatuses().then(setAdStatuses);
  }, []);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [page, setPage] = useState(1);

  // Saved lists
  const [lists, setLists] = useState<ContactList[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showListsDropdown, setShowListsDropdown] = useState(false);
  const [listName, setListName] = useState("");
  const [savingList, setSavingList] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const listsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/lists").then(r => r.json()).then(data => {
      if (Array.isArray(data)) setLists(data);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (listsRef.current && !listsRef.current.contains(e.target as Node)) {
        setShowListsDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const saveList = async () => {
    if (!listName.trim()) return;
    setSavingList(true);
    const res = await fetch("/api/lists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: listName,
        vertical: activeVertical,
        subcategory: activeSubcategory,
        country: activeCountry,
        query,
      }),
    });
    if (res.ok) {
      const newList = await res.json();
      setLists(prev => [newList, ...prev]);
      setSaveSuccess(true);
      setTimeout(() => {
        setShowSaveModal(false);
        setSaveSuccess(false);
        setListName("");
      }, 1200);
    }
    setSavingList(false);
  };

  const deleteList = async (id: string) => {
    await fetch(`/api/lists/${id}`, { method: "DELETE" });
    setLists(prev => prev.filter(l => l.id !== id));
  };

  useEffect(() => {
    fetch("/api/contacts")
      .then(r => r.json())
      .then(data => setContacts(Array.isArray(data) ? data : []))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  // Count contacts per vertical (handles pre-migration data)
  const verticalCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const v of VERTICALS) counts[v.key] = 0;
    for (const c of contacts) {
      const cat = effectiveCategory(c);
      if (cat && cat in counts) counts[cat]++;
    }
    return counts;
  }, [contacts]);

  // Subcategory options: always the hardcoded list for the active vertical
  const subcategoryOptions = useMemo(() => {
    if (!activeVertical) return [];
    const vertDef = VERTICALS.find(v => v.key === activeVertical);
    return vertDef ? [...vertDef.subcategories] : [];
  }, [activeVertical]);

  // Count contacts per subcategory for badge display
  const subcategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of contacts) {
      if (effectiveCategory(c) === activeVertical) {
        for (const sub of allSubcategories(c)) {
          counts[sub] = (counts[sub] ?? 0) + 1;
        }
      }
    }
    return counts;
  }, [contacts, activeVertical]);

  const countryOptions = useMemo(() => {
    const countries = new Set<string>();
    for (const c of contacts) if (c.country) countries.add(c.country);
    return Array.from(countries).sort();
  }, [contacts]);

  const filtered = useMemo(() => {
    let result = contacts;
    if (activeVertical) result = result.filter(c => effectiveCategory(c) === activeVertical);
    if (activeSubcategory) {
      result = result.filter(c => allSubcategories(c).includes(activeSubcategory));
    }
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

  const PAGE_SIZE = 25;
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const isFiltering = !!(activeVertical || activeSubcategory || query.trim() || activeCountry !== "All");

  const activeVerticalDef = VERTICALS.find(v => v.key === activeVertical);

  const handleVerticalClick = (key: VerticalKey) => {
    if (activeVertical === key) {
      setActiveVertical(null);
      setActiveSubcategory(null);
    } else {
      setActiveVertical(key);
      setActiveSubcategory(null);
    }
    setPage(1);
  };

  const handleSubcategoryClick = (sub: string) => {
    setActiveSubcategory(activeSubcategory === sub ? null : sub);
    setPage(1);
  };

  const handleQueryChange = (val: string) => {
    setQuery(val);
    setPage(1);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {showRequestModal && <RequestContactModal onClose={() => setShowRequestModal(false)} />}

      {/* Save list modal */}
      {showSaveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            {saveSuccess ? (
              <div className="text-center py-4">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-3">
                  <Check size={18} className="text-emerald-600" />
                </div>
                <p className="font-bold text-navy-900">List saved!</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-black text-navy-900">Save as list</h2>
                  <button onClick={() => setShowSaveModal(false)} className="text-navy-300 hover:text-navy-600"><X size={16} /></button>
                </div>
                <p className="text-xs text-navy-400 mb-4">
                  Saves your current filters
                  {activeVertical ? ` (${activeVertical}${activeSubcategory ? ` › ${activeSubcategory}` : ""}${activeCountry !== "All" ? ` · ${activeCountry}` : ""}${query.trim() ? ` · "${query}"` : ""})` : ""}
                  {" "}as a named list you can use when creating campaigns.
                </p>
                <input
                  autoFocus
                  type="text"
                  value={listName}
                  onChange={e => setListName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && saveList()}
                  placeholder="e.g. UK Drinks Brands"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-coral-300 mb-4"
                />
                <div className="flex gap-2">
                  <button
                    onClick={saveList}
                    disabled={savingList || !listName.trim()}
                    className="flex-1 py-2.5 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600 disabled:opacity-50"
                  >
                    {savingList ? "Saving…" : "Save list"}
                  </button>
                  <button onClick={() => setShowSaveModal(false)} className="px-4 py-2.5 bg-gray-100 text-navy-600 text-sm font-bold rounded-xl hover:bg-gray-200">
                    Cancel
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between mb-7">
        <div>
          <h1 className="text-3xl font-black text-navy-900 tracking-tight">Brand Contacts</h1>
          <p className="text-navy-400 text-sm mt-1">
            {loading ? "Loading…" : `${contacts.length.toLocaleString()} verified marketing contacts`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* My Lists dropdown */}
          <div className="relative" ref={listsRef}>
            <button
              onClick={() => setShowListsDropdown(v => !v)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-cream-200 text-navy-700 text-sm font-bold rounded-xl hover:border-navy-300 transition-colors shadow-sm"
            >
              <List size={14} />
              My Lists
              {lists.length > 0 && (
                <span className="w-5 h-5 rounded-full bg-coral-500 text-white text-[10px] font-black flex items-center justify-center">
                  {lists.length}
                </span>
              )}
            </button>
            {showListsDropdown && (
              <div className="absolute right-0 top-full mt-2 z-30 bg-white border border-cream-200 rounded-2xl shadow-xl w-72 overflow-hidden">
                <p className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-navy-400 border-b border-cream-100">
                  Saved Lists
                </p>
                {lists.length === 0 ? (
                  <p className="px-4 py-5 text-xs text-navy-400 text-center">No lists saved yet. Filter the contacts and click &ldquo;Save as list&rdquo;.</p>
                ) : (
                  <div className="max-h-72 overflow-y-auto divide-y divide-cream-50">
                    {lists.map(l => (
                      <div key={l.id} className="flex items-center gap-3 px-4 py-3 hover:bg-cream-50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy-900 truncate">{l.name}</p>
                          <p className="text-[11px] text-navy-400 truncate mt-0.5">
                            {[l.vertical, l.subcategory, l.country, l.query ? `"${l.query}"` : null].filter(Boolean).join(" · ") || "All contacts"}
                          </p>
                        </div>
                        <Link
                          href={`/campaigns/new?listId=${l.id}`}
                          className="text-[11px] font-bold text-coral-600 hover:text-coral-700 whitespace-nowrap"
                          onClick={() => setShowListsDropdown(false)}
                        >
                          Use →
                        </Link>
                        <button
                          onClick={() => deleteList(l.id)}
                          className="text-navy-300 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600 transition-colors shadow-sm"
          >
            <Plus size={14} /> Request Contact
          </button>
        </div>
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

      {/* Subcategory pills — shown whenever a vertical is active */}
      {activeVertical && (
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
            {!activeSubcategory && verticalCounts[activeVertical] > 0 && (
              <span className="ml-1.5 opacity-80">{verticalCounts[activeVertical]}</span>
            )}
          </button>
          {subcategoryOptions.map(sub => {
            const count = subcategoryCounts[sub] ?? 0;
            const isActive = activeSubcategory === sub;
            return (
              <button
                key={sub}
                onClick={() => handleSubcategoryClick(sub)}
                className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors border"
                style={
                  isActive
                    ? { background: activeVerticalDef?.accent, color: "#fff", borderColor: activeVerticalDef?.accent }
                    : count > 0
                      ? { background: "#fff", color: "#374151", borderColor: "#E5E7EB" }
                      : { background: "#F9FAFB", color: "#9CA3AF", borderColor: "#E5E7EB" }
                }
              >
                {sub}
                {count > 0 && (
                  <span className="ml-1.5 opacity-70">{count}</span>
                )}
              </button>
            );
          })}
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
            onChange={e => handleQueryChange(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border border-cream-200 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent shadow-sm"
          />
          {query && (
            <button onClick={() => handleQueryChange("")} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600">
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

      {/* Results count + Save as list */}
      {isFiltering && !loading && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-navy-400">
            {filtered.length.toLocaleString()} result{filtered.length !== 1 ? "s" : ""}
            {activeVertical && !activeSubcategory && <> in <span className="font-semibold text-navy-700">{activeVerticalDef?.label}</span></>}
            {activeSubcategory && <> in <span className="font-semibold text-navy-700">{activeSubcategory}</span></>}
            {query.trim() && <> matching <span className="font-semibold text-navy-700">&ldquo;{query}&rdquo;</span></>}
          </p>
          <button
            onClick={() => { setListName(""); setShowSaveModal(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-coral-600 border border-coral-200 rounded-lg hover:bg-coral-50 transition-colors"
          >
            <BookmarkPlus size={13} /> Save as list
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-cream-200 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <table className="w-full text-sm">
            <thead className="border-b border-cream-200 bg-cream-50/60">
              <tr>
                <th className="text-left px-5 py-3 text-xs font-semibold text-navy-400 uppercase tracking-widest">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-navy-400 uppercase tracking-widest">Company</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-navy-400 uppercase tracking-widest">Category</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100 animate-pulse">
              {Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-cream-200 flex-shrink-0" />
                      <div className="space-y-1.5">
                        <div className="h-3 bg-cream-200 rounded w-28" />
                        <div className="h-2.5 bg-cream-100 rounded w-20" />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5"><div className="h-3 bg-cream-200 rounded w-24" /></td>
                  <td className="px-5 py-3.5"><div className="h-5 bg-cream-100 rounded-full w-20" /></td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2 justify-end">
                      <div className="h-6 bg-cream-100 rounded-lg w-16" />
                      <div className="h-6 bg-cream-200 rounded-lg w-14" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-16 text-center">
            {activeSubcategory ? (
              <>
                <p className="text-sm font-semibold text-navy-500 mb-1">No contacts tagged as &ldquo;{activeSubcategory}&rdquo; yet.</p>
                <p className="text-xs text-navy-300 mb-3">Subcategory tagging is added on import — all {activeVerticalDef?.label} contacts are available above.</p>
                <button onClick={() => setActiveSubcategory(null)} className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-cream-200 text-navy-500 hover:border-coral-300 transition-colors">
                  Show all {activeVerticalDef?.label} →
                </button>
              </>
            ) : activeVertical && verticalCounts[activeVertical] === 0 ? (
              <p className="text-sm text-navy-300">This category is coming soon — check back shortly.</p>
            ) : contacts.length === 0 && !isFiltering ? (
              <>
                <p className="text-sm font-semibold text-navy-500 mb-1">Contact database is being populated</p>
                <p className="text-xs text-navy-300">Brand contacts will appear here shortly. Check back soon.</p>
              </>
            ) : (
              <p className="text-sm text-navy-300">No contacts match your search.</p>
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
                      {allSubcategories(l).slice(0, 3).map(sub => (
                        <SubcategoryBadge key={sub} subcategory={sub} />
                      ))}
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

      {/* Pagination */}
      {filtered.length > PAGE_SIZE && (
        <div className="flex items-center justify-between mt-5 px-1">
          <p className="text-xs text-navy-400">
            {((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length.toLocaleString()} contacts
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-cream-200 bg-white text-navy-600 hover:border-coral-300 disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              ← Prev
            </button>
            <span className="text-xs text-navy-400 font-medium tabular-nums">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-cream-200 bg-white text-navy-600 hover:border-coral-300 disabled:opacity-30 disabled:cursor-default transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ContactsPageWrapper() {
  return (
    <Suspense>
      <ContactsPage />
    </Suspense>
  );
}
