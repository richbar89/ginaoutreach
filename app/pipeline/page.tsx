"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, X, Check, Pencil, TrendingUp } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { useAuth } from "@clerk/nextjs";
import { dbGetDeals, dbUpsertDeal, dbDeleteDeal, dbGetBrands } from "@/lib/db";
import type { Deal, DealStatus } from "@/lib/types";
import BrandLogo from "@/components/BrandLogo";

type BrandOption = { name: string; domain?: string };

const DOMAINS_KEY = "dashboard_brand_domains"; // shared cache with the dashboard

// Functional stage accents — rendered quietly (header dot + tinted count pill)
const STAGES: { key: DealStatus; label: string; accent: string }[] = [
  { key: "pitched",     label: "Pitched",     accent: "#6E6E73" },
  { key: "replied",     label: "Replied",     accent: "#3B82F6" },
  { key: "negotiating", label: "Negotiating", accent: "#F59E0B" },
  { key: "contracted",  label: "Contracted",  accent: "#8B5CF6" },
  { key: "delivered",   label: "Delivered",   accent: "#06B6D4" },
  { key: "paid",        label: "Paid",        accent: "#10B981" },
];

function DealModal({
  initial,
  brandOptions,
  onPickBrand,
  onSave,
  onClose,
}: {
  initial?: Deal;
  brandOptions: BrandOption[];
  onPickBrand: (name: string, domain?: string) => void;
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
  const [showSuggest, setShowSuggest] = useState(false);

  const suggestions = form.company.trim().length >= 1
    ? brandOptions.filter(b => b.name.toLowerCase().includes(form.company.trim().toLowerCase()) && b.name !== form.company).slice(0, 6)
    : [];

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/40 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[20px] shadow-[0_24px_64px_rgba(0,0,0,0.18)] border border-black/[0.05] w-full max-w-lg animate-scale-in">
        <div className="flex items-center justify-between px-7 py-5 border-b border-black/[0.06]">
          <h2 className="text-xl font-bold tracking-tight text-navy-900">
            {initial ? "Edit Deal" : "Add Deal"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-black/[0.04] rounded-full transition-all duration-200">
            <X size={16} className="text-navy-400" />
          </button>
        </div>
        <div className="px-7 py-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">Contact Name</label>
              <input value={form.contactName} onChange={(e) => setForm(f => ({ ...f, contactName: e.target.value }))} placeholder="Jane Smith" className="input-base" />
            </div>
            <div className="relative">
              <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">Company / Brand</label>
              <input
                value={form.company}
                onChange={(e) => { setForm(f => ({ ...f, company: e.target.value })); setShowSuggest(true); }}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 150)}
                placeholder="Start typing a brand…"
                className="input-base"
                autoComplete="off"
              />
              {showSuggest && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-20 bg-white border border-black/[0.06] rounded-2xl shadow-[0_12px_32px_rgba(0,0,0,0.10)] overflow-hidden">
                  {suggestions.map(b => (
                    <button
                      key={b.name}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => {
                        setForm(f => ({ ...f, company: b.name }));
                        setShowSuggest(false);
                        onPickBrand(b.name, b.domain);
                      }}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 hover:bg-cream-50 transition-colors text-left"
                    >
                      <BrandLogo name={b.name} domain={b.domain} size={24} />
                      <span className="text-sm font-medium text-navy-900 truncate">{b.name}</span>
                    </button>
                  ))}
                </div>
              )}
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
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-black/[0.06] bg-cream-50 rounded-b-[20px]">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy-500 hover:text-navy-800 rounded-full transition-all duration-200">Cancel</button>
          <button
            onClick={handleSave}
            disabled={!form.contactName.trim() || !form.company.trim()}
            className="btn-primary !px-5"
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
  const router = useRouter();
  const getDb = useDb();
  const { userId: clerkUserId } = useAuth();
  const userId = clerkUserId ?? undefined;
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState("");
  const [editing, setEditing] = useState<Deal | "new" | null>(null);
  const [brandOptions, setBrandOptions] = useState<BrandOption[]>([]);
  const [extraDomains, setExtraDomains] = useState<Record<string, string>>(() => {
    try { return JSON.parse(localStorage.getItem(DOMAINS_KEY) ?? "{}"); } catch { return {}; }
  });
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

        // Brand options for the Add Deal autocomplete: user brands + contact companies
        const [brandsData, contactsRes] = await Promise.all([
          userId ? dbGetBrands(db, userId) : Promise.resolve([]),
          fetch("/api/contacts").catch(() => null),
        ]);
        const contactCompanies: string[] = contactsRes?.ok
          ? (Array.from(new Set(
              ((await contactsRes.json()) as { company?: string }[]).map(c => c.company).filter(Boolean)
            )) as string[])
          : [];
        const merged = new Map<string, BrandOption>();
        for (const name of contactCompanies) merged.set(name.toLowerCase(), { name });
        for (const b of brandsData) merged.set(b.name.toLowerCase(), { name: b.name, domain: b.domain });
        if (!cancelled) {
          setBrandOptions(Array.from(merged.values()).sort((a, b) => a.name.localeCompare(b.name)));
        }
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

  // Remember the brand's domain so its logo shows here and on the dashboard
  const handlePickBrand = (name: string, domain?: string) => {
    const cache = (d: string) => setExtraDomains(prev => {
      const next = { ...prev, [name]: d };
      localStorage.setItem(DOMAINS_KEY, JSON.stringify(next));
      return next;
    });
    if (domain) cache(domain);
    else {
      fetch(`/api/resolve-domain?name=${encodeURIComponent(name)}`)
        .then(r => r.json())
        .then(({ domain: resolved }) => { if (resolved) cache(resolved); })
        .catch(() => {});
    }
  };

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
      {/* Header — sits directly on the canvas */}
      <div className="flex-shrink-0 px-8 pt-7 pb-4">
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <div className="h-px w-8 bg-coral-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">Pipeline</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-navy-900 leading-tight">Deal Pipeline</h1>
            {totalValue > 0 && (
              <p className="mt-1.5 text-sm text-navy-500">
                Total pipeline value{" "}
                <span className="font-semibold text-[#059669]">{currencySymbol}{totalValue.toLocaleString()}</span>
              </p>
            )}
          </div>
          <button
            onClick={() => setEditing("new")}
            className="btn-primary flex-shrink-0"
          >
            <Plus size={15} /> Add Deal
          </button>
        </div>
      </div>

      {saveError && (
        <div className="flex-shrink-0 mx-8 mt-1 mb-2 px-4 py-3 bg-red-50 border border-red-100 rounded-2xl text-sm text-red-700 font-medium">
          Error: {saveError}
        </div>
      )}

      {/* Kanban board — columns float directly on the canvas */}
      <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden px-[26px] pt-2 pb-5">
        {loading ? (
          <div className="flex gap-5 h-full animate-pulse" style={{ minWidth: "max-content" }}>
            {Array.from({ length: 6 }).map((_, col) => (
              <div key={col} className="flex flex-col rounded-2xl" style={{ width: 256, minWidth: 256 }}>
                <div className="flex items-center gap-2 px-1.5 py-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-cream-300 flex-shrink-0" />
                  <div className="h-3 bg-cream-200 rounded-full w-20" />
                  <div className="ml-auto h-4 bg-cream-200 rounded-full w-7" />
                </div>
                <div className="flex-1 px-1.5 pt-1 space-y-3">
                  {Array.from({ length: col === 0 ? 3 : col === 1 ? 2 : 1 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_1px_8px_rgba(0,0,0,0.04)] space-y-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-cream-200 flex-shrink-0" />
                        <div className="space-y-1.5 flex-1">
                          <div className="h-3 bg-cream-200 rounded-full w-3/4" />
                          <div className="h-2.5 bg-cream-100 rounded-full w-1/2" />
                        </div>
                      </div>
                      <div className="h-3.5 bg-cream-100 rounded-full w-14" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : deals.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-sm">
              <div className="w-14 h-14 bg-coral-50 rounded-full flex items-center justify-center mx-auto mb-5">
                <TrendingUp size={24} className="text-coral-500" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight text-navy-900 mb-2">No deals yet</h2>
              <p className="text-navy-500 text-sm mb-2 leading-relaxed">
                Add your first deal manually, or send some outreach — positive replies get flagged automatically in your inbox.
              </p>
              <button
                onClick={() => setEditing("new")}
                className="btn-primary mt-4"
              >
                <Plus size={15} /> Add Deal
              </button>
            </div>
          </div>
        ) : (
          <div className="flex gap-5 h-full" style={{ minWidth: "max-content" }}>
            {STAGES.map(stage => {
              const stageDeals = deals.filter(d => d.status === stage.key);
              const isOver = dragOver === stage.key;

              return (
                <div
                  key={stage.key}
                  className={`flex flex-col rounded-2xl transition-all duration-200 ${isOver ? "bg-black/[0.03]" : "bg-transparent"}`}
                  style={{
                    width: 256,
                    minWidth: 256,
                    boxShadow: isOver ? `inset 0 0 0 1.5px ${stage.accent}55` : undefined,
                  }}
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
                  {/* Column header — quiet dot + tinted count pill */}
                  <div className="flex items-center gap-2 px-2.5 py-2.5 flex-shrink-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: stage.accent }}
                    />
                    <span className="text-[13px] font-semibold tracking-[-0.01em] text-navy-900">
                      {stage.label}
                    </span>
                    <span
                      className="ml-auto text-[11px] font-semibold tabular-nums rounded-full px-2 py-0.5"
                      style={{ background: `${stage.accent}14`, color: stage.accent }}
                    >
                      {stageDeals.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="flex-1 min-h-0 overflow-y-auto px-1.5 pt-1 pb-4 space-y-3 scrollbar-thin">
                    {stageDeals.length === 0 && (
                      <div className="border border-dashed border-black/[0.08] rounded-2xl h-16 flex items-center justify-center">
                        <p className="text-[11px] font-medium text-navy-300">Drop here</p>
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
                        onClick={() => router.push(`/pipeline/${deal.id}`)}
                        className="card-hover bg-white rounded-2xl p-4 border border-black/[0.05] shadow-[0_2px_12px_rgba(0,0,0,0.05),0_1px_3px_rgba(0,0,0,0.03)] cursor-pointer active:opacity-60 active:scale-[0.98] select-none"
                      >
                        <div className="flex items-start gap-2.5 mb-2.5">
                          <BrandLogo
                            name={deal.company || deal.contactName}
                            domain={brandOptions.find(b => b.name === deal.company)?.domain ?? extraDomains[deal.company]}
                            size={30}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-navy-900 text-sm tracking-[-0.01em] leading-tight truncate">{deal.company || deal.contactName}</p>
                            <p className="text-xs text-navy-500 truncate mt-0.5">{deal.contactName}</p>
                          </div>
                        </div>

                        {deal.value && (
                          <p className="text-[13px] font-semibold text-[#059669] tabular-nums mb-2">
                            {deal.value}
                          </p>
                        )}

                        {deal.notes && (
                          <p className="text-xs text-navy-400 leading-relaxed line-clamp-2 mb-2.5">{deal.notes}</p>
                        )}

                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-black/[0.05]">
                          <button
                            onClick={(e) => { e.stopPropagation(); setEditing(deal); }}
                            className="p-1.5 hover:bg-black/[0.04] rounded-full transition-all duration-200"
                            title="Edit"
                          >
                            <Pencil size={12} className="text-navy-400" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDelete(deal.id); }}
                            className="p-1.5 hover:bg-red-50 rounded-full transition-all duration-200"
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
          brandOptions={brandOptions}
          onPickBrand={handlePickBrand}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
