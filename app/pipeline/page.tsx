"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, Check, Pencil, TrendingUp, Loader2 } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { useAuth } from "@clerk/nextjs";
import { dbGetDeals, dbUpsertDeal, dbDeleteDeal } from "@/lib/db";
import type { Deal, DealStatus } from "@/lib/types";
import InitialsAvatar from "@/components/InitialsAvatar";

const STAGES: { key: DealStatus; label: string; colour: string; bg: string; border: string; ring: string }[] = [
  { key: "pitched",     label: "Pitched",     colour: "text-navy-500",   bg: "bg-navy-50",    border: "border-navy-200",   ring: "ring-navy-400" },
  { key: "replied",     label: "Replied",      colour: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200",   ring: "ring-blue-400" },
  { key: "negotiating", label: "Negotiating",  colour: "text-amber-600",  bg: "bg-amber-50",   border: "border-amber-200",  ring: "ring-amber-400" },
  { key: "contracted",  label: "Contracted",   colour: "text-violet-600", bg: "bg-violet-50",  border: "border-violet-200", ring: "ring-violet-400" },
  { key: "delivered",   label: "Delivered",    colour: "text-teal-600",   bg: "bg-teal-50",    border: "border-teal-200",   ring: "ring-teal-400" },
  { key: "paid",        label: "Paid",         colour: "text-emerald-600",bg: "bg-emerald-50", border: "border-emerald-200",ring: "ring-emerald-400" },
];

function DealModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Deal;
  onSave: (d: Deal) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    contactName: initial?.contactName || "",
    contactEmail: initial?.contactEmail || "",
    company: initial?.company || "",
    status: initial?.status || "pitched" as DealStatus,
    value: initial?.value || "",
    notes: initial?.notes || "",
  });

  const handleSave = () => {
    if (!form.contactName.trim() || !form.company.trim()) return;
    const now = new Date().toISOString();
    onSave({
      id: initial?.id || crypto.randomUUID(),
      ...form,
      createdAt: initial?.createdAt || now,
      updatedAt: now,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-7 py-5 border-b border-cream-200">
          <h2 className="font-serif text-xl font-bold text-navy-900">
            {initial ? "Edit Deal" : "Add Deal"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-cream-100 rounded-lg transition-colors">
            <X size={16} className="text-navy-400" />
          </button>
        </div>
        <div className="px-7 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">Contact Name</label>
              <input value={form.contactName} onChange={(e) => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Jane Smith" className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">Company / Brand</label>
              <input value={form.company} onChange={(e) => setForm(f => ({ ...f, company: e.target.value }))} placeholder="Acme Foods" className="input-base" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">Email</label>
              <input type="email" value={form.contactEmail} onChange={(e) => setForm(f => ({ ...f, contactEmail: e.target.value }))} placeholder="jane@brand.com" className="input-base" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">Deal Value</label>
              <input value={form.value} onChange={(e) => setForm(f => ({ ...f, value: e.target.value }))} placeholder="£500" className="input-base" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">Stage</label>
            <select value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value as DealStatus }))} className="input-base">
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">Notes</label>
            <textarea rows={3} value={form.notes} onChange={(e) => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any details about this deal…" className="input-base resize-none text-sm" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-cream-200 bg-cream-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy-500 hover:text-navy-800 transition-colors">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!form.contactName.trim() || !form.company.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <Check size={14} />
            {initial ? "Save Changes" : "Add Deal"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function PipelinePage() {
  const getDb = useDb();
  const { userId: clerkUserId } = useAuth();
  const userId = clerkUserId ?? undefined;
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [editing, setEditing] = useState<Deal | "new" | null>(null);
  const [dragOver, setDragOver] = useState<DealStatus | null>(null);
  const dragId = useRef<string | null>(null);
  const dragEnterCount = useRef<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const db = await getDb();

        // Migrate any localStorage deals saved before Supabase was wired up
        const LS_KEY = "ginaos_deals";
        const lsRaw = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
        if (lsRaw && userId) {
          const lsDeals: Deal[] = JSON.parse(lsRaw);
          if (lsDeals.length > 0) {
            await Promise.all(lsDeals.map(d => dbUpsertDeal(db, d, userId)));
            localStorage.removeItem(LS_KEY);
          }
        }

        const data = await dbGetDeals(db);
        if (!cancelled) setDeals(data);
      } catch {
        // Supabase unavailable — fall back to localStorage so mock data is still visible
        const lsRaw = typeof window !== "undefined" ? localStorage.getItem("ginaos_deals") : null;
        if (!cancelled) setDeals(lsRaw ? JSON.parse(lsRaw) : []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [getDb, userId]);

  const handleSave = async (d: Deal) => {
    setSaveError("");
    try {
      const db = await getDb();
      await dbUpsertDeal(db, d, userId);
      const updated = await dbGetDeals(db);
      setDeals(updated);
      setEditing(null);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save deal");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this deal?")) return;
    const db = await getDb();
    await dbDeleteDeal(db, id);
    const updated = await dbGetDeals(db);
    setDeals(updated);
  };

  const handleDrop = async (targetStatus: DealStatus) => {
    const id = dragId.current;
    dragId.current = null;
    dragEnterCount.current = {};
    setDragOver(null);
    if (!id) return;
    const deal = deals.find(d => d.id === id);
    if (!deal || deal.status === targetStatus) return;
    const updated = { ...deal, status: targetStatus, updatedAt: new Date().toISOString() };
    // Optimistic update
    setDeals(prev => prev.map(d => d.id === id ? updated : d));
    const db = await getDb();
    await dbUpsertDeal(db, updated, userId);
  };

  const totalValue = deals
    .filter(d => d.value)
    .reduce((sum, d) => {
      const n = parseFloat((d.value || "").replace(/[^0-9.]/g, ""));
      return sum + (isNaN(n) ? 0 : n);
    }, 0);

  const currencySymbol = deals.find(d => d.value)?.value?.replace(/[0-9., ]/g, "").trim() || "£";

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 px-8 pt-7 pb-5 border-b border-cream-200 bg-white">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="h-px w-8 bg-coral-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">Pipeline</span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-navy-900 leading-tight">Deal Pipeline</h1>
            {totalValue > 0 && (
              <p className="mt-1 text-sm font-semibold text-emerald-600">
                <TrendingUp size={13} className="inline mr-1 mb-0.5" />
                Total pipeline value: <span className="font-bold">{currencySymbol}{totalValue.toLocaleString()}</span>
              </p>
            )}
          </div>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-coral-200 flex-shrink-0"
          >
            <Plus size={15} /> Add Deal
          </button>
        </div>
      </div>

      {saveError && (
        <div className="flex-shrink-0 mx-8 mt-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
          Error: {saveError}
        </div>
      )}

      {/* Kanban board */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden px-6 py-5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 size={24} className="text-navy-300 animate-spin" />
          </div>
        ) : (
          <div className="flex gap-4 h-full" style={{ minWidth: "max-content" }}>
            {STAGES.map(stage => {
              const stageDeals = deals.filter(d => d.status === stage.key);
              const isOver = dragOver === stage.key;

              return (
                <div
                  key={stage.key}
                  className={`flex flex-col rounded-2xl border transition-all duration-150 ${stage.bg} ${stage.border} ${isOver ? `ring-2 ${stage.ring} shadow-lg` : ""}`}
                  style={{ width: 256, minWidth: 256 }}
                  onDragOver={(e) => { e.preventDefault(); }}
                  onDragEnter={(e) => {
                    e.preventDefault();
                    dragEnterCount.current[stage.key] = (dragEnterCount.current[stage.key] || 0) + 1;
                    setDragOver(stage.key);
                  }}
                  onDragLeave={() => {
                    dragEnterCount.current[stage.key] = (dragEnterCount.current[stage.key] || 0) - 1;
                    if ((dragEnterCount.current[stage.key] || 0) <= 0) {
                      dragEnterCount.current[stage.key] = 0;
                      setDragOver(prev => prev === stage.key ? null : prev);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    dragEnterCount.current[stage.key] = 0;
                    handleDrop(stage.key);
                  }}
                >
                  {/* Column header */}
                  <div className={`flex items-center justify-between px-4 py-3 border-b ${stage.border} flex-shrink-0`}>
                    <span className={`text-xs font-bold uppercase tracking-widest ${stage.colour}`}>
                      {stage.label}
                    </span>
                    <span className={`text-xs font-bold tabular-nums ${stage.colour} opacity-60`}>
                      {stageDeals.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-2.5 scrollbar-thin">
                    {stageDeals.length === 0 && (
                      <div className={`border-2 border-dashed ${stage.border} rounded-xl h-16 flex items-center justify-center opacity-40`}>
                        <p className={`text-[11px] font-semibold ${stage.colour}`}>Drop here</p>
                      </div>
                    )}
                    {stageDeals.map(deal => (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={(e) => {
                          dragId.current = deal.id;
                          e.dataTransfer.effectAllowed = "move";
                        }}
                        onDragEnd={() => {
                          dragId.current = null;
                          dragEnterCount.current = {};
                          setDragOver(null);
                        }}
                        className="bg-white rounded-xl p-3.5 shadow-sm border border-cream-200 hover:border-cream-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing active:opacity-60 active:scale-95 select-none"
                      >
                        <div className="flex items-start gap-2.5 mb-2">
                          <InitialsAvatar name={deal.contactName} email={deal.contactEmail} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-navy-900 text-sm leading-tight truncate">{deal.contactName}</p>
                            <p className="text-xs text-navy-500 truncate">{deal.company}</p>
                          </div>
                        </div>

                        {deal.value && (
                          <span className="inline-block px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg mb-2">
                            {deal.value}
                          </span>
                        )}

                        {deal.notes && (
                          <p className="text-xs text-navy-400 line-clamp-2 mb-2">{deal.notes}</p>
                        )}

                        <div className="flex items-center justify-end gap-1 pt-1 border-t border-cream-100">
                          <button
                            onClick={() => setEditing(deal)}
                            className="p-1.5 hover:bg-cream-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Pencil size={12} className="text-navy-400" />
                          </button>
                          <button
                            onClick={() => handleDelete(deal.id)}
                            className="p-1.5 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove"
                          >
                            <Trash2 size={12} className="text-navy-400 hover:text-red-500" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {editing !== null && (
        <DealModal
          initial={editing === "new" ? undefined : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
