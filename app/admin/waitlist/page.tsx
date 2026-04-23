"use client";

import { useState, useEffect } from "react";
import { Loader2, Download, Trash2 } from "lucide-react";

const NICHE_LABELS: Record<string, string> = {
  food: "Food & Drink",
  lifestyle: "Lifestyle",
  beauty: "Beauty & Skincare",
  fitness: "Fitness & Wellness",
  fashion: "Fashion",
  parenting: "Parenting & Family",
  tech: "Tech & Gaming",
  travel: "Travel",
  finance: "Finance & Business",
  other: "Other",
};

const NICHE_COLOURS: Record<string, { bg: string; text: string }> = {
  food:      { bg: "bg-orange-50",  text: "text-orange-600" },
  lifestyle: { bg: "bg-purple-50",  text: "text-purple-600" },
  beauty:    { bg: "bg-pink-50",    text: "text-pink-600" },
  fitness:   { bg: "bg-emerald-50", text: "text-emerald-600" },
  fashion:   { bg: "bg-rose-50",    text: "text-rose-600" },
  parenting: { bg: "bg-yellow-50",  text: "text-yellow-700" },
  tech:      { bg: "bg-blue-50",    text: "text-blue-600" },
  travel:    { bg: "bg-teal-50",    text: "text-teal-600" },
  finance:   { bg: "bg-slate-100",  text: "text-slate-600" },
  other:     { bg: "bg-navy-100",   text: "text-navy-500" },
};

type Entry = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  niche: string;
  created_at: string;
};

export default function WaitlistAdminPage() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterNiche, setFilterNiche] = useState("");
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch("/api/admin/waitlist", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setEntries(prev => prev.filter(e => e.id !== id));
    setDeleting(null);
  }

  useEffect(() => {
    fetch("/api/admin/waitlist")
      .then(r => r.json())
      .then(data => setEntries(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || `${e.first_name} ${e.last_name} ${e.email}`.toLowerCase().includes(q);
    const matchNiche = !filterNiche || e.niche === filterNiche;
    return matchSearch && matchNiche;
  });

  function downloadCSV() {
    const rows = [
      ["First Name", "Last Name", "Email", "Niche", "Signed Up"],
      ...filtered.map(e => [
        e.first_name,
        e.last_name,
        e.email,
        NICHE_LABELS[e.niche] || e.niche,
        new Date(e.created_at).toLocaleDateString("en-GB"),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `collabi-waitlist-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const nicheCounts = entries.reduce<Record<string, number>>((acc, e) => {
    acc[e.niche] = (acc[e.niche] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="h-full flex flex-col overflow-y-auto p-8" style={{ background: "#F7F8FA" }}>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-navy-400 mb-1">Admin</p>
          <h1 className="text-3xl font-black tracking-tight text-navy-900">Waitlist</h1>
          <p className="text-sm text-navy-400 mt-1">{entries.length} sign-up{entries.length !== 1 ? "s" : ""} total</p>
        </div>
        <button
          onClick={downloadCSV}
          disabled={filtered.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 hover:bg-coral-600 disabled:opacity-40 text-white text-sm font-bold rounded-xl transition-colors"
        >
          <Download size={14} />
          Export CSV
        </button>
      </div>

      {/* Niche breakdown */}
      {!loading && entries.length > 0 && (
        <div className="grid grid-cols-5 gap-3 mb-6">
          {Object.entries(nicheCounts).sort((a, b) => b[1] - a[1]).map(([niche, count]) => {
            const c = NICHE_COLOURS[niche] || { bg: "bg-navy-50", text: "text-navy-600" };
            return (
              <button
                key={niche}
                onClick={() => setFilterNiche(f => f === niche ? "" : niche)}
                className={`rounded-2xl border p-4 text-left transition-all ${c.bg} ${filterNiche === niche ? "ring-2 ring-coral-400 border-coral-200" : "border-transparent"}`}
              >
                <p className={`text-2xl font-black ${c.text}`}>{count}</p>
                <p className="text-xs font-semibold text-navy-500 mt-0.5">{NICHE_LABELS[niche] || niche}</p>
              </button>
            );
          })}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-base flex-1 max-w-sm"
        />
        {filterNiche && (
          <button
            onClick={() => setFilterNiche("")}
            className="px-3 py-2 text-xs font-bold text-coral-600 bg-coral-50 border border-coral-200 rounded-xl hover:bg-coral-100 transition-colors"
          >
            Clear filter ×
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border rounded-2xl overflow-hidden" style={{ borderColor: "var(--border)" }}>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-navy-400">
            <Loader2 size={16} className="animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-navy-400 text-sm">
            {entries.length === 0 ? "No sign-ups yet." : "No results match your search."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                {["Name", "Email", "Niche", "Signed Up", ""].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[11px] font-bold uppercase tracking-widest text-navy-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((e, i) => {
                const c = NICHE_COLOURS[e.niche] || { bg: "bg-navy-50", text: "text-navy-600" };
                return (
                  <tr key={e.id} className={`border-b transition-colors hover:bg-cream-100 ${i === filtered.length - 1 ? "border-transparent" : ""}`} style={{ borderColor: "var(--border)" }}>
                    <td className="px-5 py-3.5 font-semibold text-navy-900">
                      {e.first_name} {e.last_name}
                    </td>
                    <td className="px-5 py-3.5 text-navy-500">{e.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
                        {NICHE_LABELS[e.niche] || e.niche}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-navy-400">
                      {new Date(e.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3.5">
                      <button
                        onClick={() => handleDelete(e.id)}
                        disabled={deleting === e.id}
                        className="p-1.5 rounded-lg text-navy-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-40"
                      >
                        {deleting === e.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
