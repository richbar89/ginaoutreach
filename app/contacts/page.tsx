"use client";

import { useState, useMemo } from "react";
import { Search, X } from "lucide-react";
import { leads } from "@/lib/leads-data";

export default function ContactsPage() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    if (!query.trim()) return leads;
    const q = query.toLowerCase();
    return leads.filter(
      (l) =>
        l.name.toLowerCase().includes(q) ||
        l.company.toLowerCase().includes(q) ||
        l.position.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q),
    );
  }, [query]);

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

      {/* Search */}
      <div className="relative mb-6">
        <Search
          size={15}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300"
        />
        <input
          type="text"
          placeholder="Search by name, company or position…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-white border border-cream-200 rounded-xl text-sm text-navy-900 placeholder:text-navy-300 focus:outline-none focus:ring-2 focus:ring-coral-400 focus:border-transparent shadow-sm shadow-cream-200"
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

      {/* Table */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm shadow-cream-200">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-100 bg-cream-50">
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase tracking-widest">
                Name
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase tracking-widest">
                Company
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase tracking-widest">
                Position
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase tracking-widest">
                LinkedIn
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold text-navy-400 uppercase tracking-widest">
                Email
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-50">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-6 py-12 text-center text-sm text-navy-300"
                >
                  No contacts match &ldquo;{query}&rdquo;
                </td>
              </tr>
            ) : (
              filtered.map((l, i) => (
                <tr key={i} className="hover:bg-cream-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-navy-900">
                    {l.name || <span className="text-navy-200">—</span>}
                  </td>
                  <td className="px-6 py-4 text-navy-600">
                    {l.company || <span className="text-navy-200">—</span>}
                  </td>
                  <td className="px-6 py-4 text-navy-400">
                    {l.position || <span className="text-navy-200">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    {l.linkedin ? (
                      <a
                        href={
                          l.linkedin.startsWith("http")
                            ? l.linkedin
                            : `https://${l.linkedin}`
                        }
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
                      <a
                        href={`mailto:${l.email}`}
                        className="inline-flex items-center px-3 py-1.5 bg-coral-500 hover:bg-coral-600 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Email
                      </a>
                    ) : (
                      <span className="text-navy-200">—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
