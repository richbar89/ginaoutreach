"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, RefreshCw, TrendingUp, Building2, Loader2 } from "lucide-react";
import { getAllCachedStatuses, checkCompanyAds } from "@/lib/metaAds";
import type { AdStatus } from "@/lib/metaAds";

type ContactRow = { email: string; company: string | null; category: string | null };

function buildCompanyList(contacts: ContactRow[]) {
  return Object.values(
    contacts.reduce<Record<string, { company: string; category: string; email: string }>>((acc, l) => {
      if (l.company && !acc[l.company]) {
        acc[l.company] = { company: l.company, category: l.category || "Other", email: l.email };
      }
      return acc;
    }, {})
  );
}

function formatChecked(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type Filter = "all" | "running" | "none" | "unchecked";

export default function AdsPage() {
  const [allCompanies, setAllCompanies] = useState<{ company: string; category: string; email: string }[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AdStatus>>({});
  const [loading, setLoading] = useState(true);
  const [rechecking, setRechecking] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const refreshStatuses = useCallback(async () => {
    setStatuses(await getAllCachedStatuses());
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/contacts").then((r) => r.json()).catch(() => []),
      getAllCachedStatuses(),
    ]).then(([contacts, statuses]) => {
      setAllCompanies(buildCompanyList(Array.isArray(contacts) ? contacts : []));
      setStatuses(statuses);
      setLoading(false);
    });
  }, []);

  const recheck = async (company: string) => {
    setRechecking(company);
    try {
      await checkCompanyAds(company);
      await refreshStatuses();
    } catch {
      // ignore
    } finally {
      setRechecking(null);
    }
  };

  const checked = allCompanies.filter((c) => statuses[c.company]);
  const running = checked.filter((c) => statuses[c.company]?.hasAds);
  const unchecked = allCompanies.filter((c) => !statuses[c.company]);

  const lastScan = Object.values(statuses).sort(
    (a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
  )[0];

  const filtered = allCompanies.filter((c) => {
    const s = statuses[c.company];
    if (filter === "running") return s?.hasAds;
    if (filter === "none") return s && !s.hasAds;
    if (filter === "unchecked") return !s;
    return true;
  });

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-10 bg-coral-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">
            Intelligence
          </span>
        </div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-bold text-navy-900 leading-tight">
              Meta Ad Alerts
            </h1>
            <p className="mt-2 text-navy-500 text-base">
              {allCompanies.length} companies tracked ·{" "}
              {loading
                ? "Loading…"
                : lastScan
                ? `Last scan ${formatChecked(lastScan.checkedAt)}`
                : "Not yet scanned"}
            </p>
          </div>
          <div className="text-right flex-shrink-0 mt-1">
            <p className="text-xs text-navy-400">Scans run automatically every 48h.</p>
            <p className="text-xs text-navy-300 mt-0.5">
              Use the individual refresh icon to recheck a company now.
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          { label: "Companies",     value: allCompanies.length, sub: "in your list",         f: "all"       as Filter },
          { label: "Running Ads",   value: running.length,      sub: "on Meta right now",    f: "running"   as Filter, highlight: running.length > 0 },
          { label: "No Active Ads", value: checked.length - running.length, sub: "checked, none found", f: "none" as Filter },
          { label: "Not Checked",   value: unchecked.length,    sub: "awaiting next scan",   f: "unchecked" as Filter },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(s.f)}
            className={`text-left bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${
              filter === s.f
                ? "border-coral-300 ring-1 ring-coral-200"
                : "border-cream-200 hover:border-cream-300"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400 mb-2">{s.label}</p>
            <p className={`font-serif text-3xl font-bold leading-none mb-1 ${s.highlight ? "text-coral-500" : "text-navy-900"}`}>
              {loading ? "—" : s.value}
            </p>
            <p className="text-xs text-navy-400">{s.sub}</p>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 p-0.5 bg-cream-100 rounded-xl mb-5 w-fit">
        {(["all", "running", "none", "unchecked"] as Filter[]).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 text-xs font-semibold rounded-lg transition-all capitalize ${
              filter === f ? "bg-white text-navy-800 shadow-sm" : "text-navy-400 hover:text-navy-600"
            }`}
          >
            {f === "none" ? "No Ads" : f === "unchecked" ? "Unchecked" : f === "running" ? "Running Ads" : "All"}
          </button>
        ))}
      </div>

      {/* Company list */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="px-6 py-12 flex items-center justify-center gap-2 text-sm text-navy-400">
            <Loader2 size={14} className="animate-spin" /> Loading statuses…
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-navy-400">
            {filter === "running"
              ? "No companies found running Meta ads yet."
              : filter === "unchecked"
              ? "All companies have been scanned."
              : "No companies match this filter."}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-cream-200">
              <tr>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-navy-400 uppercase tracking-widest">Company</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-navy-400 uppercase tracking-widest">Category</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-navy-400 uppercase tracking-widest">Ad Status</th>
                <th className="text-left px-6 py-3.5 text-xs font-semibold text-navy-400 uppercase tracking-widest">Checked</th>
                <th className="px-6 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-50">
              {filtered.map(({ company, category }) => {
                const status = statuses[company];
                const isRechecking = rechecking === company;
                return (
                  <tr key={company} className={`hover:bg-cream-50 transition-colors ${status?.hasAds ? "bg-coral-50/30" : ""}`}>
                    <td className="px-6 py-4 font-medium text-navy-900">
                      <div className="flex items-center gap-2">
                        {status?.hasAds && <TrendingUp size={13} className="text-coral-500 flex-shrink-0" />}
                        {company}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-navy-400 text-xs">{category}</td>
                    <td className="px-6 py-4">
                      {!status ? (
                        <span className="text-xs text-navy-300">Not checked</span>
                      ) : status.hasAds ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-coral-100 text-coral-700 text-xs font-semibold rounded-full">
                          <span className="w-1.5 h-1.5 bg-coral-500 rounded-full animate-pulse" />
                          Running ads
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-cream-100 text-navy-400 text-xs font-medium rounded-full">
                          No active ads
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-navy-400">
                      {status ? formatChecked(status.checkedAt) : "—"}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        {status?.hasAds && (
                          <a
                            href={`https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=GB&q=${encodeURIComponent(company)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-coral-500 hover:text-coral-700 font-medium"
                          >
                            View Ads <ExternalLink size={10} />
                          </a>
                        )}
                        <button
                          onClick={() => recheck(company)}
                          disabled={!!rechecking}
                          title="Re-check now"
                          className="p-1 hover:bg-cream-100 rounded-lg transition-colors disabled:opacity-40"
                        >
                          <RefreshCw size={12} className={`text-navy-300 hover:text-navy-500 ${isRechecking ? "animate-spin" : ""}`} />
                        </button>
                        {allCompanies.find((c) => c.company === company)?.email && (
                          <Link
                            href={`/contacts/${encodeURIComponent(allCompanies.find((c) => c.company === company)!.email)}`}
                            className="inline-flex items-center gap-1 text-xs text-navy-400 hover:text-navy-700 font-medium"
                          >
                            <Building2 size={11} /> Profile
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {!loading && unchecked.length > 0 && (
        <p className="mt-4 text-xs text-navy-400 text-center">
          {unchecked.length} companies not yet checked — the next scheduled scan will pick them up.
        </p>
      )}
    </div>
  );
}
