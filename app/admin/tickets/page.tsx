"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Clock } from "lucide-react";

type Ticket = {
  id: string;
  user_email: string;
  brand_name: string;
  brand_url: string;
  notes: string | null;
  status: "pending" | "in_progress" | "done" | "rejected";
  admin_notes: string | null;
  created_at: string;
};

const STATUS_COLOURS: Record<string, string> = {
  pending:     "bg-amber-100 text-amber-700",
  in_progress: "bg-blue-100 text-blue-700",
  done:        "bg-emerald-100 text-emerald-700",
  rejected:    "bg-red-100 text-red-600",
};

const STATUS_OPTIONS = ["pending", "in_progress", "done", "rejected"];

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/tickets");
    const data = await res.json();
    setTickets(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateTicket = async (id: string, updates: Partial<Ticket>) => {
    setSaving(true);
    await fetch("/api/admin/tickets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, ...updates }),
    });
    await load();
    setSaving(false);
    setEditingId(null);
  };

  const filtered = filter === "all" ? tickets : tickets.filter(t => t.status === filter);

  return (
    <div className="h-full flex flex-col overflow-y-auto p-8" style={{ background: "#F7F8FA" }}>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-navy-400 hover:text-navy-700"><ArrowLeft size={18} /></Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Admin</p>
          <h1 className="text-2xl font-black text-navy-900">Brand Contact Tickets</h1>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {["all", ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors capitalize ${
              filter === s ? "bg-coral-500 text-white" : "bg-white text-navy-500 border border-gray-200 hover:border-coral-300"
            }`}
          >
            {s.replace("_", " ")} {s === "all" ? `(${tickets.length})` : `(${tickets.filter(t => t.status === s).length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center text-navy-400 text-sm">Loading…</div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-navy-400 text-sm">No tickets.</div>
      ) : (
        <div className="space-y-3">
          {filtered.map(ticket => (
            <div key={ticket.id} className="bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-black text-navy-900">{ticket.brand_name}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${STATUS_COLOURS[ticket.status]}`}>
                      {ticket.status.replace("_", " ")}
                    </span>
                  </div>
                  <a
                    href={ticket.brand_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-500 hover:underline mb-2"
                  >
                    {ticket.brand_url} <ExternalLink size={10} />
                  </a>
                  {ticket.notes && (
                    <p className="text-xs text-navy-500 bg-navy-50 rounded-lg px-3 py-2 mb-2">{ticket.notes}</p>
                  )}
                  <div className="flex items-center gap-3 text-[11px] text-navy-400">
                    <span>{ticket.user_email}</span>
                    <span className="flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(ticket.created_at).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  {ticket.admin_notes && editingId !== ticket.id && (
                    <p className="text-xs text-navy-600 mt-2 italic">Note: {ticket.admin_notes}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  <select
                    value={ticket.status}
                    onChange={e => updateTicket(ticket.id, { status: e.target.value as Ticket["status"] })}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 font-semibold text-navy-700 bg-white"
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>
                  <button
                    onClick={() => { setEditingId(ticket.id); setAdminNotes(ticket.admin_notes || ""); }}
                    className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 font-semibold text-navy-500 hover:border-coral-300 bg-white"
                  >
                    Add note
                  </button>
                </div>
              </div>

              {editingId === ticket.id && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <textarea
                    value={adminNotes}
                    onChange={e => setAdminNotes(e.target.value)}
                    rows={2}
                    placeholder="Internal note…"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none outline-none focus:border-coral-300"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => updateTicket(ticket.id, { admin_notes: adminNotes })}
                      disabled={saving}
                      className="px-3 py-1.5 bg-coral-500 text-white text-xs font-bold rounded-lg hover:bg-coral-600 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 bg-gray-100 text-navy-500 text-xs font-bold rounded-lg hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
