"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Trash2, Check, Loader2, Mail, Clock } from "lucide-react";
import { useAuth } from "@clerk/nextjs";
import { useDb } from "@/lib/useDb";
import { dbGetDeals, dbUpsertDeal, dbDeleteDeal, dbGetContactEmailLog, dbGetBrands, dbGetCampaigns } from "@/lib/db";
import BrandLogo from "@/components/BrandLogo";
import type { Deal, EmailRecord, DealStatus, Campaign } from "@/lib/types";

const STAGES: { key: DealStatus; label: string; accent: string }[] = [
  { key: "pitched",     label: "Pitched",     accent: "#6E6E73" },
  { key: "replied",     label: "Replied",     accent: "#3B82F6" },
  { key: "negotiating", label: "Negotiating", accent: "#F59E0B" },
  { key: "contracted",  label: "Contracted",  accent: "#8B5CF6" },
  { key: "delivered",   label: "Delivered",   accent: "#06B6D4" },
  { key: "paid",        label: "Paid",        accent: "#10B981" },
];

type SeqRow = {
  id: string;
  campaign_id: string;
  status: string;
  current_step: number;
  next_send_at: string | null;
  created_at: string;
};

const SEQ_STATUS_STYLE: Record<string, { label: string; cls: string }> = {
  active:     { label: "In sequence",  cls: "bg-blue-50 text-blue-600" },
  sending:    { label: "Sending now",  cls: "bg-blue-50 text-blue-600" },
  completed:  { label: "Sequence finished", cls: "bg-cream-100 text-navy-500" },
  replied:    { label: "Replied",      cls: "bg-emerald-50 text-emerald-600" },
  suppressed: { label: "Opted out",    cls: "bg-red-50 text-red-600" },
  error:      { label: "Send error",   cls: "bg-red-50 text-red-600" },
};

