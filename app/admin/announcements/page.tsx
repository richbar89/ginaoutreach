"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";

type Announcement = {
  id: string;
  message: string;
  type: "info" | "warning" | "success";
  active: boolean;
  created_at: string;
  expires_at: string | null;
};

const TYPE_COLOURS: Record<string, string> = {
  info:    "bg-blue-100 text-blue-700",
  warning: "bg-amber-100 text-amber-700",
  success: "bg-emerald-100 text-emerald-700",
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [type, setType] = useState<"info" | "warning" | "success">("info");
  const [expiresAt, setExpiresAt] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/announcements");
    const data = await res.json();
    setAnnouncements(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!message.trim()) return;
    setSaving(true);
    await fetch("/api/admin/announcements", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, type, expires_at: expiresAt || null }),
    });
    setMessage(""); setExpiresAt(""); setShowForm(false); setSaving(false);
    await load();
  };

  const toggle = async (id: string, active: boolean) => {
    await fetch("/api/admin/announcements", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, active }),
    });
    setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, active } : a));
  };

  const remove = async (id: string) => {
    await fetch("/api/admin/announcements", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="h-full flex flex-col overflow-y-auto p-8" style={{ background: "#F7F8FA" }}>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/admin" className="text-navy-400 hover:text-navy-700"><ArrowLeft size={18} /></Link>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Admin</p>
            <h1 className="text-2xl font-black text-navy-900">Announcements</h1>
          </div>
        </div>
        <button
          onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-4 py-2 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600"
        >
          <Plus size={14} /> New
        </button>
      </div>

      {/* Create form */}
      {showForm && (
        <div className="bg-white rounded-2xl border p-5 mb-5" style={{ borderColor: "var(--border)" }}>
          <p className="font-black text-navy-900 mb-4">New Announcement</p>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={3}
            placeholder="Announcement message…"
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none outline-none focus:border-coral-300 mb-3"
          />
          <div className="flex gap-3 mb-3">
            <div className="flex-1">
              <label className="text-xs font-bold text-navy-500 mb-1 block">Type</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as "info" | "warning" | "success")}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-bold text-navy-500 mb-1 block">Expires at (optional)</label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={create}
              disabled={saving || !message.trim()}
              className="px-4 py-2 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600 disabled:opacity-50"
            >
              Publish
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="px-4 py-2 bg-gray-100 text-navy-600 text-sm font-bold rounded-xl hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center text-navy-400 text-sm py-10">Loading…</div>
      ) : announcements.length === 0 ? (
        <div className="text-center text-navy-400 text-sm py-10">No announcements yet.</div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => (
            <div key={a.id} className={`bg-white rounded-2xl border p-5 ${!a.active ? "opacity-60" : ""}`} style={{ borderColor: "var(--border)" }}>
              <div className="flex items-start gap-3">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${TYPE_COLOURS[a.type]}`}>
                  {a.type}
                </span>
                <div className="flex-1">
                  <p className="text-sm text-navy-900 font-semibold">{a.message}</p>
                  <p className="text-[11px] text-navy-300 mt-1">
                    {new Date(a.created_at).toLocaleDateString("en-GB")}
                    {a.expires_at && ` · expires ${new Date(a.expires_at).toLocaleDateString("en-GB")}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggle(a.id, !a.active)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-colors ${
                      a.active
                        ? "border-gray-200 text-navy-500 hover:border-red-300"
                        : "border-emerald-200 text-emerald-600 hover:bg-emerald-50"
                    }`}
                  >
                    {a.active ? "Deactivate" : "Activate"}
                  </button>
                  <button onClick={() => remove(a.id)} className="text-red-400 hover:text-red-600">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
