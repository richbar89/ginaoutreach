"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Zap, Play, Square, RefreshCw, ExternalLink, Loader2, TrendingUp, Building2
} from "lucide-react";
import {
  scanCompanies,
  getAllCachedStatuses,
  getCachedAdStatus,
  checkCompanyAds,
  canForceScan,
  nextForceScanAt,
} from "@/lib/metaAds";
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
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatCountdown(date: Date): string {
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "now";
  const h = Math.floor(diff / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

type Filter = "all" | "running" | "none" | "unchecked";

export default function AdsPage() {
  const [allCompanies, setAllCompanies] = useState<{ company: string; category: string; email: string }[]>([]);
  const [statuses, setStatuses] = useState<Record<string, AdStatus>>({});
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const [scanError, setScanError] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [forceScanAvailable, setForceScanAvailable] = useState(true);
  const [nextScanTime, setNextScanTime] = useState<Date | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const refreshStatuses = useCallback(() => {
    setStatuses(getAllCachedStatuses());
  }, []);

  const refreshCooldown = useCallback(() => {
    setForceScanAvailable(canForceScan());
    setNextScanTime(nextForceScanAt());
  }, []);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data: ContactRow[]) => setAllCompanies(buildCompanyList(Array.isArray(data) ? data : [])))
      .catch(() => {});
    refreshStatuses();
    refreshCooldown();
    const interval = setInterval(refreshCooldown, 60000);
    return () => clearInterval(interval);
  }, [refreshStatuses, refreshCooldown]);

  const startScan = async () => {
    const controller = new AbortController();
    abortRef.current = controller;
    setScanning(true);
    setScanError("");
    setProgress({ done: 0, total: 0, current: "" });

    await scanCompanies(
      allCompanies.map((c) => c.company),
      (done, total, current, error) => {
        setProgress({ done, total, current });
        if (error) setScanError(`"${current}": ${error}`);
        refreshStatuses();
      },
      controller.signal,
      allCached
    );

    setScanning(false);
    refreshStatuses();
    refreshCooldown();
  };

  const stopScan = () => {
    abortRef.current?.abort();
    setScanning(false);
  };

  const recheck = async (company: string) => {
    try {
      await checkCompanyAds(company);
      refreshStatuses();
    } catch {
      // ignore
    }
  };

  // Stats
  const checked = allCompanies.filter((c) => statuses[c.company]);
  const running = checked.filter((c) => statuses[c.company]?.hasAds);
  const unchecked = allCompanies.filter((c) => !statuses[c.company]);
  const lastScan = Object.values(statuses).sort(
    (a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime()
  )[0];

  // Filtered list
  const filtered = allCompanies.filter((c) => {
    const s = statuses[c.company];
    if (filter === "running") return s?.hasAds;
    if (filter === "none") return s && !s.hasAds;
    if (filter === "unchecked") return !s;
    return true;
  });

  const pct = progress.total > 0 ? Math.round((progress.done / progress.total) * 100) : 0;
  const allCached = unchecked.length === 0;

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
              {lastScan
                ? `Last scan ${formatChecked(lastScan.checkedAt)}`
                : "Not yet scanned"}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {scanning ? (
              <button
                onClick={stopScan}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-800 hover:bg-navy-900 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Square size={14} />
                Stop
              </button>
            ) : (
              <>
                {allCached && !forceScanAvailable ? (
                  <div className="flex flex-col items-end gap-1">
                    <button
                      disabled
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-cream-200 text-navy-400 text-sm font-semibold rounded-xl cursor-not-allowed"
                    >
                      <RefreshCw size={14} />
                      Rescan All
                    </button>
                    {nextScanTime && (
                      <span className="text-[11px] text-navy-400">
                        Available in {formatCountdown(nextScanTime)}
                      </span>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={startScan}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors"
                  >
                    <Play size={14} />
                    {allCached ? "Rescan All" : "Scan All"}
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Scan error */}
      {scanError && (
        <div className="mb-6 px-5 py-4 bg-red-50 border border-red-200 rounded-2xl">
          <p className="text-xs text-red-600 font-mono break-all">{scanError}</p>
        </div>
      )}

      {/* Progress bar */}
      {scanning && (
        <div className="mb-6 bg-white border border-cream-200 rounded-2xl px-6 py-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Loader2 size={14} className="text-coral-500 animate-spin" />
              <span className="text-sm font-semibold text-navy-800">
                Scanning {progress.current || "…"}
              </span>
            </div>
            <span className="text-sm text-navy-400">
              {progress.done} / {progress.total} ({pct}%)
            </span>
          </div>
          <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-coral-500 rounded-full transition-all duration-300"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-navy-400">
            ~{Math.ceil((progress.total - progress.done) * 0.25 / 60)} min remaining
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-7">
        {[
          { label: "Companies", value: allCompanies.length, sub: "in your list", active: filter === "all", f: "all" as Filter },
          { label: "Running Ads", value: running.length, sub: "on Meta right now", active: filter === "running", f: "running" as Filter, highlight: running.length > 0 },
          { label: "No Active Ads", value: checked.length - running.length, sub: "checked, none found", active: filter === "none", f: "none" as Filter },
          { label: "Not Checked", value: unchecked.length, sub: "need a scan", active: filter === "unchecked", f: "unchecked" as Filter },
        ].map((s) => (
          <button
            key={s.label}
            onClick={() => setFilter(s.f)}
            className={`text-left bg-white border rounded-2xl p-5 shadow-sm hover:shadow-md transition-all ${
              s.active
                ? "border-coral-300 ring-1 ring-coral-200"
                : "border-cream-200 hover:border-cream-300"
            }`}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400 mb-2">
              {s.label}
            </p>
            <p className={`font-serif text-3xl font-bold leading-none mb-1 ${
              s.highlight ? "text-coral-500" : "text-navy-900"
            }`}>
              {s.value}
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
              filter === f
                ? "bg-white text-navy-800 shadow-sm"
                : "text-navy-400 hover:text-navy-600"
            }`}
          >
            {f === "none" ? "No Ads" : f === "unchecked" ? "Unchecked" : f === "running" ? "Running Ads" : "All"}
          </button>
        ))}
      </div>

      {/* Company list */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
        {filtered.length === 0 ? (
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
                return (
                  <tr key={company} className={`hover:bg-cream-50 transition-colors ${status?.hasAds ? "bg-coral-50/30" : ""}`}>
                    <td className="px-6 py-4 font-medium text-navy-900">
                      <div className="flex items-center gap-2">
                        {status?.hasAds && (
                          <TrendingUp size={13} className="text-coral-500 flex-shrink-0" />
                        )}
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
                          title="Re-check now"
                          className="p-1 hover:bg-cream-100 rounded-lg transition-colors"
                        >
                          <RefreshCw size={12} className="text-navy-300 hover:text-navy-500" />
                        </button>
                        {allCompanies.find((c) => c.company === company)?.email && (
                          <Link
                            href={`/contacts/${encodeURIComponent(
                              allCompanies.find((c) => c.company === company)!.email
                            )}`}
                            className="inline-flex items-center gap-1 text-xs text-navy-400 hover:text-navy-700 font-medium"
                          >
                            <Building2 size={11} />
                            Profile
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

      {!scanning && unchecked.length > 0 && (
        <p className="mt-4 text-xs text-navy-400 text-center">
          {unchecked.length} companies not yet checked —{" "}
          <button onClick={startScan} className="text-coral-500 hover:underline font-medium">
            run a scan
          </button>{" "}
          to see who&apos;s running ads. Takes ~{Math.ceil(unchecked.length * 0.25 / 60)} min.
        </p>
      )}
      {!scanning && allCached && !forceScanAvailable && nextScanTime && (
        <p className="mt-4 text-xs text-navy-400 text-center">
          All companies scanned · next rescan available in {formatCountdown(nextScanTime)}
        </p>
      )}
    </div>
  );
}
