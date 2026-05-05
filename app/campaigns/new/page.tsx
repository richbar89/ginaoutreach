"use client";

import { useState, useCallback, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Papa from "papaparse";
import {
  Upload, Plus, X, Check, ArrowRight, ArrowLeft,
  Users, Search, FileText, ChevronDown, List,
} from "lucide-react";
import InitialsAvatar from "@/components/InitialsAvatar";
import { useDb } from "@/lib/useDb";
import { dbSaveCampaign, dbGetTemplates } from "@/lib/db";
import type { Contact, EmailTemplate } from "@/lib/types";

type ContactRow = Contact & { id: string; industry: string | null; category: string | null; subcategory: string | null; subcategories: string[] | null; country: string | null };
type Step = 1 | 2 | 3;
type ContactTab = "contacts" | "csv" | "manual" | "list";

type ContactList = {
  id: string;
  name: string;
  vertical: string | null;
  subcategory: string | null;
  country: string | null;
  query: string | null;
};

const MERGE_TAGS = [
  { tag: "{{name}}", label: "Name" },
  { tag: "{{company}}", label: "Company" },
  { tag: "{{position}}", label: "Position" },
];

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
        className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-navy-600 bg-cream-100 hover:bg-cream-200 border border-cream-200 rounded-xl transition-colors"
      >
        <FileText size={12} />
        Load template
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20 bg-white border border-cream-200 rounded-2xl shadow-xl w-72 overflow-hidden">
            <p className="px-4 py-3 text-[11px] font-bold uppercase tracking-widest text-navy-400 border-b border-cream-100">
              Saved templates
            </p>
            <div className="max-h-64 overflow-y-auto">
              {templates.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => { onSelect(t); setOpen(false); }}
                  className="w-full text-left px-4 py-3 hover:bg-cream-50 border-b border-cream-50 transition-colors"
                >
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
  const [step, setStep] = useState<Step>(1);
  const [tab, setTab] = useState<ContactTab>("contacts");
  const [dragging, setDragging] = useState(false);
  const [saving, setSaving] = useState(false);

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
  const [listLoading, setListLoading] = useState(false);

  // Compose
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);

  useEffect(() => {
    fetch("/api/contacts")
      .then(r => r.json())
      .then(data => setAllLeads(Array.isArray(data) ? data : []))
      .catch(() => {});
    getDb().then(db => dbGetTemplates(db).then(setTemplates)).catch(() => {});
    fetch("/api/lists")
      .then(r => r.json())
      .then(data => { if (Array.isArray(data)) setLists(data); })
      .catch(() => {});
  }, [getDb]);

  // Pre-select list from URL param (e.g. coming from "Use →" on contacts page)
  useEffect(() => {
    const listId = searchParams.get("listId");
    if (listId && lists.length > 0) {
      setTab("list");
    }
  }, [searchParams, lists]);

  const applyList = (list: ContactList) => {
    let result = allLeads;
    if (list.vertical) {
      const v = list.vertical.toLowerCase();
      result = result.filter(c => (c.category ?? "").toLowerCase().includes(v) || (c.industry ?? "").toLowerCase().includes(v));
    }
    if (list.subcategory) {
      const sub = list.subcategory;
      result = result.filter(c =>
        c.subcategory === sub ||
        c.category === sub ||
        (c.subcategories ?? []).includes(sub)
      );
    }
    if (list.country) result = result.filter(c => c.country === list.country);
    if (list.query?.trim()) {
      const q = list.query.toLowerCase();
      result = result.filter(c =>
        (c.name ?? "").toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q)
      );
    }
    addContacts(result.map(c => ({
      name: c.name ?? "",
      email: c.email,
      position: c.position ?? "",
      company: c.company ?? "",
    })));
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
      r = r.filter(c =>
        (c.name ?? "").toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.company ?? "").toLowerCase().includes(q)
      );
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
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const parsed: Contact[] = rows
          .map(row => {
            const find = (keys: string[]) => keys.map(k => row[k]).find(Boolean) || "";
            return {
              email: find(["email", "Email", "EMAIL"]),
              name: find(["name", "Name", "full_name", "Full Name"]),
              position: find(["position", "Position", "job_title", "title"]),
              company: find(["company", "Company", "organisation", "organization"]),
            };
          })
          .filter(c => c.email);
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
    const toAdd = allLeads
      .filter(c => selectedIds.has(c.email))
      .map(({ name, email, position, company }) => ({ name: name ?? "", email, position: position ?? "", company: company ?? "" }));
    addContacts(toAdd);
    setSelectedIds(new Set());
  };

  const loadTemplate = (t: EmailTemplate) => {
    setSubject(t.subject);
    setBody(t.body);
  };

  const insertTag = (tag: string) => setBody(prev => prev + tag);

  const saveCampaign = async () => {
    setSaving(true);
    try {
      const campaign = {
        id: crypto.randomUUID(),
        name: campaignName,
        subject,
        body,
        contacts,
        createdAt: new Date().toISOString(),
      };
      const db = await getDb();
      await dbSaveCampaign(db, campaign);
      router.push(`/campaigns/${campaign.id}`);
    } finally {
      setSaving(false);
    }
  };

  const tabBtn = (t: ContactTab, label: string, count?: number) => (
    <button
      onClick={() => setTab(t)}
      className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 ${
        tab === t
          ? "bg-white text-navy-900 shadow-sm"
          : "text-navy-500 hover:text-navy-700"
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${tab === t ? "bg-coral-100 text-coral-600" : "bg-cream-200 text-navy-400"}`}>
          {count}
        </span>
      )}
    </button>
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="h-px w-8 bg-coral-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">Campaigns</span>
        </div>
        <h1 className="font-serif text-3xl font-bold text-navy-900">New Campaign</h1>
        <p className="text-navy-500 text-sm mt-1">Build a personalised bulk email campaign in 3 steps.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {([
          { n: 1 as Step, label: "Contacts" },
          { n: 2 as Step, label: "Compose" },
          { n: 3 as Step, label: "Preview" },
        ]).map(({ n, label }, i) => {
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} className="flex items-center gap-2">
              <button
                onClick={() => done && setStep(n)}
                className={`flex items-center gap-2 ${done ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  done ? "bg-emerald-500 text-white" : active ? "bg-coral-500 text-white" : "bg-cream-200 text-navy-400"
                }`}>
                  {done ? <Check size={12} strokeWidth={3} /> : n}
                </div>
                <span className={`text-sm font-semibold transition-colors ${
                  active ? "text-navy-900" : done ? "text-emerald-600" : "text-navy-400"
                }`}>
                  {label}
                </span>
              </button>
              {i < 2 && <div className={`w-10 h-px mx-1 ${step > n ? "bg-emerald-300" : "bg-cream-200"}`} />}
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

          {/* From Contacts */}
          {tab === "contacts" && (
            <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-cream-100 flex gap-2">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
                  <input
                    type="text"
                    placeholder="Search contacts…"
                    value={contactSearch}
                    onChange={e => setContactSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-cream-50 border border-cream-200 rounded-lg text-sm placeholder:text-navy-300 focus:outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
                  />
                </div>
                <select
                  value={industryFilter}
                  onChange={e => setIndustryFilter(e.target.value)}
                  className="px-3 py-2 bg-cream-50 border border-cream-200 rounded-lg text-xs text-navy-700 focus:outline-none focus:border-coral-300"
                >
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
                      <input
                        type="checkbox"
                        disabled={isAdded}
                        checked={isSelected || isAdded}
                        onChange={e => {
                          setSelectedIds(prev => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(c.email); else next.delete(c.email);
                            return next;
                          });
                        }}
                        className="rounded border-cream-300 text-coral-500 focus:ring-coral-300"
                      />
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
                  <button
                    onClick={addFromSelected}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <Plus size={12} />Add to campaign
                  </button>
                </div>
              )}
            </div>
          )}

          {/* From a List */}
          {tab === "list" && (
            <div className="bg-white border border-cream-200 rounded-2xl shadow-sm overflow-hidden">
              {lists.length === 0 ? (
                <div className="px-6 py-12 text-center">
                  <div className="w-10 h-10 rounded-xl bg-cream-100 flex items-center justify-center mx-auto mb-3">
                    <List size={18} className="text-navy-400" />
                  </div>
                  <p className="text-sm font-semibold text-navy-600 mb-1">No saved lists yet</p>
                  <p className="text-xs text-navy-400 mb-4">Go to the Contacts page, filter by category or country, then click &ldquo;Save as list&rdquo;.</p>
                  <a href="/contacts" className="text-xs font-bold text-coral-600 hover:text-coral-700">Go to Contacts →</a>
                </div>
              ) : (
                <div className="divide-y divide-cream-100">
                  {lists.map(l => {
                    const desc = [l.vertical, l.subcategory, l.country, l.query ? `"${l.query}"` : null].filter(Boolean).join(" · ") || "All contacts";
                    return (
                      <div key={l.id} className="flex items-center gap-4 px-5 py-4 hover:bg-cream-50 transition-colors">
                        <div className="w-9 h-9 rounded-xl bg-coral-50 border border-coral-100 flex items-center justify-center flex-shrink-0">
                          <List size={15} className="text-coral-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-navy-900">{l.name}</p>
                          <p className="text-xs text-navy-400 mt-0.5">{desc}</p>
                        </div>
                        <button
                          onClick={() => applyList(l)}
                          disabled={listLoading}
                          className="px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                        >
                          {listLoading ? "Loading…" : "Add all →"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* CSV Upload */}
          {tab === "csv" && (
            <div
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={e => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) parseCSV(f); }}
              className={`bg-white border-2 border-dashed rounded-2xl p-10 text-center transition-colors ${dragging ? "border-coral-400 bg-coral-50" : "border-cream-300 hover:border-cream-400"}`}
            >
              <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Upload size={18} className="text-navy-400" />
              </div>
              <p className="text-sm font-semibold text-navy-700 mb-1">Drop a CSV here</p>
              <p className="text-xs text-navy-400 mb-4">
                Columns: <code className="bg-cream-100 px-1 rounded">email</code>, <code className="bg-cream-100 px-1 rounded">name</code>, <code className="bg-cream-100 px-1 rounded">company</code>, <code className="bg-cream-100 px-1 rounded">position</code>
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-navy-800 hover:bg-navy-900 text-white text-sm font-semibold rounded-xl cursor-pointer transition-colors">
                <Upload size={14} />Choose file
                <input type="file" accept=".csv" className="sr-only" onChange={e => { if (e.target.files?.[0]) parseCSV(e.target.files[0]); }} />
              </label>
              {csvError && <p className="mt-3 text-sm text-red-500">{csvError}</p>}
            </div>
          )}

          {/* Manual */}
          {tab === "manual" && (
            <div className="bg-white border border-cream-200 rounded-2xl p-5 shadow-sm">
              <div className="grid grid-cols-2 gap-3 mb-3">
                {(["email", "name", "company", "position"] as const).map(field => (
                  <input
                    key={field}
                    type={field === "email" ? "email" : "text"}
                    placeholder={field === "email" ? "Email *" : field.charAt(0).toUpperCase() + field.slice(1)}
                    value={manual[field]}
                    onChange={e => setManual(m => ({ ...m, [field]: e.target.value }))}
                    onKeyDown={e => e.key === "Enter" && addManual()}
                    className="input-base text-sm"
                  />
                ))}
              </div>
              <button
                onClick={addManual}
                disabled={!manual.email}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-coral-500 hover:bg-coral-600 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Plus size={14} />Add contact
              </button>
            </div>
          )}

          {/* Added contacts */}
          {contacts.length > 0 && (
            <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
              <div className="px-5 py-3.5 border-b border-cream-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-semibold text-navy-700">
                  <Users size={14} className="text-navy-400" />
                  {contacts.length} contact{contacts.length !== 1 ? "s" : ""} added
                </div>
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
                    <button onClick={() => setContacts(prev => prev.filter((_, j) => j !== i))} className="text-navy-300 hover:text-red-400 transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={() => setStep(2)}
              disabled={contacts.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Continue <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Compose ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
            {/* Campaign name */}
            <div className="px-6 py-4 border-b border-cream-100">
              <label className="block text-xs font-bold text-navy-400 uppercase tracking-widest mb-2">Campaign name</label>
              <input
                type="text"
                value={campaignName}
                onChange={e => setCampaignName(e.target.value)}
                placeholder="e.g. May Outreach — Snack Brands"
                className="input-base"
              />
            </div>

            {/* Subject */}
            <div className="px-6 py-4 border-b border-cream-100">
              <label className="block text-xs font-bold text-navy-400 uppercase tracking-widest mb-2">Subject line</label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Partnership opportunity — {{company}} × your name"
                className="input-base"
              />
            </div>

            {/* Body */}
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-navy-400 uppercase tracking-widest">Message</label>
                <div className="flex items-center gap-2">
                  <TemplatePicker templates={templates} onSelect={loadTemplate} />
                  <div className="flex items-center gap-1">
                    {MERGE_TAGS.map(({ tag, label }) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => insertTag(tag)}
                        title={label}
                        className="px-2 py-1 text-[11px] bg-coral-50 hover:bg-coral-100 border border-coral-200 text-coral-700 rounded-lg font-mono transition-colors"
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <textarea
                rows={14}
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={`Hi {{name}},\n\nI came across {{company}} and love what you're building…\n\nBest,\n[Your name]`}
                className="input-base resize-y font-mono text-sm leading-relaxed"
              />
            </div>

            <div className="px-6 py-3 bg-cream-50 border-t border-cream-100">
              <p className="text-xs text-navy-400">Merge tags are replaced with each contact&apos;s details when the email is sent.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-4 py-2.5 text-navy-500 hover:text-navy-900 text-sm font-medium transition-colors">
              <ArrowLeft size={15} />Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!campaignName.trim() || !subject.trim() || !body.trim()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Preview <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-cream-100">
              <p className="text-sm font-semibold text-navy-800">Preview — first recipient</p>
              <p className="text-xs text-navy-400 mt-0.5">
                Personalised for <strong>{contacts[0]?.name || contacts[0]?.email}</strong>
              </p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <span className="text-xs font-bold text-navy-400 uppercase tracking-widest">Subject</span>
                <p className="text-sm font-semibold text-navy-900 mt-1.5">{applyMerge(subject, contacts[0])}</p>
              </div>
              <div>
                <span className="text-xs font-bold text-navy-400 uppercase tracking-widest">Body</span>
                <pre className="text-sm text-navy-700 mt-1.5 whitespace-pre-wrap font-sans leading-relaxed bg-cream-50 rounded-xl p-4 border border-cream-200">
                  {applyMerge(body, contacts[0])}
                </pre>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white border border-cream-200 rounded-2xl px-6 py-4 shadow-sm flex items-center gap-4">
            <div className="w-10 h-10 bg-coral-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Users size={16} className="text-coral-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">{contacts.length} personalised email{contacts.length !== 1 ? "s" : ""} ready</p>
              <p className="text-xs text-navy-400 mt-0.5">You&apos;ll be able to send all at once or one by one on the next screen.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 px-4 py-2.5 text-navy-500 hover:text-navy-900 text-sm font-medium transition-colors">
              <ArrowLeft size={15} />Back
            </button>
            <button
              onClick={saveCampaign}
              disabled={saving}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {saving ? null : <Check size={15} />}
              {saving ? "Saving…" : "Save & go to send"}
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
