"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, RefreshCw, CheckCircle, XCircle } from "lucide-react";

type ServiceStatus = { ok: boolean; latencyMs?: number; error?: string; status?: number };
type StatusData = {
  supabase: ServiceStatus;
  clerk: ServiceStatus;
  meta: ServiceStatus;
  checkedAt: string;
};

function StatusRow({ label, s }: { label: string; s: ServiceStatus }) {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b last:border-0" style={{ borderColor: "var(--border)" }}>
      <div className="flex-1">
        <p className="font-bold text-navy-900 text-sm">{label}</p>
        {s.error && <p className="text-xs text-red-500 mt-0.5">{s.error}</p>}
      </div>
      <div className="flex items-center gap-2">
        {s.ok ? (
          <span className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold">
            <CheckCircle size={16} /> Operational
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-red-500 text-sm font-bold">
            <XCircle size={16} /> Down
          </span>
        )}
      </div>
    </div>
  );
}

export default function AdminStatusPage() {
  const [status, setStatus] = useState<StatusData | null>(null);
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/status");
    const data = await res.json();
    setStatus(data);
    setLoading(false);
  }, []);

  return (
    <div className="h-full flex flex-col overflow-y-auto p-8" style={{ background: "#F7F8FA" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-navy-400 hover:text-navy-700"><ArrowLeft size={18} /></Link>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Admin</p>
            <h1 className="text-2xl font-black text-navy-900">System Status</h1>
          </div>
        </div>
        <button
          onClick={check}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600 disabled:opacity-60"
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Checking…" : "Run checks"}
        </button>
      </div>

      {!status ? (
        <div className="bg-white rounded-2xl border p-10 text-center text-navy-400 text-sm" style={{ borderColor: "var(--border)" }}>
          Press "Run checks" to test all services.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border overflow-hidden mb-4" style={{ borderColor: "var(--border)" }}>
            <div className="px-5 py-3 border-b bg-gray-50" style={{ borderColor: "var(--border)" }}>
              <p className="text-[11px] font-black uppercase tracking-widest text-navy-400">Services</p>
            </div>
            <StatusRow label="Supabase Database" s={status.supabase} />
            <StatusRow label="Clerk Auth" s={status.clerk} />
            <StatusRow label="Meta Graph API" s={status.meta} />
          </div>
          <p className="text-xs text-navy-300 text-right">
            Last checked: {new Date(status.checkedAt).toLocaleString("en-GB")}
          </p>
        </>
      )}
    </div>
  );
}
