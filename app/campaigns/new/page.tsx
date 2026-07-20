"use client";

import { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Papa from "papaparse";
import {
  Upload, Plus, X, Check, ArrowRight, ArrowLeft,
  Search, FileText, ChevronDown, List, Trash2,
  Calendar, Eye, Pencil, Users, ShieldCheck,
} from "lucide-react";
import InitialsAvatar from "@/components/InitialsAvatar";
import { useDb } from "@/lib/useDb";
import { dbSaveCampaign, dbGetTemplates, dbGetEmailLog } from "@/lib/db";
import type { Contact, EmailTemplate, CampaignStep } from "@/lib/types";

type ContactRow = Contact & { id: string; industry: string | null; category: string | null; subcategory: string | null; subcategories: string[] | null; country: string | null };
type WizardStep = 0 | 1 | 2 | 3; // 0 = name gate
type ContactTab = "contacts" | "csv" | "manual" | "list";

type ContactList = {
  id: string;
  name: string;
  vertical: string | null;
  subcategory: string | null;
  country: string | null;
  query: string | null;
  contact_ids: string[] | null;
};

const MERGE_TAGS = [
  { tag: "{{name}}", label: "Name" },
  { tag: "{{company}}", label: "Company" },
  { tag: "{{position}}", label: "Position" },
];

const ALL_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// A half-written campaign survives refreshes and crashes
const DRAFT_KEY = "collabi_campaign_draft";

function applyMerge(template: string, contact: Contact) {
  const firstName = contact.name?.trim() ? contact.name.trim().split(/\s+/)[0] : "there";
  return template
    .replace(/\{\{name\}\}/g, firstName)
    .replace(/\{\{email\}\}/g, contact.email || "")
    .replace(/\{\{position\}\}/g, contact.position || "")
    .replace(/\{\{company\}\}/g, contact.company?.trim() || "your brand");
}

function TemplatePicker({ templates, onSelect }: { templates: EmailTemplate[]; onSelect: (t: EmailTemplate) => void }) {
  const [open, setOpen] = useState(false);
  if (!templates.length) return null;
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-navy-600 bg-cream-100 hover:bg-cream-200 border border-cream-200 rounded-lg transition-colors"
      >
        <FileText size={11} />
        Template
        <ChevronDown size={10} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-cream-200 rounded-2xl shadow-xl w-72 overflow-hidden">
            <p className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-navy-400 border-b border-cream-100">Saved templates</p>
            <div className="max-h-64 overflow-y-auto">
              {templates.map(t => (
                <button key={t.id} type="button" onClick={() => { onSelect(t); setOpen(false); }} className="w-full text-left px-4 py-3 hover:bg-cream-50 border-b border-cream-50 transition-colors">
                  <p className="text-sm font-semibold text-navy-900 truncate">{t.name}</p>
                  <p className="text-xs text-navy-400 truncate mt-0.5">{t.subject}</p>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function NewCampaignPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const getDb = useDb();
  const { userId } = useAuth();
  const [step, setStep] = useState<WizardStep>(0);
  const [tab, setTab] = useState<ContactTab>("contacts");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Step 2 — sequence editor
  const [selectedStep, setSelectedStep] = useState<number>(-1); // -1 = initial email
  const [previewMode, setPreviewMode] = useState(false);

  // Contacts
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [allLeads, setAllLeads] = useState<ContactRow[]>([]);
  const [csvError, setCsvError] = useState("");
  const [manual, setManual] = useState({ name: "", email: "", position: "", company: "" });
  const [contactSearch, setContactSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [recentMap, setRecentMap] = useState<Map<string, number>>(new Map()); // email → days since last send (≤28)
  const [inSequenceSet, setInSequenceSet] = useState<Set<string>>(new Set()); // currently in an active sequence

  // Saved lists
  const [lists, setLists] = useState<ContactList[]>([]);
  const [activeList, setActiveList] = useState<ContactList | null>(null);
  const [listContacts, setListContacts] = useState<ContactRow[]>([]);
  const [listSelectedIds, setListSelectedIds] = useState<Set<string>>(new Set());

  // Compose
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [steps, setSteps] = useState<CampaignStep[]>([]);

  // Cadence — fixed sending policy: 30/day max, auto-staggered 2-5 mins
  const emailsPerDay = 30;
  const delayMinMins = 2;
  const delayMaxMins = 5;
  const [sendWindowStart, setSendWindowStart] = useState(8);
  const [sendWindowEnd, setSendWindowEnd] = useState(18);
  const [sendDays, setSendDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri"]);

  const addStep = () => setSteps(prev => [...prev, { delay_days: 3, subject: "", body: "" }]);
  const removeStep = (i: number) => {
    setSteps(prev => prev.filter((_, j) => j !== i));
    setSelectedStep(prev => (prev >= i ? Math.max(-1, prev - 1) : prev));
  };
  const updateStep = (i: number, patch: Partial<CampaignStep>) =>
    setSteps(prev => prev.map((s, j) => j === i ? { ...s, ...patch } : s));

  useEffect(() => {
    fetch("/api/contacts").then(r => r.json()).then(data => setAllLeads(Array.isArray(data) ? data : [])).catch(() => {});
    getDb().then(async db => {
      dbGetTemplates(db).then(setTemplates).catch(() => {});
      // Recent sends (any sequence step counts) — flag re-pitches within 4 weeks
      dbGetEmailLog(db)
        .then(log => {
          const latest = new Map<string, number>();
          const now = Date.now();
          for (const r of log) {
            const email = r.contactEmail.toLowerCase();
            const daysAgo = Math.floor((now - new Date(r.sentAt).getTime()) / 86400000);
            const prev = latest.get(email);
            if (prev === undefined || daysAgo < prev) latest.set(email, daysAgo);
          }
          setRecentMap(new Map([...latest].filter(([, d]) => d <= 28)));
        })
        .catch(() => {});
      // Contacts with follow-ups still queued — the sharper warning
      db.from("sequence_contacts")
        .select("contact_email")
        .eq("status", "active")
        .then(({ data }) => setInSequenceSet(new Set((data ?? []).map((r: { contact_email: string }) => r.contact_email.toLowerCase()))));
    }).catch(() => {});
    fetch("/api/lists").then(r => r.json()).then(data => { if (Array.isArray(data)) setLists(data); }).catch(() => {});
  }, [getDb]);

  useEffect(() => {
    const listId = searchParams.get("listId");
    if (listId && lists.length > 0) { setTab("list"); setPickerOpen(true); }
  }, [searchParams, lists]);

  // Restore an unfinished draft once on mount
  const [draftRestored, setDraftRestored] = useState(false);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (!d?.campaignName && !(d?.contacts?.length) && !d?.body) return;
      setCampaignName(d.campaignName ?? "");
      setContacts(Array.isArray(d.contacts) ? d.contacts : []);
      setSubject(d.subject ?? "");
      setBody(d.body ?? "");
      setSteps(Array.isArray(d.steps) ? d.steps : []);
      if (Array.isArray(d.sendDays) && d.sendDays.length) setSendDays(d.sendDays);
      if (typeof d.sendWindowStart === "number") setSendWindowStart(d.sendWindowStart);
      if (typeof d.sendWindowEnd === "number") setSendWindowEnd(d.sendWindowEnd);
      if (d.step === 1 || d.step === 2 || d.step === 3) setStep(d.step);
      if (d.pickerOpen) setPickerOpen(true);
      setDraftRestored(true);
    } catch { /* corrupt draft — ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Autosave (debounced) whenever the draft has any content
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        if (!campaignName && contacts.length === 0 && !subject && !body && steps.length === 0) return;
        localStorage.setItem(DRAFT_KEY, JSON.stringify({
          campaignName, contacts, subject, body, steps,
          sendDays, sendWindowStart, sendWindowEnd, step, pickerOpen,
        }));
      } catch { /* storage full — non-fatal */ }
    }, 400);
    return () => clearTimeout(t);
  }, [campaignName, contacts, subject, body, steps, sendDays, sendWindowStart, sendWindowEnd, step, pickerOpen]);

  const discardDraft = () => {
    localStorage.removeItem(DRAFT_KEY);
    window.location.href = "/campaigns/new";
  };

  const filterByList = (list: ContactList, leads: ContactRow[]) => {
    if (list.contact_ids && list.contact_ids.length > 0) {
      const ids = new Set(list.contact_ids.map(e => e.toLowerCase()));
      return leads.filter(c => ids.has(c.email.toLowerCase()));
    }
    let result = leads;
    if (list.vertical) {
      const v = list.vertical.toLowerCase();
      result = result.filter(c => (c.category ?? "").toLowerCase().includes(v) || (c.industry ?? "").toLowerCase().includes(v));
    }
    if (list.subcategory) {
      const sub = list.subcategory;
      result = result.filter(c => c.subcategory === sub || c.category === sub || (c.subcategories ?? []).includes(sub));
    }
    if (list.country) result = result.filter(c => c.country === list.country);
    if (list.query?.trim()) {
      const q = list.query.toLowerCase();
      result = result.filter(c => (c.name ?? "").toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company ?? "").toLowerCase().includes(q));
    }
    return result;
  };

  const openList = (list: ContactList) => {
    const filtered = filterByList(list, allLeads);
    setActiveList(list);
    setListContacts(filtered);
    setListSelectedIds(new Set(filtered.map(c => c.email)));
  };

  const addFromList = () => {
    const toAdd = listContacts.filter(c => listSelectedIds.has(c.email)).map(c => ({ name: c.name ?? "", email: c.email, position: c.position ?? "", company: c.company ?? "" }));
    addContacts(toAdd);
    setActiveList(null);
    setListContacts([]);
    setListSelectedIds(new Set());
  };

  const toggleListContact = (email: string) => {
    setListSelectedIds(prev => { const next = new Set(prev); next.has(email) ? next.delete(email) : next.add(email); return next; });
  };

  const industries = useMemo(() => {
    const set = new Set(allLeads.map(l => l.industry).filter((i): i is string => Boolean(i)));
    return ["All", ...Array.from(set).sort()];
  }, [allLeads]);

  const filteredLeads = useMemo(() => {
    let r = allLeads;
    if (industryFilter !== "All") r = r.filter(c => c.industry === industryFilter);
    if (contactSearch.trim()) {
      const q = contactSearch.toLowerCase();
      r = r.filter(c => (c.name ?? "").toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || (c.company ?? "").toLowerCase().includes(q));
    }
    return r;
  }, [allLeads, contactSearch, industryFilter]);

  const addContacts = (newOnes: Contact[]) => {
    setContacts(prev => {
      const existing = new Set(prev.map(c => c.email.toLowerCase()));
      return [...prev, ...newOnes.filter(c => !existing.has(c.email.toLowerCase()))];
    });
  };

  const parseCSV = useCallback((file: File) => {
    setCsvError("");
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const parsed: Contact[] = rows.map(row => {
          const find = (keys: string[]) => keys.map(k => row[k]).find(Boolean) || "";
          return { email: find(["email", "Email", "EMAIL"]), name: find(["name", "Name", "full_name", "Full Name"]), position: find(["position", "Position", "job_title", "title"]), company: find(["company", "Company", "organisation", "organization"]) };
        }).filter(c => c.email);
        if (!parsed.length) { setCsvError("No valid email addresses found."); return; }
        addContacts(parsed);
        setTab("contacts");
      },
      error: err => setCsvError(err.message),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addManual = () => {
    if (!manual.email) return;
    addContacts([{ ...manual }]);
    setManual({ name: "", email: "", position: "", company: "" });
  };

  const addFromSelected = () => {
    const toAdd = allLeads.filter(c => selectedIds.has(c.email)).map(({ name, email, position, company }) => ({ name: name ?? "", email, position: position ?? "", company: company ?? "" }));
    addContacts(toAdd);
    setSelectedIds(new Set());
  };

  const loadTemplate = (t: EmailTemplate) => { setSubject(t.subject); setBody(t.body); };

  const insertMergeTag = (tag: string) => {
    if (selectedStep === -1) setBody(prev => prev + tag);
    else if (steps[selectedStep]) updateStep(selectedStep, { body: (steps[selectedStep].body || "") + tag });
  };

  const toggleDay = (day: string) => setSendDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);

  const saveCampaign = async () => {
    setSaving(true);
    try {
      const campaign = {
        id: crypto.randomUUID(),
        name: campaignName,
        subject,
        body,
        contacts,
        steps: steps.filter(s => s.body.trim()),
        createdAt: new Date().toISOString(),
        status: "draft" as const,
        emailsPerDay,
        delayMinMins,
        delayMaxMins,
        sendWindowStart,
        sendWindowEnd,
        sendDays,
      };
      const db = await getDb();
      await dbSaveCampaign(db, campaign, userId ?? undefined);
      localStorage.removeItem(DRAFT_KEY);
      // The button says Launch — actually launch (enrol + schedule), don't
      // strand the campaign as a draft behind a second launch button.
      try {
        await fetch(`/api/campaigns/${campaign.id}/launch`, { method: "POST" });
      } catch { /* detail page still offers Launch if this failed */ }
      router.push(`/campaigns/${campaign.id}`);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Failed to save campaign — please try again.");
    } finally {
      setSaving(false);
    }
  };

  const tabBtn = (t: ContactTab, label: string, count?: number) => (
    <button onClick={() => setTab(t)} className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${tab === t ? "bg-white text-navy-900 shadow-sm" : "text-navy-500 hover:text-navy-700"}`}>
      {label}
      {count !== undefined && <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === t ? "bg-coral-100 text-coral-600" : "bg-cream-200 text-navy-400"}`}>{count}</span>}
    </button>
  );

  const WIZARD_STEPS = [
    { n: 1 as WizardStep, label: "Audience" },
    { n: 2 as WizardStep, label: "Copy & follow-ups" },
    { n: 3 as WizardStep, label: "Launch" },
  ];

  // Preview helpers
  const previewContact = contacts[0] ?? { name: "Jane Smith", email: "jane@example.com", company: "Acme Co", position: "Marketing Manager" };
  const currentSubject = selectedStep === -1 ? subject : (steps[selectedStep]?.subject || `Re: ${subject}`);
  const currentBody = selectedStep === -1 ? body : (steps[selectedStep]?.body || "");
  const previewSubject = applyMerge(currentSubject, previewContact);
  const previewBody = applyMerge(currentBody, previewContact);

  return (
    <div className={`p-8 mx-auto transition-all ${step === 2 ? "max-w-5xl" : "max-w-3xl"}`}>
      {/* ── Step 0: Name gate — one question, Typeform style ── */}
      {step === 0 && (
        <div className="min-h-[70vh] flex items-center justify-center animate-fade-slide-up">
          <div className="w-full max-w-xl text-center">
            <div className="flex items-center justify-center gap-3 mb-7">
              <div className="h-px w-8 bg-coral-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">New campaign</span>
              <div className="h-px w-8 bg-coral-400" />
            </div>
            <h1 className="text-[34px] font-bold tracking-[-0.03em] text-navy-900 mb-3">
              What shall we call this campaign?
            </h1>
            <p className="text-sm text-navy-400 mb-10">Only you&apos;ll see the name — something like &ldquo;Food brands · July&rdquo; works well.</p>
            <input
              type="text"
              value={campaignName}
              onChange={e => setCampaignName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && campaignName.trim() && setStep(1)}
              placeholder="Campaign name…"
              autoFocus
              className="w-full text-center text-2xl font-semibold tracking-[-0.02em] text-navy-900 bg-transparent border-0 border-b-2 border-cream-300 focus:border-coral-400 focus:outline-none pb-3 placeholder:text-navy-200 transition-colors mb-10"
            />
            <div>
              <button onClick={() => setStep(1)} disabled={!campaignName.trim()} className="btn-primary !px-8 !py-3 disabled:cursor-not-allowed">
                Continue <ArrowRight size={15} />
              </button>
            </div>
            <p className="mt-7"><a href="/campaigns" className="text-xs text-navy-400 hover:text-navy-600 transition-colors">← Back to campaigns</a></p>
          </div>
        </div>
      )}

      {/* Header */}
      {step > 0 && (
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px w-8 bg-coral-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">Campaigns</span>
        </div>
        <input
          type="text"
          value={campaignName}
          onChange={e => setCampaignName(e.target.value)}
          placeholder="Name your campaign…"
          className="font-display text-[32px] font-bold tracking-tight text-navy-900 bg-transparent focus:outline-none placeholder:text-navy-300 w-full mb-1"
        />
        <p className="text-navy-500 text-sm">Choose your audience, write your emails, launch.</p>
      </div>
      )}

      {/* Step indicator */}
      {step > 0 && (
      <div className="flex items-center gap-3 mb-10">
        {WIZARD_STEPS.map(({ n, label }, i) => {
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} className="flex items-center gap-3">
              <button onClick={() => done && setStep(n)} className={`flex items-center gap-2.5 ${done ? "cursor-pointer" : "cursor-default"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200 ${
                  active
                    ? "bg-coral-500 text-white shadow-[0_2px_10px_rgba(232,98,42,0.35)]"
                    : done
                    ? "bg-coral-50 text-coral-600 border border-coral-200"
                    : "bg-white text-navy-400 border border-black/[0.08]"
                }`}>
                  {done ? <Check size={12} strokeWidth={2.5} /> : n}
                </div>
                <span className={`text-xs font-medium transition-colors duration-200 ${active ? "text-navy-900" : done ? "text-coral-600" : "text-navy-400"}`}>{label}</span>
              </button>
              {i < WIZARD_STEPS.length - 1 && <div className={`w-12 h-px transition-colors duration-200 ${step > n ? "bg-coral-200" : "bg-black/[0.08]"}`} />}
            </div>
          );
        })}
      </div>
      )}

      {/* Draft-restored notice */}
      {draftRestored && step > 0 && (
        <div className="flex items-center gap-2 text-xs text-navy-500 -mt-6 mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-coral-400 flex-shrink-0" />
          Draft restored from your last session
          <span className="text-navy-300">·</span>
          <button onClick={discardDraft} className="font-semibold text-coral-600 hover:text-coral-700 transition-colors">
            Start fresh
          </button>
        </div>
      )}

      {/* ── Step 1: Audience ── */}
      {step === 1 && (
        <div className="space-y-4">
          {!pickerOpen ? (
            <div className="animate-fade-slide-up">
              <h2 className="text-[26px] font-bold tracking-[-0.025em] text-navy-900 mb-2">Who do you want in this campaign?</h2>
              <p className="text-sm text-navy-400 mb-8">Pick a saved list, or choose people from your contacts.</p>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <button onClick={() => { setTab("list"); setPickerOpen(true); }} className="card card-hover p-6 text-left">
                  <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center mb-4"><List size={18} className="text-coral-500" /></div>
                  <p className="text-[15px] font-semibold tracking-[-0.01em] text-navy-900 mb-1">Use a saved list</p>
                  <p className="text-xs text-navy-400">{lists.length > 0 ? `${lists.length} list${lists.length !== 1 ? "s" : ""} ready to go` : "Build lists from the Contacts page"}</p>
                </button>
                <button onClick={() => { setTab("contacts"); setPickerOpen(true); }} className="card card-hover p-6 text-left">
                  <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center mb-4"><Users size={18} className="text-coral-500" /></div>
                  <p className="text-[15px] font-semibold tracking-[-0.01em] text-navy-900 mb-1">Add contacts</p>
                  <p className="text-xs text-navy-400">Browse, filter and tick from {allLeads.length.toLocaleString()} contacts</p>
                </button>
              </div>
              <div className="flex items-center gap-2 text-xs text-navy-400">
                or
                <button onClick={() => { setTab("csv"); setPickerOpen(true); }} className="font-semibold text-navy-500 hover:text-coral-600 transition-colors">import a CSV</button>
                ·
                <button onClick={() => { setTab("manual"); setPickerOpen(true); }} className="font-semibold text-navy-500 hover:text-coral-600 transition-colors">add manually</button>
              </div>
            </div>
          ) : (
          <div className="bg-cream-100 rounded-xl p-1 flex gap-1">
            {tabBtn("contacts", "From Contacts", allLeads.length)}
            {tabBtn("list", "From a List", lists.length || undefined)}
            {tabBtn("csv", "Upload CSV")}
            {tabBtn("manual", "Add manually")}
          </div>
          )}

          {pickerOpen && tab === "contacts" && (
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-cream-100 flex gap-2">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input type="text" placeholder="Search contacts…" value={contactSearch} onChange={e => setContactSearch(e.target.value)} className="w-full pl-8 pr-3 py-2 bg-cream-50 border border-cream-200 rounded-lg text-sm placeholder:text-navy-300 focus:outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100" />
                </div>
                <select value={industryFilter} onChange={e => setIndustryFilter(e.target.value)} className="px-3 py-2 bg-cream-50 border border-cream-200 rounded-lg text-xs text-navy-700 focus:outline-none focus:border-coral-300">
                  {industries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-cream-50">
                {filteredLeads.length === 0 ? (
                  <div className="py-10 text-center text-sm text-navy-400">No contacts found</div>
                ) : filteredLeads.map(c => {
                  const isAdded = contacts.some(x => x.email.toLowerCase() === c.email.toLowerCase());
                  const isSelected = selectedIds.has(c.email);
                  return (
                    <label key={c.email} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${isAdded ? "opacity-40 cursor-not-allowed" : "hover:bg-cream-50"}`}>
                      <input type="checkbox" disabled={isAdded} checked={isSelected || isAdded} onChange={e => { setSelectedIds(prev => { const next = new Set(prev); if (e.target.checked) next.add(c.email); else next.delete(c.email); return next; }); }} className="rounded border-cream-300 text-coral-500 focus:ring-coral-300" />
                      <InitialsAvatar name={c.name} email={c.email} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-navy-900 truncate">{c.name || c.email}</p>
                        <p className="text-xs text-navy-400 truncate">{[c.company, c.position].filter(Boolean).join(" · ")}</p>
                      </div>
                      {!isAdded && inSequenceSet.has(c.email.toLowerCase()) ? (
                        <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">In active sequence</span>
                      ) : !isAdded && recentMap.has(c.email.toLowerCase()) ? (
                        <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                          Emailed {recentMap.get(c.email.toLowerCase())}d ago
                        </span>
                      ) : null}
                      {isAdded && <span className="text-xs text-navy-300">Added</span>}
                    </label>
                  );
                })}
              </div>
              {selectedIds.size > 0 && (
                <div className="px-4 py-3 border-t border-cream-100 bg-cream-50 flex items-center justify-between">
                  <span className="text-xs text-navy-500">{selectedIds.size} selected</span>
                  <button onClick={addFromSelected} className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold rounded-full transition-all duration-200"><Plus size={12} />Add to campaign</button>
                </div>
              )}
            </div>
          )}

          {pickerOpen && tab === "list" && (
            <div className="card overflow-hidden">
              {lists.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center mx-auto mb-3"><List size={18} className="text-navy-400" /></div>
                  <p className="text-sm font-semibold text-navy-600 mb-1">No saved lists yet</p>
                  <p className="text-xs text-navy-400 mb-4">Go to Contacts, filter, then click &ldquo;Save as list&rdquo;.</p>
                  <a href="/contacts" className="text-xs font-bold text-coral-600 hover:text-coral-700">Go to Contacts →</a>
                </div>
              ) : activeList ? (
                <>
                  <div className="px-4 py-3 border-b border-cream-100 flex items-center gap-3">
                    <button onClick={() => setActiveList(null)} className="text-navy-400 hover:text-navy-700 text-xs font-semibold">← Lists</button>
                    <span className="text-xs text-navy-300">/</span>
                    <span className="text-xs font-semibold text-navy-700 truncate">{activeList.name}</span>
                    <span className="ml-auto text-xs text-navy-400">{listSelectedIds.size} selected</span>
                  </div>
                  <div className="px-4 py-2 border-b border-cream-50 flex items-center gap-3">
                    <button onClick={() => setListSelectedIds(new Set(listContacts.map(c => c.email)))} className="text-xs font-semibold text-coral-600 hover:text-coral-700">Select all</button>
                    <span className="text-navy-200 text-xs">·</span>
                    <button onClick={() => setListSelectedIds(new Set())} className="text-xs font-semibold text-navy-400 hover:text-navy-600">Clear</button>
                  </div>
                  <div className="max-h-72 overflow-y-auto divide-y divide-cream-50">
                    {listContacts.length === 0 ? <p className="text-xs text-navy-400 text-center py-8">No contacts match this list.</p> : listContacts.map(c => {
                      const checked = listSelectedIds.has(c.email);
                      const alreadyAdded = contacts.some(x => x.email.toLowerCase() === c.email.toLowerCase());
                      return (
                        <label key={c.email} className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${checked ? "bg-coral-50/50" : "hover:bg-cream-50"} ${alreadyAdded ? "opacity-40" : ""}`}>
                          <input type="checkbox" checked={checked} disabled={alreadyAdded} onChange={() => !alreadyAdded && toggleListContact(c.email)} className="accent-coral-500 w-4 h-4 flex-shrink-0" />
                          <InitialsAvatar name={c.name || c.email} email={c.email} size="sm" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-navy-900 truncate">{c.name || c.email}</p>
                            <p className="text-xs text-navy-400 truncate">{c.company || c.email}</p>
                          </div>
                          {!alreadyAdded && inSequenceSet.has(c.email.toLowerCase()) ? (
                            <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full flex-shrink-0">In active sequence</span>
                          ) : !alreadyAdded && recentMap.has(c.email.toLowerCase()) ? (
                            <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full flex-shrink-0">
                              Emailed {recentMap.get(c.email.toLowerCase())}d ago
                            </span>
                          ) : null}
                          {alreadyAdded && <span className="text-[10px] text-emerald-600 font-bold">Added</span>}
                        </label>
                      );
                    })}
                  </div>
                  <div className="px-4 py-3 border-t border-cream-100 flex justify-end">
                    <button onClick={addFromList} disabled={listSelectedIds.size === 0} className="px-5 py-2 bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold rounded-full disabled:opacity-40 transition-all duration-200">
                      Add {listSelectedIds.size} contact{listSelectedIds.size !== 1 ? "s" : ""} →
                    </button>
                  </div>
                </>
              ) : (
                <div className="divide-y divide-cream-100">
                  {lists.map(l => {
                    const desc = l.contact_ids ? `${l.contact_ids.length} contacts · Curated` : [l.vertical, l.subcategory, l.country, l.query ? `"${l.query}"` : null].filter(Boolean).join(" · ") || "All contacts";
                    const count = filterByList(l, allLeads).length;
                    return (
                      <button key={l.id} onClick={() => openList(l)} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-cream-50 transition-colors text-left">
                        <div className="w-9 h-9 rounded-xl bg-coral-50 border border-coral-100 flex items-center justify-center flex-shrink-0"><List size={15} className="text-coral-500" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy-900">{l.name}</p>
                          <p className="text-xs text-navy-400 mt-0.5">{desc}</p>
                        </div>
                        <span className="text-xs text-navy-400 flex-shrink-0">{count} contacts →</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {pickerOpen && tab === "csv" && (
            <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) parseCSV(f); }} className={`bg-white border-2 border-dashed rounded-[20px] p-10 text-center transition-all duration-200 ${dragging ? "border-coral-400 bg-coral-50" : "border-cream-300 hover:border-cream-400"}`}>
              <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center mx-auto mb-3"><Upload size={18} className="text-navy-400" /></div>
              <p className="text-sm font-semibold text-navy-700 mb-1">Drop a CSV here</p>
              <p className="text-xs text-navy-400 mb-4">Columns: <code className="bg-cream-100 px-1 rounded">email</code>, <code className="bg-cream-100 px-1 rounded">name</code>, <code className="bg-cream-100 px-1 rounded">company</code>, <code className="bg-cream-100 px-1 rounded">position</code></p>
              <label className="inline-flex items-center gap-2 px-5 py-2 bg-white border border-black/[0.08] hover:border-coral-300 text-navy-700 hover:text-coral-600 text-sm font-semibold rounded-full cursor-pointer transition-all duration-200 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
                <Upload size={14} />Choose file
                <input type="file" accept=".csv" className="sr-only" onChange={e => { if (e.target.files?.[0]) parseCSV(e.target.files[0]); }} />
              </label>
              {csvError && <p className="mt-3 text-sm text-red-500">{csvError}</p>}
            </div>
          )}

          {pickerOpen && tab === "manual" && (
            <div className="card p-5">
              <div className="grid grid-cols-2 gap-3 mb-3">
                {(["email", "name", "company", "position"] as const).map(field => (
                  <input key={field} type={field === "email" ? "email" : "text"} placeholder={field === "email" ? "Email *" : field.charAt(0).toUpperCase() + field.slice(1)} value={manual[field]} onChange={e => setManual(m => ({ ...m, [field]: e.target.value }))} onKeyDown={e => e.key === "Enter" && addManual()} className="input-base text-sm" />
                ))}
              </div>
              <button onClick={addManual} disabled={!manual.email} className="inline-flex items-center gap-1.5 px-4 py-2 bg-coral-500 hover:bg-coral-600 disabled:opacity-40 text-white text-sm font-semibold rounded-full transition-all duration-200"><Plus size={14} />Add contact</button>
            </div>
          )}

          {contacts.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-5 py-3.5 border-b border-cream-100 flex items-center justify-between">
                <div className="text-[15px] font-semibold tracking-[-0.01em] text-navy-900">{contacts.length} contact{contacts.length !== 1 ? "s" : ""} added</div>
                <button onClick={() => setContacts([])} className="text-xs text-navy-400 hover:text-red-500 transition-colors">Clear all</button>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-cream-50">
                {contacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-cream-50 transition-colors duration-200">
                    <InitialsAvatar name={c.name} email={c.email} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-navy-900 truncate">{c.name || c.email}</p>
                      {c.name && <p className="text-xs text-navy-400 truncate">{c.email}</p>}
                    </div>
                    <button onClick={() => setContacts(prev => prev.filter((_, j) => j !== i))} className="text-navy-300 hover:text-red-400 transition-colors"><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(pickerOpen || contacts.length > 0) && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-navy-400">
                {contacts.length === 0 ? "Tick the people you want, then add them to the campaign." : `${contacts.length} contact${contacts.length !== 1 ? "s" : ""} in this campaign`}
              </span>
              <button onClick={() => setStep(2)} disabled={contacts.length === 0} className="btn-primary disabled:cursor-not-allowed">
                Done — write your email <ArrowRight size={15} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── Step 2: Sequence — two-column editor ── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Two-column editor */}
          <div className="card overflow-hidden flex" style={{ height: "calc(100vh - 310px)", minHeight: 580 }}>

            {/* Left: timeline step list */}
            <div className="w-64 border-r border-cream-100 flex flex-col flex-shrink-0 bg-cream-50/30">
              <div className="px-5 py-4 border-b border-cream-100">
                <p className="text-xs font-bold uppercase tracking-widest text-navy-400">Sequence steps</p>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0">
                {/* Initial email — timeline item */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center w-8 flex-shrink-0">
                    {(() => { const done = Boolean(subject.trim() && body.trim()); return (
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-200 ${selectedStep === -1 ? "bg-coral-500 text-white shadow-[0_2px_10px_rgba(232,98,42,0.35)]" : done ? "bg-coral-50 text-coral-600 border border-coral-200" : "bg-white text-navy-400 border border-black/[0.08]"}`}>
                        {selectedStep !== -1 && done ? <Check size={12} strokeWidth={2.5} /> : "1"}
                      </div>
                    ); })()}
                    {steps.length > 0 && <div className="w-px flex-1 bg-black/[0.08] mt-1 mb-1" style={{ minHeight: 20 }} />}
                  </div>
                  <button
                    onClick={() => { setSelectedStep(-1); setPreviewMode(false); }}
                    className="flex-1 pb-3 text-left group"
                  >
                    <div className={`rounded-xl border bg-white px-3 py-3 transition-all duration-200 ${selectedStep === -1 ? "border-coral-300 ring-2 ring-coral-500/30 shadow-sm" : "border-black/[0.06] hover:bg-cream-50"}`}>
                      <p className={`text-xs font-semibold mb-1 ${selectedStep === -1 ? "text-coral-500" : "text-navy-400"}`}>Day 1 · Initial email</p>
                      <p className="text-sm font-medium text-navy-800 truncate leading-tight">{subject || <span className="text-navy-300 italic font-normal">No subject yet</span>}</p>
                    </div>
                  </button>
                </div>

                {/* Follow-up steps */}
                {steps.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center w-8 flex-shrink-0">
                      {(() => { const done = Boolean(s.body.trim()); return (
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 transition-all duration-200 ${selectedStep === i ? "bg-coral-500 text-white shadow-[0_2px_10px_rgba(232,98,42,0.35)]" : done ? "bg-coral-50 text-coral-600 border border-coral-200" : "bg-white text-navy-400 border border-black/[0.08]"}`}>
                          {selectedStep !== i && done ? <Check size={12} strokeWidth={2.5} /> : i + 2}
                        </div>
                      ); })()}
                      {i < steps.length - 1 && <div className="w-px flex-1 bg-black/[0.08] mt-1 mb-1" style={{ minHeight: 20 }} />}
                    </div>
                    <button
                      onClick={() => { setSelectedStep(i); setPreviewMode(false); }}
                      className="flex-1 pb-3 text-left"
                    >
                      <div className={`rounded-xl border bg-white px-3 py-3 transition-all duration-200 ${selectedStep === i ? "border-coral-300 ring-2 ring-coral-500/30 shadow-sm" : "border-black/[0.06] hover:bg-cream-50"}`}>
                        <p className={`text-xs font-semibold mb-1 ${selectedStep === i ? "text-coral-500" : "text-navy-400"}`}>Day +{s.delay_days} · Follow-up {i + 1}</p>
                        <p className="text-sm font-medium text-navy-800 truncate leading-tight">{s.subject || s.body.slice(0, 40) || <span className="text-navy-300 italic font-normal">Empty</span>}</p>
                      </div>
                    </button>
                  </div>
                ))}

                {/* Add follow-up */}
                <button
                  onClick={() => { addStep(); setSelectedStep(steps.length); setPreviewMode(false); }}
                  className="flex items-center gap-2 text-sm text-navy-400 hover:text-coral-500 transition-colors pt-1 pl-11"
                >
                  <Plus size={14} /> Add follow-up
                </button>
              </div>
            </div>

            {/* Right: editor / preview */}
            <div className="flex-1 flex flex-col min-w-0 bg-white">
              {/* Toolbar */}
              <div className="px-5 py-3 border-b border-cream-100 flex items-center gap-4">
                {selectedStep >= 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-medium text-navy-400 mr-1">Send after</span>
                    {[3, 5, 7, 14].map(d => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => updateStep(selectedStep, { delay_days: d })}
                        className={`px-2.5 py-1 text-xs font-semibold rounded-full transition-all duration-200 ${steps[selectedStep]?.delay_days === d ? "bg-coral-500 text-white" : "bg-cream-100 text-navy-500 hover:bg-cream-200"}`}
                      >
                        {d}d
                      </button>
                    ))}
                    <input
                      type="number" min={1} max={60}
                      value={steps[selectedStep]?.delay_days ?? 3}
                      onChange={e => updateStep(selectedStep, { delay_days: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-12 text-center border border-cream-200 rounded-lg px-1 py-1 text-xs focus:outline-none focus:border-coral-300"
                    />
                    <span className="text-xs text-navy-400">days</span>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-3">
                  <div className="flex items-center gap-0.5 rounded-full bg-cream-100 p-0.5 text-sm font-medium">
                    <button
                      onClick={() => setPreviewMode(false)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-200 ${!previewMode ? "bg-white text-navy-900 shadow-sm" : "text-navy-400 hover:text-navy-700"}`}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => setPreviewMode(true)}
                      className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full transition-all duration-200 ${previewMode ? "bg-white text-navy-900 shadow-sm" : "text-navy-400 hover:text-navy-700"}`}
                    >
                      <Eye size={13} /> Preview
                    </button>
                  </div>
                  {selectedStep >= 0 && (
                    <button onClick={() => removeStep(selectedStep)} className="p-2 text-navy-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>

              {/* Edit mode */}
              {!previewMode && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Subject row */}
                  <div className="flex items-center gap-4 px-6 py-4 border-b border-cream-100">
                    <span className="text-sm font-medium text-navy-400 w-16 flex-shrink-0">Subject</span>
                    <input
                      type="text"
                      value={selectedStep === -1 ? subject : (steps[selectedStep]?.subject || "")}
                      onChange={e => selectedStep === -1 ? setSubject(e.target.value) : updateStep(selectedStep, { subject: e.target.value })}
                      placeholder={selectedStep === -1 ? "Partnership opportunity — {{company}}" : `Re: ${subject || "your original subject"}`}
                      className="flex-1 text-base text-navy-900 placeholder:text-navy-300 focus:outline-none bg-transparent"
                    />
                  </div>

                  {/* Body */}
                  <div className="flex-1 overflow-hidden">
                    <textarea
                      className="w-full h-full resize-none px-6 py-5 text-base text-navy-800 placeholder:text-navy-300 focus:outline-none bg-transparent leading-relaxed"
                      value={selectedStep === -1 ? body : (steps[selectedStep]?.body || "")}
                      onChange={e => selectedStep === -1 ? setBody(e.target.value) : updateStep(selectedStep, { body: e.target.value })}
                      placeholder={selectedStep === -1
                        ? `Hi {{name}},\n\nI came across {{company}} and love what you're building…\n\nBest,\n[Your name]`
                        : `Hi {{name}},\n\nJust following up on my previous email…`
                      }
                    />
                  </div>

                  {/* Bottom bar — merge tags + template */}
                  <div className="px-5 py-3 border-t border-cream-100 flex items-center gap-3 bg-cream-50/40">
                    <span className="text-xs text-navy-400 font-medium">Insert</span>
                    <div className="flex items-center gap-1.5">
                      {MERGE_TAGS.map(({ tag, label }) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => insertMergeTag(tag)}
                          className="px-2.5 py-1 text-xs bg-white hover:bg-coral-50 border border-cream-200 hover:border-coral-200 text-navy-500 hover:text-coral-600 rounded-lg font-mono transition-colors"
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <div className="ml-auto">
                      <TemplatePicker templates={templates} onSelect={loadTemplate} />
                    </div>
                  </div>
                </div>
              )}

              {/* Preview mode */}
              {previewMode && (
                <div className="flex-1 overflow-y-auto bg-cream-50/20 p-6">
                  <div className="rounded-xl border border-cream-200 overflow-hidden bg-white shadow-sm">
                    <div className="px-6 py-4 border-b border-cream-100 space-y-3">
                      <div className="flex items-baseline gap-4">
                        <span className="text-sm font-medium text-navy-400 w-16 flex-shrink-0">To</span>
                        <span className="text-sm text-navy-800">
                          {contacts.length > 0
                            ? (contacts[0].name ? `${contacts[0].name} <${contacts[0].email}>` : contacts[0].email)
                            : "jane@example.com (example)"}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-4">
                        <span className="text-sm font-medium text-navy-400 w-16 flex-shrink-0">Subject</span>
                        <span className="text-base font-semibold text-navy-900">{previewSubject || <span className="text-navy-300 font-normal italic">No subject</span>}</span>
                      </div>
                    </div>
                    <div className="px-6 py-6">
                      <pre className="text-base text-navy-700 whitespace-pre-wrap font-sans leading-relaxed">
                        {previewBody || <span className="text-navy-300 italic">Empty — write your message in Edit mode.</span>}
                      </pre>
                    </div>
                    {contacts.length > 1 && (
                      <div className="px-6 py-3 border-t border-cream-100 bg-cream-50">
                        <p className="text-xs text-navy-400">Previewing for <strong>{contacts[0].name || contacts[0].email}</strong> · personalised for each of your {contacts.length} contacts</p>
                      </div>
                    )}
                    {contacts.length === 0 && (
                      <div className="px-6 py-3 border-t border-cream-100 bg-amber-50">
                        <p className="text-xs text-amber-700">Using example contact — add real contacts in step 1 to preview your personalisation.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-4 py-2.5 text-navy-500 hover:text-navy-900 text-sm font-medium transition-colors">
              <ArrowLeft size={15} />Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!campaignName.trim() || !subject.trim() || !body.trim()}
              className="btn-primary disabled:cursor-not-allowed"
            >
              Schedule <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Schedule ── */}
      {step === 3 && (
        <div className="space-y-4">
          {/* Fixed sending policy — not user-configurable, protects deliverability */}
          <div className="card px-6 py-5 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={18} className="text-coral-500" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-navy-900 mb-1">Safe sending, handled for you</h3>
              <p className="text-sm text-navy-500 leading-relaxed">
                A maximum of <strong className="text-navy-800">{emailsPerDay} emails per day</strong>, automatically staggered
                <strong className="text-navy-800"> {delayMinMins}–{delayMaxMins} minutes apart</strong> — so your outreach looks human and your address stays out of spam folders.
              </p>
            </div>
          </div>

          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-cream-100">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-navy-900">Sending window</h3>
              <p className="text-xs text-navy-400 mt-0.5">Emails only send during these hours.</p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-navy-400 uppercase tracking-widest mb-2">Start</label>
                  <select value={sendWindowStart} onChange={e => setSendWindowStart(Number(e.target.value))} className="input-base">
                    {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}</option>)}
                  </select>
                </div>
                <div className="text-navy-300 mt-5">to</div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-navy-400 uppercase tracking-widest mb-2">End</label>
                  <select value={sendWindowEnd} onChange={e => setSendWindowEnd(Number(e.target.value))} className="input-base">
                    {Array.from({ length: 24 }, (_, h) => <option key={h} value={h}>{h === 0 ? "12am" : h < 12 ? `${h}am` : h === 12 ? "12pm" : `${h - 12}pm`}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-navy-400 uppercase tracking-widest mb-2">Send days</label>
                <div className="flex gap-2 flex-wrap">
                  {ALL_DAYS.map(day => (
                    <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 ${sendDays.includes(day) ? "bg-coral-500 text-white shadow-[0_2px_8px_rgba(232,98,42,0.28)]" : "bg-cream-100 text-navy-400 hover:bg-cream-200"}`}>{day}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cream-50 hairline rounded-[20px] px-6 py-4">
            <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-3">Campaign summary</p>
            <div className="space-y-1.5 text-sm text-navy-700">
              <div className="flex items-center justify-between"><span className="text-navy-500">Contacts</span><span className="font-semibold">{contacts.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-navy-500">Sequence</span><span className="font-semibold">{1 + steps.filter(s => s.body.trim()).length} email{steps.filter(s => s.body.trim()).length > 0 ? "s" : ""}</span></div>
              <div className="flex items-center justify-between"><span className="text-navy-500">Sending</span><span className="font-semibold">{emailsPerDay}/day · {delayMinMins}–{delayMaxMins} min gaps</span></div>
              <div className="flex items-center justify-between"><span className="text-navy-500">Window</span><span className="font-semibold">{sendWindowStart}:00–{sendWindowEnd}:00 · {sendDays.join(", ")}</span></div>
            </div>
          </div>

          {contacts.length > 0 && (() => { const days = Math.ceil(contacts.length / emailsPerDay); return (
            <div className="flex items-center gap-3 bg-coral-50 border border-coral-100 rounded-[20px] px-6 py-4">
              <Calendar size={16} className="text-coral-500 flex-shrink-0" />
              <p className="text-sm text-coral-800">
                At <strong>{emailsPerDay} emails/day</strong>, you&apos;ll reach all <strong>{contacts.length} contact{contacts.length !== 1 ? "s" : ""}</strong> in approximately <strong>~{days} day{days !== 1 ? "s" : ""}</strong>.
              </p>
            </div>
          ); })()}

          {saveError && (
            <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{saveError}</p>
          )}
          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 px-4 py-2.5 text-navy-500 hover:text-navy-900 text-sm font-medium transition-colors">
              <ArrowLeft size={15} />Back
            </button>
            <button
              onClick={saveCampaign}
              disabled={saving || sendDays.length === 0}
              className="btn-primary !px-8 !py-3 !text-[15px]"
            >
              {saving ? null : <Calendar size={16} />}
              {saving ? "Saving…" : "Launch campaign →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NewCampaignPageWrapper() {
  return (
    <Suspense>
      <NewCampaignPage />
    </Suspense>
  );
}
