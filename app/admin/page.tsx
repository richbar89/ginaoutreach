"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Ticket, Users, AlertTriangle, Megaphone, Activity, Upload } from "lucide-react";

const NAV = [
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

export default function AdminPage() {
  const [stats, setStats] = useState<Stats | null>(null);

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

  const statCards = [
    { label: "Pending Tickets", value: stats?.pendingTickets ?? "—", colour: "text-amber-600", bg: "bg-amber-50 border-amber-200" },
    { label: "Total Users", value: stats?.totalUsers ?? "—", colour: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
    { label: "Unresolved Errors", value: stats?.unresolvedErrors ?? "—", colour: "text-red-600", bg: "bg-red-50 border-red-200" },
    { label: "Active Announcements", value: stats?.activeAnnouncements ?? "—", colour: "text-emerald-600", bg: "bg-emerald-50 border-emerald-200" },
  ];

  return (
    <div className="h-full flex flex-col overflow-y-auto p-8" style={{ background: "var(--blush)" }}>
      <div className="mb-8">
        <p className="text-[11px] font-bold uppercase tracking-widest text-navy-400 mb-1">Admin</p>
        <h1 className="text-3xl font-black tracking-tight text-navy-900">Dashboard</h1>
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
