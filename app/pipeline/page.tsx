"use client";

import { useState, useEffect } from "react";
import { Plus, Trash2, ChevronRight, X, Check, Pencil, TrendingUp } from "lucide-react";
import { getDeals, upsertDeal, deleteDeal } from "@/lib/storage";
import type { Deal, DealStatus } from "@/lib/types";
import InitialsAvatar from "@/components/InitialsAvatar";

const STAGES: { key: DealStatus; label: string; colour: string; bg: string; border: string }[] = [
  { key: "pitched",     label: "Pitched",      colour: "text-navy-500",   bg: "bg-navy-50",    border: "border-navy-200" },
  { key: "replied",     label: "Replied",       colour: "text-blue-600",   bg: "bg-blue-50",    border: "border-blue-200" },
  { key: "negotiating", label: "Negotiating",   colour: "text-amber-600",  bg: "bg-amber-50",   border: "border-amber-200" },
  { key: "contracted",  label: "Contracted",    colour: "text-violet-600", bg: "bg-violet-50",  border: "border-violet-200" },
  { key: "delivered",   label: "Delivered",     colour: "text-teal-600",   bg: "bg-teal-50",    border: "border-teal-200" },
  { key: "paid",        label: "Paid",          colour: "text-emerald-600",bg: "bg-emerald-50", border: "border-emerald-200" },
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
  const [deals, setDeals] = useState<Deal[]>([]);
  const [editing, setEditing] = useState<Deal | "new" | null>(null);

  useEffect(() => { setDeals(getDeals()); }, []);

  const refresh = () => setDeals(getDeals());

  const handleSave = (d: Deal) => { upsertDeal(d); refresh(); setEditing(null); };
  const handleDelete = (id: string) => { if (!confirm("Remove this deal?")) return; deleteDeal(id); refresh(); };

  const advanceStage = (deal: Deal) => {
    const idx = STAGES.findIndex(s => s.key === deal.status);
    if (idx >= STAGES.length - 1) return;
    upsertDeal({ ...deal, status: STAGES[idx + 1].key, updatedAt: new Date().toISOString() });
    refresh();
  };

  const totalValue = deals
    .filter(d => d.value)
    .reduce((sum, d) => {
      const n = parseFloat((d.value || "").replace(/[^0-9.]/g, ""));
      return sum + (isNaN(n) ? 0 : n);
    }, 0);

  const currencySymbol = deals.find(d => d.value)?.value?.replace(/[0-9., ]/g, "").trim() || "£";

  return (
    <div className="p-10 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-10 bg-coral-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">Pipeline</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-4xl font-bold text-navy-900 leading-tight">Deal Pipeline</h1>
            <p className="mt-2 text-navy-500 text-base">Track every brand deal from first pitch to payment.</p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-coral-200 flex-shrink-0"
          >
            <Plus size={15} /> Add Deal
          </button>
        </div>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 mb-10">
        {STAGES.map(s => {
          const count = deals.filter(d => d.status === s.key).length;
          return (
            <div key={s.key} className={`${s.bg} ${s.border} border rounded-xl p-3 text-center`}>
              <p className={`text-2xl font-serif font-bold ${s.colour}`}>{count}</p>
              <p className={`text-[10px] font-semibold uppercase tracking-wide mt-0.5 ${s.colour} opacity-70`}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Total value */}
      {totalValue > 0 && (
        <div className="mb-8 flex items-center gap-3 px-5 py-4 bg-emerald-50 border border-emerald-200 rounded-2xl">
          <TrendingUp size={18} className="text-emerald-600 flex-shrink-0" />
          <p className="text-sm font-semibold text-emerald-700">
            Total pipeline value: <span className="font-bold">{currencySymbol}{totalValue.toLocaleString()}</span>
          </p>
        </div>
      )}

      {/* Deal list grouped by stage */}
      {deals.length === 0 ? (
        <div className="text-center py-20 bg-white border border-cream-200 rounded-2xl">
          <TrendingUp size={36} className="text-cream-300 mx-auto mb-4" />
          <p className="font-serif text-xl font-bold text-navy-900 mb-2">No deals yet</p>
          <p className="text-navy-400 text-sm mb-6">Add a deal manually or let the inbox detect positive replies for you.</p>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus size={14} /> Add First Deal
          </button>
        </div>
      ) : (
        <div className="space-y-10">
          {STAGES.map(stage => {
            const stageDeals = deals.filter(d => d.status === stage.key);
            if (stageDeals.length === 0) return null;
            const isLast = stage.key === "paid";
            return (
              <div key={stage.key}>
                <div className="flex items-center gap-3 mb-4">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${stage.bg} ${stage.colour} ${stage.border} border`}>
                    {stage.label}
                  </span>
                  <span className="text-xs text-navy-400">{stageDeals.length} deal{stageDeals.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="space-y-3">
                  {stageDeals.map(deal => (
                    <div key={deal.id} className="bg-white border border-cream-200 hover:border-cream-300 rounded-2xl px-5 py-4 shadow-sm hover:shadow-md transition-all flex items-center gap-4">
                      <InitialsAvatar name={deal.contactName} email={deal.contactEmail} size="sm" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-navy-900 text-sm">{deal.contactName}</p>
                          <span className="text-navy-300 text-xs">·</span>
                          <p className="text-sm text-navy-500">{deal.company}</p>
                          {deal.value && (
                            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold rounded-lg">
                              {deal.value}
                            </span>
                          )}
                        </div>
                        {deal.notes && <p className="text-xs text-navy-400 mt-1 line-clamp-1">{deal.notes}</p>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {!isLast && (
                          <button
                            onClick={() => advanceStage(deal)}
                            title={`Move to ${STAGES[STAGES.findIndex(s => s.key === deal.status) + 1]?.label}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold text-navy-500 hover:text-coral-600 hover:bg-coral-50 border border-cream-200 hover:border-coral-200 rounded-lg transition-colors"
                          >
                            <ChevronRight size={12} />
                            {STAGES[STAGES.findIndex(s => s.key === deal.status) + 1]?.label}
                          </button>
                        )}
                        <button onClick={() => setEditing(deal)} className="p-2 hover:bg-cream-100 rounded-lg transition-colors" title="Edit">
                          <Pencil size={13} className="text-navy-400" />
                        </button>
                        <button onClick={() => handleDelete(deal.id)} className="p-2 hover:bg-red-50 rounded-lg transition-colors" title="Remove">
                          <Trash2 size={13} className="text-navy-400 hover:text-red-500" />
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
