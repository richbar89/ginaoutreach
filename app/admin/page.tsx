"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Ticket, Users, AlertTriangle, Megaphone, Activity, Upload, Save, Loader2, ListOrdered, Zap, CheckCircle, ArrowLeft } from "lucide-react";

const NAV = [
  { href: "/admin/waitlist",     label: "Waitlist",      icon: ListOrdered,  desc: "Landing page sign-ups" },
  { href: "/admin/tickets",      label: "Tickets",       icon: Ticket,       desc: "Brand contact requests" },
  { href: "/admin/users",        label: "Users",         icon: Users,        desc: "All users + email stats" },
  { href: "/admin/contacts",     label: "Contacts",      icon: Upload,       desc: "Upload new contacts" },
  { href: "/admin/errors",       label: "Error Log",     icon: AlertTriangle, desc: "App error monitoring" },
  { href: "/admin/announcements",label: "Announcements", icon: Megaphone,    desc: "Push messages to users" },
  { href: "/admin/status",       label: "System Status", icon: Activity,     desc: "API health checks" },
];

type Stats = {
  pendingTickets: number;
  totalUsers: number;
  unresolvedErrors: number;
  activeAnnouncements: number;
};

type CapacityRow = {
  category: string;
  label: string;
  emoji: string;
  filled: number;
  cap: number;
};

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [scanRunning, setScanRunning] = useState(false);
  const [scanResult, setScanResult] = useState<{ processed: number; errors: number; totalCompanies: number } | null>(null);

  // Capacity state
  const [capacity, setCapacity] = useState<CapacityRow[]>([]);
  const [capacityLoading, setCapacityLoading] = useState(true);
  const [capacitySaving, setCapacitySaving] = useState(false);
  const [capacitySaved, setCapacitySaved] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/tickets").then(r => r.json()),
      fetch("/api/admin/users").then(r => r.json()),
      fetch("/api/admin/errors").then(r => r.json()),
      fetch("/api/admin/announcements").then(r => r.json()),
    ]).then(([tickets, usersData, errors, announcements]) => {
      setStats({
        pendingTickets: Array.isArray(tickets) ? tickets.filter((t: { status: string }) => t.status === "pending").length : 0,
        totalUsers: usersData?.users?.length || 0,
        unresolvedErrors: Array.isArray(errors) ? errors.filter((e: { resolved: boolean }) => !e.resolved).length : 0,
        activeAnnouncements: Array.isArray(announcements) ? announcements.filter((a: { active: boolean }) => a.active).length : 0,
      });
    }).catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/admin/capacity")
      .then(r => r.json())
      .then(data => setCapacity(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setCapacityLoading(false));
  }, []);

  const updateCapacityField = (category: string, field: "filled" | "cap", raw: string) => {
    const value = parseInt(raw, 10);
    setCapacity(prev =>
      prev.map(row => row.category === category ? { ...row, [field]: isNaN(value) ? 0 : value } : row)
    );
    setCapacitySaved(false);
  };

  const forceMetaScan = async () => {
    setScanRunning(true);
    setScanResult(null);
    try {
      const secret = process.env.NEXT_PUBLIC_CRON_SECRET || "";
      const res = await fetch(`/api/cron/meta-scan?secret=${encodeURIComponent(secret)}`);
      const data = await res.json();
      setScanResult({ processed: data.processed ?? 0, errors: data.errors ?? 0, totalCompanies: data.totalCompanies ?? 0 });
    } catch {
      setScanResult({ processed: 0, errors: 1, totalCompanies: 0 });
    } finally {
      setScanRunning(false);
    }
  };

  const saveCapacity = async () => {
    setCapacitySaving(true);
    try {
      const res = await fetch("/api/admin/capacity", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(capacity.map(r => ({ category: r.category, filled: r.filled, cap: r.cap }))),
      });
      if (res.ok) {
        const updated = await res.json();
        setCapacity(updated);
        setCapacitySaved(true);
        setTimeout(() => setCapacitySaved(false), 2500);
      }
    } finally {
      setCapacitySaving(false);
    }
  };

  const statCards = [
    { label: "Pending Tickets", value: stats?.pendingTickets ?? "—", colour: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    { label: "Total Users", value: stats?.totalUsers ?? "—", colour: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { label: "Unresolved Errors", value: stats?.unresolvedErrors ?? "—", colour: "text-red-600", bg: "bg-red-50 border-red-200" },
    { label: "Active Announcements", value: stats?.activeAnnouncements ?? "—", colour: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  ];

  return (
    <div className="h-full flex flex-col overflow-y-auto p-8" style={{ background: "#F7F8FA" }}>
      <div className="flex items-center gap-3 mb-8">
        <Link href="/dashboard" className="text-navy-400 hover:text-navy-700"><ArrowLeft size={18} /></Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-navy-400 mb-1">Admin</p>
          <h1 className="text-3xl font-black tracking-tight text-navy-900">Dashboard</h1>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {statCards.map(s => (
          <div key={s.label} className={`rounded-2xl border p-5 ${s.bg}`}>
            <p className="text-xs font-semibold text-navy-500 mb-1">{s.label}</p>
            <p className={`text-4xl font-black ${s.colour}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Creator Capacity Editor */}
      <div className="bg-white border rounded-2xl p-6 mb-8" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-base font-black text-navy-900">Creator Capacity</h2>
            <p className="text-xs text-navy-400 mt-0.5">Controls the urgency bars on the landing page. Update manually each week.</p>
          </div>
          <button
            onClick={saveCapacity}
            disabled={capacitySaving || capacityLoading}
            className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 hover:bg-coral-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
          >
            {capacitySaving
              ? <><Loader2 size={13} className="animate-spin" /> Saving…</>
              : capacitySaved
              ? "✓ Saved"
              : <><Save size={13} /> Save Changes</>
            }
          </button>
        </div>

        {capacityLoading ? (
          <div className="flex items-center gap-2 text-sm text-navy-400 py-4">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-4">
            {capacity.map(row => {
              const pct = row.cap > 0 ? Math.min(100, Math.round((row.filled / row.cap) * 100)) : 0;
              return (
                <div key={row.category} className="border rounded-xl p-4" style={{ borderColor: "var(--border)" }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xl">{row.emoji}</span>
                    <span className="text-sm font-black text-navy-900">{row.label}</span>
                  </div>

                  {/* Progress bar */}
                  <div className="h-1.5 bg-cream-100 rounded-full mb-3 overflow-hidden">
                    <div
                      className="h-full bg-coral-400 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-navy-400 mb-3">{pct}% filled ({row.filled}/{row.cap})</p>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-navy-400 mb-1">Filled</label>
                      <input
                        type="number"
                        min={0}
                        max={row.cap}
                        value={row.filled}
                        onChange={e => updateCapacityField(row.category, "filled", e.target.value)}
                        className="w-full text-sm font-bold text-navy-900 border border-cream-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-coral-300 focus:ring-1 focus:ring-coral-200"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-widest text-navy-400 mb-1">Cap</label>
                      <input
                        type="number"
                        min={1}
                        value={row.cap}
                        onChange={e => updateCapacityField(row.category, "cap", e.target.value)}
                        className="w-full text-sm font-bold text-navy-900 border border-cream-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-coral-300 focus:ring-1 focus:ring-coral-200"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Meta Ad Scan */}
      <div className="bg-white border rounded-2xl p-6 mb-8" style={{ borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-black text-navy-900">Meta Ad Library Scan</h2>
            <p className="text-xs text-navy-400 mt-0.5">
              Runs automatically every 48h (200 companies per batch). Force a run to pick up new contacts immediately.
            </p>
          </div>
          <button
            onClick={forceMetaScan}
            disabled={scanRunning}
            className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 hover:bg-coral-600 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors flex-shrink-0"
          >
            {scanRunning
              ? <><Loader2 size={13} className="animate-spin" /> Scanning…</>
              : <><Zap size={13} /> Force Scan</>
            }
          </button>
        </div>
        {scanResult && (
          <div className={`mt-4 flex items-center gap-2 text-sm font-medium ${scanResult.errors > 0 ? "text-amber-600" : "text-emerald-600"}`}>
            <CheckCircle size={14} />
            Processed {scanResult.processed} of {scanResult.totalCompanies} companies
            {scanResult.errors > 0 && ` · ${scanResult.errors} errors`}
          </div>
        )}
      </div>

      {/* Nav grid */}
      <div className="grid grid-cols-3 gap-4">
        {NAV.map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={href}
            href={href}
            className="bg-white border rounded-2xl p-6 flex items-start gap-4 hover:shadow-md transition-shadow"
            style={{ borderColor: "var(--border)" }}
          >
            <div className="w-10 h-10 rounded-xl bg-coral-100 flex items-center justify-center flex-shrink-0">
              <Icon size={18} className="text-coral-600" />
            </div>
            <div>
              <p className="font-black text-navy-900 text-sm mb-1">{label}</p>
              <p className="text-xs text-navy-400">{desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
