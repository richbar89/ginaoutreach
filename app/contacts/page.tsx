"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Search, X, Plus } from "lucide-react";
import { getAllCachedStatuses } from "@/lib/metaAds";
import type { BrandCategory } from "@/lib/types";
import type { AdStatus } from "@/lib/metaAds";

type ContactRow = {
  id: string;
  name: string;
  email: string;
  position: string | null;
  company: string | null;
  linkedin: string | null;
  industry: string | null;
  category: string | null;
};

const CATEGORIES: BrandCategory[] = [
  "Snacks & Crisps",
  "Confectionery",
  "Drinks",
  "Coffee & Tea",
  "Beer & Brewing",
  "Wine & Spirits",
  "Bakery & Bread",
  "Dairy & Alternatives",
  "Casual Dining & Restaurants",
  "Grocery & Food Brands",
  "Health & Wellness Food",
  "Baby & Kids Food",
  "Other",
];

const CATEGORY_COLOURS: Record<BrandCategory, { bg: string; text: string }> = {
  "Snacks & Crisps":             { bg: "bg-amber-100",   text: "text-amber-800" },
  "Confectionery":               { bg: "bg-pink-100",    text: "text-pink-800" },
  "Drinks":                      { bg: "bg-cyan-100",    text: "text-cyan-800" },
  "Coffee & Tea":                { bg: "bg-yellow-100",  text: "text-yellow-800" },
  "Beer & Brewing":              { bg: "bg-orange-100",  text: "text-orange-800" },
  "Wine & Spirits":              { bg: "bg-purple-100",  text: "text-purple-800" },
  "Bakery & Bread":              { bg: "bg-lime-100",    text: "text-lime-800" },
  "Dairy & Alternatives":        { bg: "bg-sky-100",     text: "text-sky-800" },
  "Casual Dining & Restaurants": { bg: "bg-rose-100",    text: "text-rose-800" },
  "Grocery & Food Brands":       { bg: "bg-green-100",   text: "text-green-800" },
  "Health & Wellness Food":      { bg: "bg-teal-100",    text: "text-teal-800" },
  "Baby & Kids Food":            { bg: "bg-indigo-100",  text: "text-indigo-800" },
  "Other":                       { bg: "bg-gray-100",    text: "text-gray-600" },
};

