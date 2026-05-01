"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Mail, Trash2, Eye, Copy, Check, X } from "lucide-react";

type UserRow = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
  lastActiveAt: string | null;
  imageUrl: string;
  tickets: number;
  errors: number;
};

function timeAgo(iso: string | null) {
  if (!iso) return "never";
  const diff = Date.now() - new Date(iso).getTime();
  const d = Math.floor(diff / 86400000);
  if (d === 0) return "today";
  if (d === 1) return "yesterday";
  return `${d}d ago`;
}

function Avatar({ user }: { user: UserRow }) {
  if (user.imageUrl) {
    return <img src={user.imageUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover flex-shrink-0" />;
  }
  return (
    <div className="w-8 h-8 rounded-full bg-coral-100 flex items-center justify-center text-coral-600 text-xs font-black flex-shrink-0">
      {user.name[0]?.toUpperCase()}
    </div>
  );
}

function ImpersonateModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-black text-navy-900">Impersonate User</h2>
          <button onClick={onClose} className="text-navy-300 hover:text-navy-600"><X size={18} /></button>
        </div>
        <p className="text-sm text-navy-500 mb-4">
          Open this link in an <strong>incognito window</strong> to view Collabi as this user. Expires in 15 minutes.
        </p>
        <div className="flex gap-2 items-center bg-navy-50 rounded-xl px-3 py-2 text-xs text-navy-600 font-mono break-all mb-4">
          <span className="flex-1 min-w-0 truncate">{url}</span>
        </div>
        <div className="flex gap-3">
          <button
            onClick={copy}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-navy-100 text-navy-700 text-sm font-bold hover:bg-navy-200 transition-colors"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? "Copied" : "Copy Link"}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-coral-500 text-white text-sm font-bold hover:bg-coral-600 transition-colors"
          >
            <Eye size={14} />
            Open in New Tab
          </a>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [totalEmails, setTotalEmails] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [impersonateUrl, setImpersonateUrl] = useState<string | null>(null);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => {
        setUsers(d.users || []);
        setTotalEmails(d.totalEmails || 0);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(userId: string) {
    if (deleteConfirm !== userId) {
      setDeleteConfirm(userId);
      return;
    }
    setDeletingId(userId);
    setDeleteConfirm(null);
    try {
      const res = await fetch(`/api/admin/users?userId=${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      } else {
        const d = await res.json();
        alert(d.error || "Delete failed");
      }
    } finally {
      setDeletingId(null);
    }
  }

  async function handleImpersonate(userId: string) {
    setImpersonatingId(userId);
    try {
      const res = await fetch("/api/admin/users/impersonate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const d = await res.json();
      if (res.ok && d.url) {
        setImpersonateUrl(d.url);
      } else {
        alert(d.error || "Impersonation failed");
      }
    } finally {
      setImpersonatingId(null);
    }
  }

  return (
    <div className="h-full flex flex-col overflow-y-auto p-8" style={{ background: "#F7F8FA" }}>
      {impersonateUrl && (
        <ImpersonateModal url={impersonateUrl} onClose={() => setImpersonateUrl(null)} />
      )}

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
              <th className="text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest text-navy-400">Tickets</th>
              <th className="text-left px-5 py-3 text-[11px] font-black uppercase tracking-widest text-navy-400">Errors</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8 text-navy-300 text-sm">Loading…</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-navy-300 text-sm">No users found.</td></tr>
            ) : users.map((u) => (
              <tr
                key={u.id}
                className="border-b last:border-0 hover:bg-navy-50/30 transition-colors"
                style={{ borderColor: "var(--border)" }}
              >
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar user={u} />
                    <div>
                      <p className="font-bold text-navy-900">{u.name}</p>
                      <p className="text-xs text-navy-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 text-navy-500 text-xs">{new Date(u.createdAt).toLocaleDateString("en-GB")}</td>
                <td className="px-5 py-3 text-navy-500 text-xs">{timeAgo(u.lastActiveAt)}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-bold ${u.tickets > 0 ? "text-navy-700" : "text-navy-300"}`}>
                    {u.tickets}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <span className={`text-xs font-bold ${u.errors > 0 ? "text-red-500" : "text-navy-300"}`}>
                    {u.errors}
                  </span>
                </td>
                <td className="px-5 py-3">
                  <div className="flex items-center justify-end gap-2">
                    {/* Impersonate */}
                    <button
                      onClick={() => handleImpersonate(u.id)}
                      disabled={impersonatingId === u.id}
                      title="View as this user"
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-navy-600 hover:bg-navy-100 transition-colors disabled:opacity-50"
                    >
                      <Eye size={13} />
                      {impersonatingId === u.id ? "…" : "View as"}
                    </button>

                    {/* Delete */}
                    {deleteConfirm === u.id ? (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-red-500 font-bold">Sure?</span>
                        <button
                          onClick={() => handleDelete(u.id)}
                          disabled={deletingId === u.id}
                          className="px-2 py-1 rounded-lg text-xs font-bold bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          {deletingId === u.id ? "…" : "Yes"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="px-2 py-1 rounded-lg text-xs font-bold text-navy-500 hover:bg-navy-100 transition-colors"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDelete(u.id)}
                        disabled={deletingId === u.id}
                        title="Delete user"
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                      >
                        <Trash2 size={13} />
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
