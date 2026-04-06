"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { Upload, Plus, X, Check, ArrowRight, ArrowLeft, Users, Mail, Search } from "lucide-react";
import InitialsAvatar from "@/components/InitialsAvatar";
import { useDb } from "@/lib/useDb";
import { dbGetCampaigns, dbSaveCampaign } from "@/lib/db";
import { leads as ALL_LEADS } from "@/lib/leads-data";
import type { Contact } from "@/lib/types";

type Step = 1 | 2 | 3;
type ContactTab = "csv" | "manual" | "contacts";

const MERGE_TAGS = ["{{name}}", "{{email}}", "{{position}}", "{{company}}"];

function applyMerge(template: string, contact: Contact) {
  return template
    .replace(/\{\{name\}\}/g, contact.name || "")
    .replace(/\{\{email\}\}/g, contact.email || "")
    .replace(/\{\{position\}\}/g, contact.position || "")
    .replace(/\{\{company\}\}/g, contact.company || "");
}

export default function NewCampaignPage() {
  const router = useRouter();
  const getDb = useDb();
  const [step, setStep] = useState<Step>(1);
  const [tab, setTab] = useState<ContactTab>("csv");
  const [dragging, setDragging] = useState(false);

  // Step 1
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [csvError, setCsvError] = useState("");
  const [manual, setManual] = useState({ name: "", email: "", position: "", company: "" });
  const [contactSearch, setContactSearch] = useState("");
  const [industryFilter, setIndustryFilter] = useState("All");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const industries = useMemo(() => {
    const set = new Set(ALL_LEADS.map((l) => l.industry).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, []);

  // Step 2
  const [campaignName, setCampaignName] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const filteredStored = useMemo(() => {
    let result = ALL_LEADS;
    if (industryFilter !== "All") {
      result = result.filter((c) => c.industry === industryFilter);
    }
    if (contactSearch.trim()) {
      const q = contactSearch.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q)
      );
    }
    return result;
  }, [contactSearch, industryFilter]);

  const addContacts = (newOnes: Contact[]) => {
    setContacts((prev) => {
      const existing = new Set(prev.map((c) => c.email.toLowerCase()));
      return [...prev, ...newOnes.filter((c) => !existing.has(c.email.toLowerCase()))];
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
          .map((row) => {
            const find = (keys: string[]) => keys.map((k) => row[k]).find(Boolean) || "";
            return {
              email: find(["email", "Email", "EMAIL"]),
              name: find(["name", "Name", "full_name", "Full Name"]),
              position: find(["position", "Position", "job_title", "title"]),
              company: find(["company", "Company", "organisation", "organization"]),
            };
          })
          .filter((c) => c.email);
        if (!parsed.length) { setCsvError("No valid email addresses found."); return; }
        addContacts(parsed);
      },
      error: (err) => setCsvError(err.message),
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const addManual = () => {
    if (!manual.email) return;
    addContacts([{ ...manual }]);
    setManual({ name: "", email: "", position: "", company: "" });
  };

  const addFromContacts = () => {
    const toAdd = ALL_LEADS
      .filter((c) => selectedIds.has(c.email))
      .map(({ name, email, position, company }) => ({ name, email, position, company }));
    addContacts(toAdd);
    setSelectedIds(new Set());
  };

  const insertTag = (tag: string) => setBody((prev) => prev + tag);

  const saveCampaign = async () => {
    const campaign = {
      id: crypto.randomUUID(),
      name: campaignName,
      subject,
      body,
      contacts,
      createdAt: new Date().toISOString(),
    };
    const db = await getDb();
    const existing = await dbGetCampaigns(db);
    await dbSaveCampaign(db, campaign);
    void existing; // existing fetched to maintain order parity; new campaign saved directly
    router.push(`/campaigns/${campaign.id}`);
  };

  const steps = [
    { n: 1 as Step, label: "Contacts" },
    { n: 2 as Step, label: "Compose" },
    { n: 3 as Step, label: "Preview" },
  ];

  const tabClass = (t: ContactTab) =>
    `px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
      tab === t
        ? "bg-white text-slate-900 shadow-sm"
        : "text-slate-500 hover:text-slate-700"
    }`;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">New Campaign</h1>
        <p className="text-slate-500 text-sm mt-1">Build a personalised bulk email campaign.</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {steps.map(({ n, label }, i) => {
          const done = step > n;
          const active = step === n;
          return (
            <div key={n} className="flex items-center gap-2">
              <button
                onClick={() => done && setStep(n)}
                className={`flex items-center gap-2 ${done ? "cursor-pointer" : "cursor-default"}`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    done ? "bg-green-500 text-white" : active ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400"
                  }`}
                >
                  {done ? <Check size={12} strokeWidth={3} /> : n}
                </div>
                <span className={`text-sm font-medium transition-colors ${active ? "text-slate-900" : done ? "text-green-600" : "text-slate-400"}`}>
                  {label}
                </span>
              </button>
              {i < steps.length - 1 && (
                <div className={`w-12 h-px mx-1 ${step > n ? "bg-green-300" : "bg-slate-200"}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Contacts ── */}
      {step === 1 && (
        <div className="space-y-4">
          {/* Tab switcher */}
          <div className="bg-slate-100 rounded-xl p-1 flex gap-1">
            <button className={tabClass("csv")} onClick={() => setTab("csv")}>
              <Upload size={13} className="inline mr-1.5" />CSV Upload
            </button>
            <button className={tabClass("manual")} onClick={() => setTab("manual")}>
              <Plus size={13} className="inline mr-1.5" />Add Manually
            </button>
            <button className={tabClass("contacts")} onClick={() => setTab("contacts")}>
              <Users size={13} className="inline mr-1.5" />
              From Contacts
              <span className="ml-1.5 px-1.5 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                {ALL_LEADS.length}
              </span>
            </button>
          </div>

          {/* CSV tab */}
          {tab === "csv" && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={(e) => { e.preventDefault(); setDragging(false); const f = e.dataTransfer.files[0]; if (f) parseCSV(f); }}
              className={`bg-white border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${
                dragging ? "border-blue-400 bg-blue-50" : "border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Upload size={18} className="text-slate-500" />
              </div>
              <p className="text-sm font-medium text-slate-700 mb-1">Drop a CSV here</p>
              <p className="text-xs text-slate-400 mb-4">
                Columns: <code className="bg-slate-100 px-1 rounded">email</code>,{" "}
                <code className="bg-slate-100 px-1 rounded">name</code>,{" "}
                <code className="bg-slate-100 px-1 rounded">position</code>,{" "}
                <code className="bg-slate-100 px-1 rounded">company</code>
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-sm font-medium rounded-lg cursor-pointer transition-colors">
                <Upload size={14} />Choose file
                <input type="file" accept=".csv" className="sr-only" onChange={(e) => { if (e.target.files?.[0]) parseCSV(e.target.files[0]); }} />
              </label>
              {csvError && <p className="mt-3 text-sm text-red-600">{csvError}</p>}
            </div>
          )}

          {/* Manual tab */}
          {tab === "manual" && (
            <div className="bg-white border border-slate-200 rounded-2xl p-5">
              <div className="grid grid-cols-2 gap-3 mb-3">
                {(["email", "name", "position", "company"] as const).map((field) => (
                  <input
                    key={field}
                    type={field === "email" ? "email" : "text"}
                    placeholder={field === "email" ? "Email *" : field.charAt(0).toUpperCase() + field.slice(1)}
                    value={manual[field]}
                    onChange={(e) => setManual((m) => ({ ...m, [field]: e.target.value }))}
                    onKeyDown={(e) => e.key === "Enter" && addManual()}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ))}
              </div>
              <button
                onClick={addManual}
                disabled={!manual.email}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-700 text-sm font-medium rounded-lg transition-colors"
              >
                <Plus size={14} />Add contact
              </button>
            </div>
          )}

          {/* From contacts tab */}
          {tab === "contacts" && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex gap-2">
                <div className="relative flex-1">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search contacts..."
                    value={contactSearch}
                    onChange={(e) => setContactSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <select
                  value={industryFilter}
                  onChange={(e) => setIndustryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {industries.map((ind) => (
                    <option key={ind} value={ind}>{ind}</option>
                  ))}
                </select>
              </div>
              <div className="max-h-60 overflow-y-auto divide-y divide-slate-50">
                {filteredStored.map((c) => {
                  const isAdded = contacts.some((x) => x.email.toLowerCase() === c.email.toLowerCase());
                  const isSelected = selectedIds.has(c.email);
                  return (
                    <label
                      key={c.email}
                      className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                        isAdded ? "opacity-50 cursor-not-allowed" : "hover:bg-slate-50"
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={isAdded}
                        checked={isSelected || isAdded}
                        onChange={(e) => {
                          setSelectedIds((prev) => {
                            const next = new Set(prev);
                            if (e.target.checked) next.add(c.email); else next.delete(c.email);
                            return next;
                          });
                        }}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <InitialsAvatar name={c.name} email={c.email} size="sm" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-800 truncate">{c.name || c.email}</p>
                        <p className="text-xs text-slate-400 truncate">{c.company} {c.position ? "· " + c.position : ""}</p>
                      </div>
                      {isAdded && <span className="text-xs text-slate-400">Added</span>}
                    </label>
                  );
                })}
              </div>
              {selectedIds.size > 0 && (
                <div className="px-4 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                  <span className="text-xs text-slate-500">{selectedIds.size} selected</span>
                  <button
                    onClick={addFromContacts}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    <Plus size={12} />Add to campaign
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Added contacts list */}
          {contacts.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <Users size={14} className="text-slate-400" />
                  {contacts.length} contact{contacts.length !== 1 ? "s" : ""} added
                </div>
                <button onClick={() => setContacts([])} className="text-xs text-slate-400 hover:text-red-500 transition-colors">
                  Clear all
                </button>
              </div>
              <div className="max-h-52 overflow-y-auto divide-y divide-slate-50">
                {contacts.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50">
                    <InitialsAvatar name={c.name} email={c.email} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-800 font-medium truncate">{c.name || c.email}</p>
                      {c.name && <p className="text-xs text-slate-400 truncate">{c.email}</p>}
                    </div>
                    <button onClick={() => setContacts((prev) => prev.filter((_, j) => j !== i))} className="text-slate-300 hover:text-red-400 transition-colors">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Continue <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 2: Compose ── */}
      {step === 2 && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100">
            <div className="px-6 py-4">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-1.5">
                Campaign Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="e.g. March Outreach"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="px-6 py-4">
              <label className="block text-xs font-medium text-slate-400 uppercase tracking-widest mb-1.5">
                Subject <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Hi {{name}}, quick note from us"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="px-6 py-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-widest">
                  Message <span className="text-red-400">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-slate-400 mr-1">Insert:</span>
                  {MERGE_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertTag(tag)}
                      className="px-2 py-0.5 text-xs bg-violet-50 text-violet-700 rounded font-mono hover:bg-violet-100 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                rows={14}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder={`Hi {{name}},\n\nI hope this finds you well...\n\nBest regards,\n[Your name]`}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono leading-relaxed resize-y"
              />
            </div>
            <div className="px-6 py-3.5 bg-slate-50 rounded-b-2xl">
              <p className="text-xs text-slate-400">Merge tags are replaced with each contact&apos;s data when you open the email.</p>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(1)} className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
              <ArrowLeft size={15} />Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!campaignName || !subject || !body}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-xl transition-colors"
            >
              Preview <ArrowRight size={15} />
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Preview ── */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Preview — first recipient</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Personalised for <strong>{contacts[0]?.name || contacts[0]?.email}</strong>
              </p>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Subject</span>
                <p className="text-sm font-medium text-slate-800 mt-1">{applyMerge(subject, contacts[0])}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Body</span>
                <pre className="text-sm text-slate-700 mt-1 whitespace-pre-wrap font-sans leading-relaxed bg-slate-50 rounded-xl p-4">
                  {applyMerge(body, contacts[0])}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl px-6 py-5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Mail size={16} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Ready to send</p>
                <p className="text-xs text-slate-400">
                  {contacts.length} personalised email{contacts.length !== 1 ? "s" : ""} — you&apos;ll open each one from your mail app on the next screen.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <button onClick={() => setStep(2)} className="inline-flex items-center gap-2 px-4 py-2.5 text-slate-600 hover:text-slate-900 text-sm font-medium transition-colors">
              <ArrowLeft size={15} />Back
            </button>
            <button
              onClick={saveCampaign}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-xl transition-colors"
            >
              <Check size={15} />Save &amp; Go to Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
