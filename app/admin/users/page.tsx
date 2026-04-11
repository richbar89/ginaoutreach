"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastActiveAt: string | null;
  imageUrl: string;
};

function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalEmails, setTotalEmails] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/users")
      .then(r => r.json())
      .then(d => {
        setUsers(d.users || []);
        setTotalEmails(d.totalEmails || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="h-full flex flex-col overflow-y-auto p-8" style={{ background: "#F7F8FA" }}>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-navy-400 hover:text-navy-700"><ArrowLeft size={18} /></Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Admin</p>
          <h1 className="text-2xl font-black text-navy-900">Users</h1>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs text-navy-400 mb-1">Total Users</p>
          <p className="text-3xl font-black text-navy-900">{loading ? "—" : users.length}</p>
        </div>
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs text-navy-400 mb-1">Total Emails Sent</p>
          <div className="flex items-end gap-2">
            <p className="text-3xl font-black text-navy-900">{loading ? "—" : totalEmails}</p>
            <Mail size={16} className="text-navy-300 mb-1" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs text-navy-400 mb-1">Avg Emails / User</p>
          <p className="text-3xl font-black text-navy-900">
            {loading || users.length === 0 ? "—" : (totalEmails / users.length).toFixed(1)}
          </p>
        </div>
      </div>

      {/* User table */}
      <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: "var(--border)" }}>
              <th className="text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest text-navy-400">User</th>
              <th className="text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest text-navy-400">Joined</th>
              <th className="text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest text-navy-400">Last Active</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={3} className="text-center py-8 text-navy-300 text-sm">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={3} className="text-center py-8 text-navy-300 text-sm">No users found.</td></tr>
            ) : users.map(u => (
              <tr key={u.id} className="border-b last:border-0 hover:bg-navy-50/30 transition-colors" style={{ borderColor: "var(--border)" }}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    {u.imageUrl ? (
                      <img src={u.imageUrl} alt={u.name} className="w-8 h-8 rounded-full object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-coral-100 flex items-center justify-center text-coral-600 text-xs font-black">
                        {u.name[0]?.toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="font-bold text-navy-900">{u.name}</p>
                      <p className="text-xs text-navy-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-navy-500 text-xs">{new Date(u.createdAt).toLocaleDateString("en-GB")}</td>
                <td className="px-5 py-3 text-navy-500 text-xs">{timeAgo(u.lastActiveAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
