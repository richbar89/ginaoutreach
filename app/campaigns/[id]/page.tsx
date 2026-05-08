"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, CheckCircle, Users, Loader2,
  Pause, Play, Rocket, Clock, MessageSquare, AlertCircle,
  RefreshCw, BarChart2, Settings2, Send,
} from "lucide-react";
import InitialsAvatar from "@/components/InitialsAvatar";
import { useDb } from "@/lib/useDb";
import { dbGetCampaigns, dbUpdateCampaignStatus } from "@/lib/db";
import type { Campaign } from "@/lib/types";

type SequenceContact = {
  id: string;
  contact_email: string;
  contact_name: string | null;
  contact_company: string | null;
  contact_position: string | null;
  current_step: number;
  next_send_at: string;
  status: "active" | "completed" | "replied" | "error";
};

type Tab = "overview" | "contacts" | "settings";

function contactLabel(sc: SequenceContact): { label: string; color: string } {
  if (sc.status === "replied") return { label: "Replied", color: "text-indigo-600" };
  if (sc.status === "completed") return { label: "Complete", color: "text-emerald-600" };
  if (sc.status === "error") return { label: "Error", color: "text-red-500" };
  if (sc.current_step === 1) {
    const due = new Date(sc.next_send_at);
    if (due <= new Date()) return { label: "Sending soon…", color: "text-amber-600" };
    return {
      label: `Scheduled ${due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} ${due.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`,
      color: "text-navy-500",
    };
  }
  const due = new Date(sc.next_send_at);
  return {
    label: `Follow-up ${sc.current_step - 1} due ${due.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
    color: "text-navy-500",
  };
}

const STATUS_PILL: Record<string, string> = {
  draft: "bg-cream-100 text-navy-500 border-cream-200",
  active: "bg-emerald-50 text-emerald-700 border-emerald-200",
  paused: "bg-amber-50 text-amber-700 border-amber-200",
  completed: "bg-indigo-50 text-indigo-700 border-indigo-200",
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const getDb = useDb();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sequenceContacts, setSequenceContacts] = useState<SequenceContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [launching, setLaunching] = useState(false);
  const [togglingStatus, setTogglingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const loadData = useCallback(async () => {
    const db = await getDb();
    const campaigns = await dbGetCampaigns(db);
    const found = campaigns.find((c) => c.id === id);
    if (!found) { router.push("/campaigns"); return; }
    setCampaign(found);

    const { data } = await db
      .from("sequence_contacts")
      .select("id, contact_email, contact_name, contact_company, contact_position, current_step, next_send_at, status")
      .eq("campaign_id", id)
      .order("next_send_at", { ascending: true });

    setSequenceContacts((data as SequenceContact[]) || []);
    setLoading(false);
  }, [id, router, getDb]);

  useEffect(() => { loadData(); }, [loadData]);

  const launch = async () => {
    if (!campaign) return;
    setLaunching(true);
    try {
      const res = await fetch(`/api/campaigns/${id}/launch`, { method: "POST" });
      if (!res.ok) { const err = await res.json(); alert(err.error || "Launch failed"); return; }
      await loadData();
      setActiveTab("contacts");
    } finally {
      setLaunching(false);
    }
  };

  const togglePause = async () => {
    if (!campaign) return;
    setTogglingStatus(true);
    try {
      const newStatus = campaign.status === "active" ? "paused" : "active";
      const db = await getDb();
      await dbUpdateCampaignStatus(db, id, newStatus);
      setCampaign(c => c ? { ...c, status: newStatus } : c);
    } finally {
      setTogglingStatus(false);
    }
  };

  if (loading) {
    return <div className="p-8 flex items-center justify-center min-h-64"><Loader2 size={24} className="animate-spin text-navy-400" /></div>;
  }
  if (!campaign) return null;

  const isDraft = !campaign.status || campaign.status === "draft";
  const isActive = campaign.status === "active";
  const isPaused = campaign.status === "paused";

  const total = sequenceContacts.length;
  const pending = sequenceContacts.filter(sc => sc.status === "active" && sc.current_step === 1).length;
  const inSeq = sequenceContacts.filter(sc => sc.status === "active" && sc.current_step > 1).length;
  const completed = sequenceContacts.filter(sc => sc.status === "completed").length;
  const replied = sequenceContacts.filter(sc => sc.status === "replied").length;
  const errors = sequenceContacts.filter(sc => sc.status === "error").length;
  const sent = inSeq + completed + replied + errors;
  const pct = total > 0 ? Math.round((sent / total) * 100) : 0;

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: "overview", label: "Overview", icon: <BarChart2 size={13} /> },
    { key: "contacts", label: `Contacts${total > 0 ? ` (${total})` : ""}`, icon: <Users size={13} /> },
    { key: "settings", label: "Settings", icon: <Settings2 size={13} /> },
  ];

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <Link href="/campaigns" className="inline-flex items-center gap-1.5 text-sm text-navy-400 hover:text-navy-800 mb-5 transition-colors">
          <ArrowLeft size={14} />Back to campaigns
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-coral-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">Campaign</span>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${STATUS_PILL[campaign.status ?? "draft"]}`}>
                {(campaign.status ?? "draft").charAt(0).toUpperCase() + (campaign.status ?? "draft").slice(1)}
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-navy-900">{campaign.name}</h1>
            <p className="text-navy-400 text-sm mt-1">
              {campaign.contacts.length} recipient{campaign.contacts.length !== 1 ? "s" : ""} ·{" "}
              {1 + (campaign.steps?.filter(s => s.body?.trim()).length ?? 0)} email{(campaign.steps?.filter(s => s.body?.trim()).length ?? 0) > 0 ? "s in sequence" : ""}
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {isDraft && (
              <button onClick={launch} disabled={launching} className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
                {launching ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
                {launching ? "Launching…" : "Launch campaign"}
              </button>
            )}
            {(isActive || isPaused) && (
              <>
                <button onClick={loadData} className="p-2 text-navy-400 hover:text-navy-700 hover:bg-cream-100 rounded-lg transition-colors" title="Refresh"><RefreshCw size={15} /></button>
                <button onClick={togglePause} disabled={togglingStatus} className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border transition-colors ${isActive ? "bg-amber-50 hover:bg-amber-100 text-amber-700 border-amber-200" : "bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200"}`}>
                  {isActive ? <Pause size={14} /> : <Play size={14} />}
                  {isActive ? "Pause" : "Resume"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-0.5 border-b border-cream-200 mb-6">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors -mb-px ${
              activeTab === t.key
                ? "border-coral-500 text-coral-600"
                : "border-transparent text-navy-400 hover:text-navy-700"
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* ── Overview tab ── */}
      {activeTab === "overview" && (
        <div className="space-y-5">
          {isDraft ? (
            <div className="bg-white border border-cream-200 rounded-2xl p-10 text-center shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-coral-50 border border-coral-100 flex items-center justify-center mx-auto mb-4">
                <Rocket size={22} className="text-coral-500" />
              </div>
              <h3 className="text-base font-bold text-navy-900 mb-1">Ready to launch</h3>
              <p className="text-sm text-navy-400 mb-1">{campaign.contacts.length} contacts will be enrolled and emails sent automatically.</p>
              <p className="text-xs text-navy-400">
                <strong>{campaign.emailsPerDay ?? 25}/day</strong> · {campaign.delayMinMins ?? 3}–{campaign.delayMaxMins ?? 10} min gaps · {campaign.sendWindowStart ?? 8}:00–{campaign.sendWindowEnd ?? 18}:00 · {(campaign.sendDays ?? ["Mon","Tue","Wed","Thu","Fri"]).join(", ")}
              </p>
              <button onClick={launch} disabled={launching} className="mt-5 inline-flex items-center gap-2 px-6 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors">
                {launching ? <Loader2 size={15} className="animate-spin" /> : <Rocket size={15} />}
                {launching ? "Launching…" : "Launch campaign"}
              </button>
            </div>
          ) : (
            <>
              {/* Progress bar */}
              {total > 0 && (
                <div className="bg-white border border-cream-200 rounded-2xl px-6 py-5 shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm font-bold text-navy-800">Sequence progress</p>
                      <p className="text-xs text-navy-400 mt-0.5">{sent} of {total} contacts sent the initial email</p>
                    </div>
                    <span className="text-2xl font-bold text-navy-900">{pct}%</span>
                  </div>
                  <div className="h-2 bg-cream-200 rounded-full overflow-hidden">
                    <div className="h-full bg-coral-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                  {isPaused && (
                    <p className="text-xs text-amber-600 font-medium mt-3 flex items-center gap-1.5">
                      <Pause size={11} />Campaign paused — no emails sending until resumed.
                    </p>
                  )}
                </div>
              )}

              {/* Stat cards */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Total enrolled", value: total, icon: Users, color: "text-navy-600", bg: "bg-navy-50" },
                  { label: "Pending send", value: pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                  { label: "Replied", value: replied, icon: MessageSquare, color: "text-indigo-600", bg: "bg-indigo-50" },
                  { label: "Completed", value: completed, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                  <div key={label} className="bg-white border border-cream-200 rounded-2xl px-5 py-5 shadow-sm">
                    <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mb-3`}>
                      <Icon size={15} className={color} />
                    </div>
                    <p className="text-2xl font-bold text-navy-900">{value}</p>
                    <p className="text-xs text-navy-400 font-medium mt-0.5">{label}</p>
                  </div>
                ))}
              </div>

              {/* Send rate info */}
              {inSeq > 0 && (
                <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <Send size={15} className="text-blue-500 flex-shrink-0" />
                  <p className="text-sm text-blue-700">
                    <strong>{inSeq}</strong> contact{inSeq !== 1 ? "s" : ""} received the initial email and {inSeq !== 1 ? "are" : "is"} waiting for follow-up step{(campaign.steps?.length ?? 0) > 1 ? "s" : ""}.
                  </p>
                </div>
              )}
              {errors > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 flex items-center gap-3">
                  <AlertCircle size={15} className="text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-700"><strong>{errors}</strong> contact{errors !== 1 ? "s" : ""} failed to send. Check your Gmail credentials in Settings.</p>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ── Contacts tab ── */}
      {activeTab === "contacts" && (
        <div className="space-y-4">
          {sequenceContacts.length === 0 ? (
            <div className="bg-white border border-cream-200 rounded-2xl px-6 py-12 text-center shadow-sm">
              <Users size={24} className="text-navy-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-navy-600 mb-1">No contacts enrolled yet</p>
              <p className="text-xs text-navy-400">Launch the campaign to start enrolling contacts.</p>
            </div>
          ) : (
            <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-cream-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users size={15} className="text-navy-400" />
                  <span className="text-sm font-semibold text-navy-700">{total} enrolled</span>
                </div>
                {isPaused && (
                  <span className="text-xs text-amber-600 font-medium bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full">Paused</span>
                )}
              </div>
              <div className="divide-y divide-cream-100">
                {sequenceContacts.map((sc) => {
                  const { label, color } = contactLabel(sc);
                  return (
                    <div key={sc.id} className="flex items-center gap-4 px-6 py-3.5">
                      <InitialsAvatar name={sc.contact_name || sc.contact_email} email={sc.contact_email} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-900">{sc.contact_name || sc.contact_email}</p>
                        {sc.contact_name && <p className="text-xs text-navy-400">{sc.contact_email}</p>}
                        {(sc.contact_position || sc.contact_company) && (
                          <p className="text-xs text-navy-400 mt-0.5">{[sc.contact_position, sc.contact_company].filter(Boolean).join(" · ")}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {sc.status === "replied" && <MessageSquare size={12} className="text-indigo-500" />}
                        {sc.status === "completed" && <CheckCircle size={12} className="text-emerald-500" />}
                        {sc.status === "error" && <AlertCircle size={12} className="text-red-400" />}
                        {sc.status === "active" && <Clock size={12} className="text-navy-300" />}
                        <span className={`text-xs font-medium ${color}`}>{label}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Settings tab ── */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-cream-100">
              <h3 className="text-sm font-semibold text-navy-700">Email sequence</h3>
            </div>
            <div className="divide-y divide-cream-100">
              <div className="px-6 py-4">
                <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-1">Subject</p>
                <p className="text-sm font-medium text-navy-800">{campaign.subject}</p>
              </div>
              {(campaign.steps ?? []).filter(s => s.body?.trim()).map((s, i) => (
                <div key={i} className="px-6 py-4">
                  <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-1">Follow-up {i + 1} · +{s.delay_days} days</p>
                  <p className="text-sm font-medium text-navy-800">{s.subject || `Re: ${campaign.subject}`}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-cream-100">
              <h3 className="text-sm font-semibold text-navy-700">Cadence settings</h3>
            </div>
            <div className="px-6 py-5 grid grid-cols-2 gap-x-8 gap-y-3">
              {[
                ["Emails per day", `${campaign.emailsPerDay ?? 25}`],
                ["Delay range", `${campaign.delayMinMins ?? 3}–${campaign.delayMaxMins ?? 10} mins`],
                ["Send window", `${campaign.sendWindowStart ?? 8}:00 – ${campaign.sendWindowEnd ?? 18}:00`],
                ["Send days", (campaign.sendDays ?? ["Mon","Tue","Wed","Thu","Fri"]).join(", ")],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-sm text-navy-400">{label}</span>
                  <span className="text-sm font-semibold text-navy-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
