"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Plus, Trash2, Sparkles } from "lucide-react";

type UploadedContact = {
  id: string;
  name: string;
  email: string;
  position: string | null;
  company: string | null;
  linkedin: string | null;
  category: string | null;
  subcategory: string | null;
  country: string | null;
  created_at: string;
};

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<UploadedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"list" | "single" | "csv">("list");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [csvVertical, setCsvVertical] = useState("Food & Drink");
  const fileRef = useRef<HTMLInputElement>(null);

  // AI classification state
  const [classifyStatus, setClassifyStatus] = useState<null | { total: number; classified: number }>(null);
  const [classifying, setClassifying] = useState(false);
  const [classifyLog, setClassifyLog] = useState<string[]>([]);

  const [form, setForm] = useState({ name: "", email: "", position: "", company: "", linkedin: "", notes: "", category: "", subcategory: "", country: "UK" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/contacts");
    const data = await res.json();
    setContacts(Array.isArray(data) ? data : []);
    setSelected(new Set());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const loadClassifyStatus = useCallback(async () => {
    const res = await fetch("/api/admin/contacts/classify");
    if (res.ok) setClassifyStatus(await res.json());
  }, []);

  useEffect(() => { loadClassifyStatus(); }, [loadClassifyStatus]);

  const runClassification = async () => {
    setClassifying(true);
    setClassifyLog([]);
    let done = false;
    let total = 0;
    let totalProcessed = 0;

    while (!done) {
      const res = await fetch("/api/admin/contacts/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ vertical: null }),
      });
      if (!res.ok) {
        const err = await res.json();
        setClassifyLog(l => [...l, `Error: ${err.error}`]);
        break;
      }
      const data = await res.json();
      total = (data.remaining ?? 0) + totalProcessed + (data.processed ?? 0);
      totalProcessed += data.processed ?? 0;
      done = data.done;
      setClassifyLog(l => [...l,
        `Classified ${data.companies_classified ?? 0} companies (${totalProcessed} contacts updated, ${data.remaining ?? 0} remaining)`
      ]);
      setClassifyStatus({ total, classified: totalProcessed });
      if (done) break;
    }

    setClassifying(false);
    await load();
    await loadClassifyStatus();
  };

  const submitSingle = async () => {
    if (!form.name || !form.email) return;
    setUploading(true); setResult(null);
    const res = await fetch("/api/admin/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contact: form }),
    });
    const data = await res.json();
    setResult(res.ok ? `Added 1 contact.` : `Error: ${data.error}`);
    if (res.ok) { setForm({ name: "", email: "", position: "", company: "", linkedin: "", notes: "", category: "", subcategory: "", country: "UK" }); await load(); }
    setUploading(false);
  };

  const submitCsv = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) return;
    setUploading(true); setResult(null);
    const csv = await file.text();
    const res = await fetch("/api/admin/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ csv, vertical: csvVertical }),
    });
    const data = await res.json();
    setResult(res.ok ? `Inserted ${data.inserted} contacts. Use "Run AI Classification" to improve subcategory accuracy.` : `Error: ${data.error}`);
    if (res.ok) await loadClassifyStatus();
    if (res.ok) await load();
    setUploading(false);
  };

  const deleteContact = async (id: string) => {
    await fetch("/api/admin/contacts", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setContacts(prev => prev.filter(c => c.id !== id));
    setSelected(prev => { const s = new Set(prev); s.delete(id); return s; });
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    const isAll = selected.size === contacts.length;
    const res = await fetch("/api/admin/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(isAll ? { all: true } : { ids: [...selected] }),
    });
    if (res.ok) {
      if (isAll) {
        setContacts([]);
      } else {
        setContacts(prev => prev.filter(c => !selected.has(c.id)));
      }
      setSelected(new Set());
    } else {
      const data = await res.json();
      alert(`Delete failed: ${data.error}`);
    }
    setDeleting(false);
    setConfirmDeleteAll(false);
  };

  const allSelected = contacts.length > 0 && selected.size === contacts.length;
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(contacts.map(c => c.id)));
  const toggleOne = (id: string) => setSelected(prev => {
    const s = new Set(prev);
    s.has(id) ? s.delete(id) : s.add(id);
    return s;
  });

  const field = (key: keyof typeof form, label: string, type = "text") => (
    <div>
      <label className="text-xs font-bold text-navy-500 mb-1 block">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
        className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-coral-300"
      />
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-y-auto p-8" style={{ background: "#F7F8FA" }}>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-navy-400 hover:text-navy-700"><ArrowLeft size={18} /></Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Admin</p>
          <h1 className="text-2xl font-black text-navy-900">Contacts</h1>
        </div>
      </div>

      {/* AI Classification panel */}
      {classifyStatus && classifyStatus.total > 0 && (
        <div className="bg-white rounded-2xl border mb-5 p-5" style={{ borderColor: "var(--border)" }}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm font-black text-navy-900 flex items-center gap-2">
                <Sparkles size={14} className="text-coral-500" /> AI Classification
              </p>
              <p className="text-xs text-navy-400 mt-0.5">
                {classifyStatus.classified} of {classifyStatus.total} contacts AI-classified
                {classifyStatus.classified < classifyStatus.total && (
                  <span className="text-amber-600 font-semibold"> — {classifyStatus.total - classifyStatus.classified} still using keyword fallback</span>
                )}
              </p>
            </div>
            {classifyStatus.classified < classifyStatus.total && (
              <button
                onClick={runClassification}
                disabled={classifying}
                className="flex items-center gap-2 px-4 py-2 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600 disabled:opacity-50 transition-colors"
              >
                <Sparkles size={13} />
                {classifying ? "Classifying…" : "Run AI Classification"}
              </button>
            )}
            {classifyStatus.classified >= classifyStatus.total && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg">
                ✓ All classified
              </span>
            )}
          </div>
          {/* Progress bar */}
          <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden mb-3">
            <div
              className="h-full bg-coral-500 rounded-full transition-all duration-500"
              style={{ width: `${classifyStatus.total > 0 ? (classifyStatus.classified / classifyStatus.total) * 100 : 0}%` }}
            />
          </div>
          {/* Log */}
          {classifyLog.length > 0 && (
            <div className="bg-gray-50 rounded-xl p-3 max-h-28 overflow-y-auto">
              {classifyLog.map((line, i) => (
                <p key={i} className="text-xs text-navy-500 font-mono">{line}</p>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {[
          { key: "list", label: `All Uploaded (${contacts.length})` },
          { key: "single", label: "Add Single" },
          { key: "csv", label: "Upload CSV" },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key as typeof tab); setResult(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
              tab === t.key ? "bg-coral-500 text-white" : "bg-white border border-gray-200 text-navy-600 hover:border-coral-300"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Single contact form */}
      {tab === "single" && (
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
          <div className="grid grid-cols-2 gap-3 mb-3">
            {field("name", "Name *")}
            {field("email", "Email *", "email")}
            {field("position", "Position / Job Title")}
            {field("company", "Company")}
            {field("linkedin", "LinkedIn URL")}
            {field("notes", "Notes")}
          </div>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-xs font-bold text-navy-500 mb-1 block">Category</label>
              <input type="text" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g. Food & Drink" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-coral-300" />
            </div>
            <div>
              <label className="text-xs font-bold text-navy-500 mb-1 block">Subcategory</label>
              <input type="text" value={form.subcategory} onChange={e => setForm(p => ({ ...p, subcategory: e.target.value }))} placeholder="e.g. Snacks" className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-coral-300" />
            </div>
            <div>
              <label className="text-xs font-bold text-navy-500 mb-1 block">Country</label>
              <select value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2">
                <option value="UK">UK</option>
                <option value="US">US</option>
                <option value="Global">Global</option>
                <option value="EU">EU</option>
              </select>
            </div>
          </div>
          {result && <p className={`text-sm font-semibold mb-3 ${result.startsWith("Error") ? "text-red-500" : "text-emerald-600"}`}>{result}</p>}
          <button onClick={submitSingle} disabled={uploading || !form.name || !form.email} className="flex items-center gap-2 px-4 py-2 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600 disabled:opacity-50">
            <Plus size={14} /> {uploading ? "Adding…" : "Add Contact"}
          </button>
        </div>
      )}

      {/* CSV upload */}
      {tab === "csv" && (
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold text-navy-700 mb-4">Apollo export supported. Must include <span className="text-coral-600">name</span> and <span className="text-coral-600">email</span> columns.</p>

          {/* Vertical selector */}
          <div className="mb-5">
            <label className="text-xs font-black text-navy-500 uppercase tracking-widest mb-2 block">Which vertical is this CSV for? *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: "Food & Drink", label: "Foodies", emoji: "🍔" },
                { key: "Lifestyle",    label: "Lifestyle", emoji: "✨" },
                { key: "Beauty",       label: "Beauty",    emoji: "💄" },
                { key: "Fitness",      label: "Fitness",   emoji: "💪" },
              ].map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => setCsvVertical(v.key)}
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${
                    csvVertical === v.key
                      ? "border-coral-500 bg-coral-50 text-coral-700"
                      : "border-gray-200 bg-white text-navy-600 hover:border-coral-300"
                  }`}
                >
                  <span>{v.emoji}</span> {v.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-navy-400 mt-2">
              Every contact in this CSV will be tagged as <span className="font-semibold text-navy-600">{csvVertical}</span>. Subcategories are auto-detected from the Keywords column.
            </p>
          </div>

          <input ref={fileRef} type="file" accept=".csv" className="mb-4 text-sm text-navy-600" />
          {result && <p className={`text-sm font-semibold mb-3 ${result.startsWith("Error") ? "text-red-500" : "text-emerald-600"}`}>{result}</p>}
          <button onClick={submitCsv} disabled={uploading} className="flex items-center gap-2 px-4 py-2 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600 disabled:opacity-50">
            <Upload size={14} /> {uploading ? "Uploading…" : `Upload as ${csvVertical}`}
          </button>
        </div>
      )}

      {/* Contact list */}
      {tab === "list" && (
        loading ? (
          <div className="text-center text-navy-400 text-sm py-10">Loading…</div>
        ) : contacts.length === 0 ? (
          <div className="text-center text-navy-400 text-sm py-10">No contacts uploaded yet.</div>
        ) : (
          <>
            {/* Bulk action bar */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-navy-400">
                {selected.size > 0 ? <span className="font-semibold text-navy-700">{selected.size} selected</span> : `${contacts.length} contacts`}
              </p>
              <div className="flex items-center gap-2">
                {selected.size > 0 && (
                  confirmDeleteAll ? (
                    <>
                      <span className="text-xs text-red-600 font-semibold">Delete {selected.size} contact{selected.size !== 1 ? "s" : ""}?</span>
                      <button onClick={deleteSelected} disabled={deleting} className="px-3 py-1.5 bg-red-500 text-white text-xs font-bold rounded-lg hover:bg-red-600 disabled:opacity-50">
                        {deleting ? "Deleting…" : "Yes, delete"}
                      </button>
                      <button onClick={() => setConfirmDeleteAll(false)} className="px-3 py-1.5 bg-gray-100 text-navy-600 text-xs font-bold rounded-lg hover:bg-gray-200">
                        Cancel
                      </button>
                    </>
                  ) : (
                    <button onClick={() => setConfirmDeleteAll(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-100">
                      <Trash2 size={12} /> Delete {selected.size === contacts.length ? "all" : `${selected.size} selected`}
                    </button>
                  )
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        className="rounded border-gray-300 accent-coral-500 cursor-pointer"
                      />
                    </th>
                    {["Name", "Email", "Company", "Category / Sub", "Country", ""].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest text-navy-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {contacts.map(c => (
                    <tr
                      key={c.id}
                      className={`border-b last:border-0 transition-colors ${selected.has(c.id) ? "bg-coral-50" : "hover:bg-navy-50/30"}`}
                      style={{ borderColor: "var(--border)" }}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selected.has(c.id)}
                          onChange={() => toggleOne(c.id)}
                          className="rounded border-gray-300 accent-coral-500 cursor-pointer"
                        />
                      </td>
                      <td className="px-4 py-3 font-semibold text-navy-900">{c.name}</td>
                      <td className="px-4 py-3 text-navy-500">{c.email}</td>
                      <td className="px-4 py-3 text-navy-400">{c.company || "—"}</td>
                      <td className="px-4 py-3 text-navy-400">
                        {c.category || "—"}
                        {c.subcategory && <span className="text-navy-300"> / {c.subcategory}</span>}
                      </td>
                      <td className="px-4 py-3 text-navy-400">{c.country || "UK"}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => deleteContact(c.id)} className="text-red-300 hover:text-red-600 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )
      )}
    </div>
  );
}
