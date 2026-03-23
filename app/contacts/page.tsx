"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import { leads } from "@/lib/leads-data";
import type { BrandCategory } from "@/lib/types";

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

export default function ContactsPage() {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<BrandCategory | "All">("All");

  const filtered = useMemo(() => {
    let result = leads;
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.company.toLowerCase().includes(q) ||
          l.position.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q),
      );
    }
    if (categoryFilter !== "All") {
      result = result.filter((l) => l.category === categoryFilter);
    }
    return result;
  }, [query, categoryFilter]);

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-serif text-4xl font-bold text-navy-900 tracking-tight">
            Contacts
          </h1>
          <p className="text-navy-500 text-base mt-2">
            {filtered.length} of {leads.length} contact
            {leads.length !== 1 ? "s" : ""}
          </p>
        </div>
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
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase tracking-widest">LinkedIn</th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase tracking-widest">Email</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-50">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-navy-300">
                  No contacts match your search.
                </td>
              </tr>
            ) : (
              filtered.map((l, i) => {
                const colours = l.category ? CATEGORY_COLOURS[l.category as BrandCategory] : null;
                return (
                  <tr key={i} className="hover:bg-cream-50 transition-colors group">
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