function AdBadge({ status }: { status: AdStatus | null | undefined }) {
  if (!status) return <span className="text-navy-200 text-xs">—</span>;
  if (status.hasAds) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-coral-100 text-coral-700 text-xs font-medium rounded-full whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-coral-500 animate-pulse inline-block" />
        Running ads
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-gray-400 inline-block" />
      No ads
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
            <p className="text-navy-400 text-xs mb-4">We'll add the contact details as soon as possible.</p>
            <button onClick={onClose} className="px-4 py-2 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600">Done</button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs font-bold text-navy-500 mb-1 block">Brand Name *</label>
                <input
                  type="text"
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="e.g. Innocent Drinks"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-coral-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-navy-500 mb-1 block">Brand Website *</label>
                <input
                  type="url"
                  value={brandUrl}
                  onChange={e => setBrandUrl(e.target.value)}
                  placeholder="https://innocentdrinks.co.uk"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-coral-300"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-navy-500 mb-1 block">Notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any context about the brand or who you're trying to reach…"
                  className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 outline-none focus:border-coral-300 resize-none"
                />
              </div>
            </div>
            {status === "error" && <p className="text-red-500 text-xs mb-3">Something went wrong. Please try again.</p>}
            <div className="flex gap-2">
              <button
                onClick={submit}
                disabled={status === "saving" || !brandName.trim() || !brandUrl.trim()}
                className="flex-1 py-2.5 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600 disabled:opacity-50"
              >
                {status === "saving" ? "Submitting…" : "Submit Request"}
              </button>
              <button onClick={onClose} className="px-4 py-2.5 bg-gray-100 text-navy-600 text-sm font-bold rounded-xl hover:bg-gray-200">
                Cancel
              </button>
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
  const [categoryFilter, setCategoryFilter] = useState<BrandCategory | "All">("All");
  const [adStatuses] = useState<Record<string, AdStatus>>(() => getAllCachedStatuses());
  const [showRequestModal, setShowRequestModal] = useState(false);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => setContacts(Array.isArray(data) ? data : []))
      .catch(() => setContacts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = contacts;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          (l.company ?? "").toLowerCase().includes(q) ||
          (l.position ?? "").toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== "All") {
      result = result.filter((l) => l.category === categoryFilter);
    }
    return result;
  }, [contacts, query, categoryFilter]);

  return (
    <div className="p-10 max-w-6xl mx-auto">
      {showRequestModal && <RequestContactModal onClose={() => setShowRequestModal(false)} />}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl font-bold text-navy-900 tracking-tight">
            Contacts
          </h1>
          <p className="text-navy-500 text-base mt-2">
            {loading ? "Loading…" : `${filtered.length} of ${contacts.length} contact${contacts.length !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600 transition-colors shadow-sm"
        >
          <Plus size={14} /> Request Contact
        </button>
      </div>

      {/* Search + filter row */}
      <div className="flex gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300" />
          <input
            type="text"
            placeholder="Search by name, company or position…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-10 py-3 bg-white border border-cream-200 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent shadow-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-300 hover:text-navy-600 transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as BrandCategory | "All")}
          className="px-4 py-3 bg-white border border-cream-200 rounded-xl text-sm text-navy-900 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent shadow-sm"
        >
          <option value="All">All categories</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-cream-200 rounded-2xl shadow-sm overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-cream-200">
            <tr>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase tracking-widest">Name</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase tracking-widest">Company</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase tracking-widest">Position</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase tracking-widest">Meta Ads</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase tracking-widest">LinkedIn</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase tracking-widest">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-50">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-navy-300">
                  Loading contacts…
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-navy-300">
                  No contacts match your search.
                </td>
              </tr>
            ) : (
              filtered.map((l) => {
                const colours = l.category ? CATEGORY_COLOURS[l.category as BrandCategory] : null;
                return (
                  <tr key={l.id} className="hover:bg-cream-50 transition-colors group">
                    <td className="px-6 py-4 font-medium text-navy-900">
                      {l.email ? (
                        <Link
                          href={`/contacts/${encodeURIComponent(l.email)}`}
                          className="hover:text-coral-600 transition-colors"
                        >
                          {l.name || <span className="text-navy-200">—</span>}
                        </Link>
                      ) : (
                        l.name || <span className="text-navy-200">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-navy-700">{l.company || <span className="text-navy-200">—</span>}</span>
                        {colours && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colours.bg} ${colours.text} whitespace-nowrap`}>
                            {l.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-navy-400">
                      {l.position || <span className="text-navy-200">—</span>}
                    </td>
                    <td className="px-6 py-4">
                      <AdBadge status={l.company ? adStatuses[l.company] : undefined} />
                    </td>
                    <td className="px-6 py-4">
                      {l.linkedin ? (
                        <a
                          href={l.linkedin.startsWith("http") ? l.linkedin : `https://${l.linkedin}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-coral-500 hover:text-coral-700 hover:underline text-sm font-medium"
                        >
                          View Profile
                        </a>
                      ) : (
                        <span className="text-navy-200">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {l.email ? (
                        <Link
                          href={`/send?to=${encodeURIComponent(l.email)}&name=${encodeURIComponent(l.name || "")}`}
                          className="inline-flex items-center px-3 py-1.5 bg-coral-500 hover:bg-coral-600 text-white text-xs font-medium rounded-lg transition-colors"
                        >
                          Email
                        </Link>
                      ) : (
                        <span className="text-navy-200">—</span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
