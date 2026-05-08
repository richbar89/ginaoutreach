"use client";

import { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Papa from "papaparse";
import {
  Upload, Plus, X, Check, ArrowRight, ArrowLeft,
  Users, Search, FileText, ChevronDown, List, Trash2,
  Calendar, Eye, Pencil,
} from "lucide-react";
import InitialsAvatar from "@/components/InitialsAvatar";
import { useDb } from "@/lib/useDb";
import { dbSaveCampaign, dbGetTemplates } from "@/lib/db";
import type { Contact, EmailTemplate, CampaignStep } from "@/lib/types";

type ContactRow = Contact & { id: string; industry: string | null; category: string | null; subcategory: string | null; subcategories: string[] | null; country: string | null };
type WizardStep = 1 | 2 | 3;
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

function applyMerge(template: string, contact: Contact) {
  return template
    .replace(/\{\{name\}\}/g, contact.name || "")
    .replace(/\{\{email\}\}/g, contact.email || "")
    .replace(/\{\{position\}\}/g, contact.position || "")
    .replace(/\{\{company\}\}/g, contact.company || "");
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
  const [step, setStep] = useState<WizardStep>(1);
  const [tab, setTab] = useState<ContactTab>("contacts");
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

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

  // Cadence
  const [emailsPerDay, setEmailsPerDay] = useState(25);
  const [delayMinMins, setDelayMinMins] = useState(3);
  const [delayMaxMins, setDelayMaxMins] = useState(10);
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
    getDb().then(db => dbGetTemplates(db).then(setTemplates)).catch(() => {});
    fetch("/api/lists").then(r => r.json()).then(data => { if (Array.isArray(data)) setLists(data); }).catch(() => {});
  }, [getDb]);

  useEffect(() => {
    const listId = searchParams.get("listId");
    if (listId && lists.length > 0) setTab("list");
  }, [searchParams, lists]);

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
      await dbSaveCampaign(db, campaign);
      router.push(`/campaigns/${campaign.id}`);
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
    { n: 1 as WizardStep, label: "Contacts" },
    { n: 2 as WizardStep, label: "Sequence" },
    { n: 3 as WizardStep, label: "Schedule" },
  ];

  // Preview helpers
  const previewContact = contacts[0] ?? { name: "Jane Smith", email: "jane@example.com", company: "Acme Co", position: "Marketing Manager" };
  const currentSubject = selectedStep === -1 ? subject : (steps[selectedStep]?.subject || `Re: ${subject}`);
  const currentBody = selectedStep === -1 ? body : (steps[selectedStep]?.body || "");
  const previewSubject = applyMerge(currentSubject, previewContact);
  const previewBody = applyMerge(currentBody, previewContact);

  return (
    <div className={`p-8 mx-auto transition-all ${step === 2 ? "max-w-5xl" : "max-w-3xl"}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-coral-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">Campaigns</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-navy-900">New Campaign</h1>
        <p className="text-navy-500 text-sm mt-1">Set up contacts, write your sequence, configure sending.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {WIZARD_STEPS.map(({ n, label }, i) => {
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} className="flex items-center gap-2">
              <button onClick={() => done && setStep(n)} className={`flex items-center gap-2 ${done ? "cursor-pointer" : "cursor-default"}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${done ? "bg-emerald-500 text-white" : active ? "bg-coral-500 text-white" : "bg-cream-200 text-navy-400"}`}>
                  {done ? <Check size={12} strokeWidth={3} /> : n}
                </div>
                <span className={`text-sm font-semibold transition-colors ${active ? "text-navy-900" : done ? "text-emerald-600" : "text-navy-400"}`}>{label}</span>
              </button>
              {i < WIZARD_STEPS.length - 1 && <div className={`w-10 h-px mx-1 ${step > n ? "bg-emerald-300" : "bg-cream-200"}`} />}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Contacts ── */}
      {step === 1 && (
        <div className="space-y-4">
          <div className="bg-cream-100 rounded-xl p-1 flex gap-1">
            {tabBtn("contacts", "From Contacts", allLeads.length)}
            {tabBtn("list", "From a List", lists.length || undefined)}
            {tabBtn("csv", "Upload CSV")}
            {tabBtn("manual", "Add manually")}
          </div>

          {tab === "contacts" && (
            <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
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
                      {isAdded && <span className="text-xs text-navy-300">Added</span>}
                    </label>
                  );
                })}
              </div>
              {selectedIds.size > 0 && (
                <div className="px-4 py-3 border-t border-cream-100 bg-cream-50 flex items-center justify-between">
                  <span className="text-xs text-navy-500">{selectedIds.size} selected</span>
                  <button onClick={addFromSelected} className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold rounded-lg transition-colors"><Plus size={12} />Add to campaign</button>
                </div>
              )}
            </div>
          )}

          {tab === "list" && (
            <div className="bg-white border border-cream-200 rounded-2xl shadow-sm overflow-hidden">
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
                          {alreadyAdded && <span className="text-[10px] text-emerald-600 font-bold">Added</span>}
                        </label>
                      );
                    })}
                  </div>
                  <div className="px-4 py-3 border-t border-cream-100 flex justify-end">
                    <button onClick={addFromList} disabled={listSelectedIds.size === 0} className="px-5 py-2 bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold rounded-lg disabled:opacity-40 transition-colors">
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

          {tab === "csv" && (
            <div onDragOver={e => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) parseCSV(f); }} className={`bg-white border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${dragging ? "border-coral-400 bg-coral-50" : "border-cream-300 hover:border-cream-400"}`}>
              <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center mx-auto mb-3"><Upload size={18} className="text-navy-400" /></div>
              <p className="text-sm font-semibold text-navy-700 mb-1">Drop a CSV here</p>
              <p className="text-xs text-navy-400 mb-4">Columns: <code className="bg-cream-100 px-1 rounded">email</code>, <code className="bg-cream-100 px-1 rounded">name</code>, <code className="bg-cream-100 px-1 rounded">company</code>, <code className="bg-cream-100 px-1 rounded">position</code></p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white text-sm font-semibold rounded-xl cursor-pointer transition-colors">
                <Upload size={14} />Choose file
                <input type="file" accept=".csv" className="sr-only" onChange={e => { if (e.target.files?.[0]) parseCSV(e.target.files[0]); }} />
              </label>
              {csvError && <p className="mt-3 text-sm text-red-500">{csvError}</p>}
            </div>
          )}

          {tab === "manual" && (
            <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-3 mb-3">
                {(["email", "name", "company", "position"] as const).map(field => (
                  <input key={field} type={field === "email" ? "email" : "text"} placeholder={field === "email" ? "Email *" : field.charAt(0).toUpperCase() + field.slice(1)} value={manual[field]} onChange={e => setManual(m => ({ ...m, [field]: e.target.value }))} onKeyDown={e => e.key === "Enter" && addManual()} className="input-base text-sm" />
                ))}
              </div>
              <button onClick={addManual} disabled={!manual.email} className="inline-flex items-center gap-1.5 px-4 py-2 bg-coral-500 hover:bg-coral-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"><Plus size={14} />Add contact</button>
            </div>
          )}

          {contacts.length > 0 && (
            <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-cream-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-navy-700"><Users size={14} className="text-navy-400" />{contacts.length} contact{contacts.length !== 1 ? "s" : ""} added</div>
                <button onClick={() => setContacts([])} className="text-xs text-navy-400 hover:text-red-500 transition-colors">Clear all</button>
              </div>
              <div className="max-h-48 overflow-y-auto divide-y divide-cream-50">
                {contacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-cream-50">
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

          <div className="flex justify-end pt-2">
            <button onClick={() => setStep(2)} disabled={contacts.length === 0} className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors">
              Continue <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Sequence — two-column editor ── */}
      {step === 2 && (
        <div className="space-y-5">
          {/* Campaign name */}
          <div className="bg-white border border-cream-200 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-5">
            <label className="text-sm font-medium text-navy-400 flex-shrink-0">Campaign name</label>
            <input type="text" value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. May Outreach — Snack Brands" className="flex-1 bg-transparent text-base font-semibold text-navy-900 placeholder:text-navy-300 focus:outline-none" />
          </div>

          {/* Two-column editor */}
          <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm flex" style={{ height: "calc(100vh - 310px)", minHeight: 580 }}>

            {/* Left: timeline step list */}
            <div className="w-64 border-r border-cream-100 flex flex-col flex-shrink-0 bg-cream-50/30">
              <div className="px-5 py-4 border-b border-cream-100">
                <p className="text-xs font-bold uppercase tracking-widest text-navy-400">Sequence steps</p>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-0">
                {/* Initial email — timeline item */}
                <div className="flex gap-3">
                  <div className="flex flex-col items-center w-8 flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${selectedStep === -1 ? "bg-coral-500 text-white shadow-sm" : "bg-cream-200 text-navy-500"}`}>1</div>
                    {steps.length > 0 && <div className="w-px flex-1 bg-cream-200 mt-1 mb-1" style={{ minHeight: 20 }} />}
                  </div>
                  <button
                    onClick={() => { setSelectedStep(-1); setPreviewMode(false); }}
                    className="flex-1 pb-3 text-left group"
                  >
                    <div className={`rounded-xl border px-3 py-3 transition-all ${selectedStep === -1 ? "border-coral-200 bg-white shadow-sm" : "border-cream-200 hover:border-cream-300 hover:bg-white/60"}`}>
                      <p className={`text-xs font-semibold mb-1 ${selectedStep === -1 ? "text-coral-500" : "text-navy-400"}`}>Day 1 · Initial email</p>
                      <p className="text-sm font-medium text-navy-800 truncate leading-tight">{subject || <span className="text-navy-300 italic font-normal">No subject yet</span>}</p>
                    </div>
                  </button>
                </div>

                {/* Follow-up steps */}
                {steps.map((s, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center w-8 flex-shrink-0">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 transition-colors ${selectedStep === i ? "bg-navy-800 text-white shadow-sm" : "bg-cream-200 text-navy-500"}`}>{i + 2}</div>
                      {i < steps.length - 1 && <div className="w-px flex-1 bg-cream-200 mt-1 mb-1" style={{ minHeight: 20 }} />}
                    </div>
                    <button
                      onClick={() => { setSelectedStep(i); setPreviewMode(false); }}
                      className="flex-1 pb-3 text-left"
                    >
                      <div className={`rounded-xl border px-3 py-3 transition-all ${selectedStep === i ? "border-navy-200 bg-white shadow-sm" : "border-cream-200 hover:border-cream-300 hover:bg-white/60"}`}>
                        <p className={`text-xs font-semibold mb-1 ${selectedStep === i ? "text-navy-600" : "text-navy-400"}`}>Day +{s.delay_days} · Follow-up {i + 1}</p>
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
                  <div className="flex items-center gap-2 text-sm text-navy-500">
                    <span>Send after</span>
                    <input
                      type="number" min={1} max={60}
                      value={steps[selectedStep]?.delay_days ?? 3}
                      onChange={e => updateStep(selectedStep, { delay_days: Math.max(1, parseInt(e.target.value) || 1) })}
                      className="w-14 text-center border border-cream-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-coral-300"
                    />
                    <span>days</span>
                  </div>
                )}
                <div className="ml-auto flex items-center gap-3">
                  <div className="flex items-center rounded-lg border border-cream-200 overflow-hidden text-sm font-medium">
                    <button
                      onClick={() => setPreviewMode(false)}
                      className={`flex items-center gap-1.5 px-4 py-2 transition-colors ${!previewMode ? "bg-cream-100 text-navy-800" : "text-navy-400 hover:bg-cream-50"}`}
                    >
                      <Pencil size={13} /> Edit
                    </button>
                    <button
                      onClick={() => setPreviewMode(true)}
                      className={`flex items-center gap-1.5 px-4 py-2 border-l border-cream-200 transition-colors ${previewMode ? "bg-cream-100 text-navy-800" : "text-navy-400 hover:bg-cream-50"}`}
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
                    <span className="text-sm font-medium text-navy-400 w-18 flex-shrink-0">Subject</span>
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
              className="inline-flex items-center gap-2 px-6 py-3 bg-coral-500 hover:bg-coral-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Schedule <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Schedule ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-cream-100">
              <h3 className="text-sm font-bold text-navy-800">Sending limits</h3>
              <p className="text-xs text-navy-400 mt-0.5">How many emails go out each day.</p>
            </div>
            <div className="px-6 py-5">
              <label className="block text-xs font-bold text-navy-400 uppercase tracking-widest mb-3">Max emails per day</label>
              <div className="flex items-center gap-4">
                <input type="range" min={5} max={50} step={5} value={emailsPerDay} onChange={e => setEmailsPerDay(Number(e.target.value))} className="flex-1 accent-coral-500" />
                <span className="text-lg font-bold text-navy-900 w-10 text-right">{emailsPerDay}</span>
              </div>
              <div className="flex justify-between text-[10px] text-navy-300 mt-1"><span>5</span><span>25</span><span>50</span></div>
            </div>
          </div>

          <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-cream-100">
              <h3 className="text-sm font-bold text-navy-800">Sending speed</h3>
              <p className="text-xs text-navy-400 mt-0.5">Randomised gap between each email — looks more human.</p>
            </div>
            <div className="px-6 py-5 flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-navy-400 uppercase tracking-widest mb-2">Min delay (mins)</label>
                <input type="number" min={1} max={60} value={delayMinMins} onChange={e => setDelayMinMins(Math.max(1, Number(e.target.value)))} className="input-base text-center" />
              </div>
              <div className="text-navy-300 mt-5">→</div>
              <div className="flex-1">
                <label className="block text-xs font-bold text-navy-400 uppercase tracking-widest mb-2">Max delay (mins)</label>
                <input type="number" min={delayMinMins} max={120} value={delayMaxMins} onChange={e => setDelayMaxMins(Math.max(delayMinMins, Number(e.target.value)))} className="input-base text-center" />
              </div>
            </div>
          </div>

          <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-cream-100">
              <h3 className="text-sm font-bold text-navy-800">Sending window</h3>
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
                    <button key={day} type="button" onClick={() => toggleDay(day)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${sendDays.includes(day) ? "bg-coral-500 text-white" : "bg-cream-100 text-navy-400 hover:bg-cream-200"}`}>{day}</button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cream-50 border border-cream-200 rounded-2xl px-6 py-4">
            <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-3">Campaign summary</p>
            <div className="space-y-1.5 text-sm text-navy-700">
              <div className="flex items-center justify-between"><span className="text-navy-500">Contacts</span><span className="font-semibold">{contacts.length}</span></div>
              <div className="flex items-center justify-between"><span className="text-navy-500">Sequence</span><span className="font-semibold">{1 + steps.filter(s => s.body.trim()).length} email{steps.filter(s => s.body.trim()).length > 0 ? "s" : ""}</span></div>
              <div className="flex items-center justify-between"><span className="text-navy-500">Sending</span><span className="font-semibold">{emailsPerDay}/day · {delayMinMins}–{delayMaxMins} min gaps</span></div>
              <div className="flex items-center justify-between"><span className="text-navy-500">Window</span><span className="font-semibold">{sendWindowStart}:00–{sendWindowEnd}:00 · {sendDays.join(", ")}</span></div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 px-4 py-2.5 text-navy-500 hover:text-navy-900 text-sm font-medium transition-colors">
              <ArrowLeft size={15} />Back
            </button>
            <button
              onClick={saveCampaign}
              disabled={saving || sendDays.length === 0}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {saving ? null : <Calendar size={15} />}
              {saving ? "Saving…" : "Save campaign →"}
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
