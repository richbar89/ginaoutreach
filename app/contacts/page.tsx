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
    <div className="p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Contacts
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            {filtered.length} of {leads.length} contact
            {leads.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search
          size={15}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          type="text"
          placeholder="Search by name, company or position…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/70">
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Name
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Company Name
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Position
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                LinkedIn
              </th>
              <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">
                Email
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-5 py-10 text-center text-sm text-slate-400"
                >
                  No contacts match &ldquo;{query}&rdquo;
                </td>
              </tr>
            ) : (
              filtered.map((l, i) => (
                <tr key={i} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-900">
                    {l.name || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">
                    {l.company || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500">
                    {l.position || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {l.linkedin ? (
                      <a
                        href={
                          l.linkedin.startsWith("http")
                            ? l.linkedin
                            : `https://${l.linkedin}`
                        }
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800 hover:underline text-sm"
                      >
                        View Profile
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    {l.email ? (
                      <a
                        href={`mailto:${l.email}`}
                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                      >
                        Email
                      </a>
                    ) : (
                      <span className="text-slate-300">—</span>
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