function fmtDate(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default function DealProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const getDb = useDb();
  const { userId } = useAuth();

  const [deal, setDeal] = useState<Deal | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [sequences, setSequences] = useState<SeqRow[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [domain, setDomain] = useState<string | undefined>(undefined);
  const [expandedEmail, setExpandedEmail] = useState<string | null>(null);

  // Notes autosave
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const notesTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dealRef = useRef<Deal | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const db = await getDb();
        const all = await dbGetDeals(db);
        const found = all.find(d => d.id === id) ?? null;
        if (!found) { setNotFound(true); setLoading(false); return; }
        setDeal(found);
        dealRef.current = found;
        setNotes(found.notes ?? "");

        const [log, brandsData, camps] = await Promise.all([
          dbGetContactEmailLog(db, found.contactEmail),
          userId ? dbGetBrands(db, userId) : Promise.resolve([]),
          dbGetCampaigns(db).catch(() => [] as Campaign[]),
        ]);
        setEmails(log);
        setCampaigns(camps);

        // Brand domain for the logo — brands table, then the shared cache
        const fromBrands = brandsData.find(b => b.name === found.company)?.domain;
        let cached: string | undefined;
        try { cached = JSON.parse(localStorage.getItem("dashboard_brand_domains") ?? "{}")[found.company]; } catch {}
        setDomain(fromBrands ?? cached);

        const { data: seq } = await db
          .from("sequence_contacts")
          .select("id, campaign_id, status, current_step, next_send_at, created_at")
          .ilike("contact_email", found.contactEmail.toLowerCase())
          .order("created_at", { ascending: false });
        setSequences((seq as SeqRow[]) ?? []);
      } catch {
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const persistDeal = useCallback(async (patch: Partial<Deal>) => {
    const current = dealRef.current;
    if (!current || !userId) return;
    const next = { ...current, ...patch };
    dealRef.current = next;
    setDeal(next);
    const db = await getDb();
    await dbUpsertDeal(db, next, userId);
  }, [getDb, userId]);

  const handleNotesChange = (value: string) => {
    setNotes(value);
    setNotesSaved(false);
    if (notesTimer.current) clearTimeout(notesTimer.current);
    notesTimer.current = setTimeout(async () => {
      setSavingNotes(true);
      try {
        await persistDeal({ notes: value });
        setNotesSaved(true);
        setTimeout(() => setNotesSaved(false), 2000);
      } finally {
        setSavingNotes(false);
      }
    }, 800);
  };

  const handleDelete = async () => {
    if (!deal) return;
    if (!confirm(`Remove the ${deal.company || deal.contactName} deal?`)) return;
    const db = await getDb();
    await dbDeleteDeal(db, deal.id);
    router.push("/pipeline");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-navy-400 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (notFound || !deal) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center">
        <p className="text-sm font-semibold text-navy-700 mb-2">Deal not found</p>
        <Link href="/pipeline" className="text-xs font-semibold text-coral-600 hover:text-coral-700">← Back to Pipeline</Link>
      </div>
    );
  }

  const stage = STAGES.find(s => s.key === deal.status);

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/pipeline" className="inline-flex items-center gap-2 text-sm text-navy-500 hover:text-navy-900 transition-colors mb-6">
        <ArrowLeft size={15} /> Pipeline
      </Link>

      {/* Header */}
      <div className="card p-6 mb-5">
        <div className="flex items-start gap-4">
          <BrandLogo name={deal.company || deal.contactName} domain={domain} size={48} />
          <div className="flex-1 min-w-0">
            <h1 className="text-[24px] font-bold tracking-[-0.02em] text-navy-900 leading-tight truncate">
              {deal.company || deal.contactName}
            </h1>
            <p className="text-sm text-navy-500 mt-0.5 truncate">
              {deal.contactName}{deal.contactEmail ? ` · ${deal.contactEmail}` : ""}
            </p>
            <p className="text-[11px] text-navy-300 mt-1.5">Deal opened {fmtDate(deal.createdAt)}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {deal.contactEmail && (
              <Link
                href={`/send?to=${encodeURIComponent(deal.contactEmail)}&name=${encodeURIComponent(deal.contactName)}`}
                className="btn-primary !px-4 !py-2 !text-[13px]"
              >
                <Send size={13} /> Email
              </Link>
            )}
            <button onClick={handleDelete} className="p-2 text-navy-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200" title="Remove deal">
              <Trash2 size={15} />
            </button>
          </div>
        </div>

        {/* Stage + value */}
        <div className="flex items-center gap-4 mt-6 pt-5 border-t border-black/[0.05]">
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-navy-400 uppercase tracking-[0.08em] mb-1.5">Stage</label>
            <select
              value={deal.status}
              onChange={e => persistDeal({ status: e.target.value as DealStatus })}
              className="input-base !w-auto pr-8 font-medium"
              style={{ color: stage?.accent }}
            >
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-[11px] font-semibold text-navy-400 uppercase tracking-[0.08em] mb-1.5">Deal value</label>
            <input
              defaultValue={deal.value ?? ""}
              placeholder="£500"
              onBlur={e => { if (e.target.value !== (deal.value ?? "")) persistDeal({ value: e.target.value }); }}
              className="input-base !w-32 tabular-nums"
            />
          </div>
        </div>
      </div>

      {/* Sequence status */}
      {sequences.length > 0 && (
        <div className="card mb-5 overflow-hidden">
          <div className="px-6 py-4 border-b border-cream-100">
            <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-navy-900">Campaign activity</h3>
          </div>
          <div className="divide-y divide-cream-50">
            {sequences.map(seq => {
              const style = SEQ_STATUS_STYLE[seq.status] ?? { label: seq.status, cls: "bg-cream-100 text-navy-500" };
              const campaignName = campaigns.find(c => c.id === seq.campaign_id)?.name || "Campaign";
              return (
                <div key={seq.id} className="flex items-center gap-3 px-6 py-3.5">
                  <Clock size={14} className="text-navy-300 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-navy-900 truncate">{campaignName}</p>
                    <p className="text-xs text-navy-400 mt-0.5">
                      Enrolled {fmtDate(seq.created_at)}
                      {seq.status === "active" && seq.next_send_at && ` · next email ${fmtDateTime(seq.next_send_at)}`}
                    </p>
                  </div>
                  <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${style.cls}`}>
                    {style.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      <div className="card mb-5 overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-100 flex items-center justify-between">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-navy-900">Notes</h3>
          <span className="text-[11px] font-medium text-navy-300">
            {savingNotes ? "Saving…" : notesSaved ? (
              <span className="inline-flex items-center gap-1 text-emerald-600"><Check size={11} /> Saved</span>
            ) : "Autosaves"}
          </span>
        </div>
        <div className="p-4">
          <textarea
            value={notes}
            onChange={e => handleNotesChange(e.target.value)}
            placeholder="Rates discussed, deliverables, who said what…"
            rows={4}
            className="input-base resize-none !border-0 !shadow-none !bg-cream-50 leading-relaxed"
          />
        </div>
      </div>

      {/* Email history */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-100 flex items-center gap-2">
          <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-navy-900">Emails sent</h3>
          {emails.length > 0 && (
            <span className="text-[11px] font-semibold text-coral-600 bg-coral-50 px-2 py-0.5 rounded-full">{emails.length}</span>
          )}
        </div>
        {emails.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <Mail size={22} className="text-navy-200 mx-auto mb-2" />
            <p className="text-sm text-navy-500">No emails logged to {deal.contactName || "this contact"} yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-cream-50">
            {emails.map(e => {
              const open = expandedEmail === e.id;
              return (
                <button
                  key={e.id}
                  onClick={() => setExpandedEmail(open ? null : e.id)}
                  className="w-full text-left px-6 py-4 hover:bg-cream-50 transition-colors"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-sm font-medium text-navy-900 truncate">{e.subject || "(no subject)"}</p>
                    <span className="text-[11px] text-navy-400 flex-shrink-0">{fmtDateTime(e.sentAt)}</span>
                  </div>
                  <p className={`text-xs text-navy-500 mt-1 leading-relaxed ${open ? "whitespace-pre-wrap" : "line-clamp-2"}`}>
                    {e.body}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
