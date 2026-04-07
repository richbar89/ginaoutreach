"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { ArrowLeft, Upload, Plus, Trash2 } from "lucide-react";
import type { BrandCategory } from "@/lib/types";

type UploadedContact = {
  id: string;
  name: string;
  email: string;
  position: string | null;
  company: string | null;
  linkedin: string | null;
  category: string | null;
  created_at: string;
};

const CATEGORIES: BrandCategory[] = [
  "Snacks & Crisps","Confectionery","Drinks","Coffee & Tea","Beer & Brewing",
  "Wine & Spirits","Bakery & Bread","Dairy & Alternatives","Casual Dining & Restaurants",
  "Grocery & Food Brands","Health & Wellness Food","Baby & Kids Food","Other",
];

export default function AdminContactsPage() {
  const [contacts, setContacts] = useState<UploadedContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"list" | "single" | "csv">("list");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Single contact form
  const [form, setForm] = useState({ name: "", email: "", position: "", company: "", linkedin: "", notes: "", category: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/contacts");
    const data = await res.json();
    setContacts(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

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
    if (res.ok) { setForm({ name: "", email: "", position: "", company: "", linkedin: "", notes: "", category: "" }); await load(); }
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
      body: JSON.stringify({ csv }),
    });
    const data = await res.json();
    setResult(res.ok ? `Inserted ${data.inserted} contacts.` : `Error: ${data.error}`);
    if (res.ok) await load();
    setUploading(false);
  };

  const deleteContact = async (id: string) => {
    await fetch("/api/admin/contacts", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setContacts(prev => prev.filter(c => c.id !== id));
  };

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
    <div className="h-full flex flex-col overflow-y-auto p-8" style={{ background: "var(--blush)" }}>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-navy-400 hover:text-navy-700"><ArrowLeft size={18} /></Link>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-navy-400">Admin</p>
          <h1 className="text-2xl font-black text-navy-900">Contacts</h1>
        </div>
      </div>

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
          <div className="mb-4">
            <label className="text-xs font-bold text-navy-500 mb-1 block">Category</label>
            <select
              value={form.category}
              onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2"
            >
              <option value="">None</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {result && <p className={`text-sm font-semibold mb-3 ${result.startsWith("Error") ? "text-red-500" : "text-emerald-600"}`}>{result}</p>}
          <button
            onClick={submitSingle}
            disabled={uploading || !form.name || !form.email}
            className="flex items-center gap-2 px-4 py-2 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600 disabled:opacity-50"
          >
            <Plus size={14} /> {uploading ? "Adding…" : "Add Contact"}
          </button>
        </div>
      )}

      {/* CSV upload */}
      {tab === "csv" && (
        <div className="bg-white rounded-2xl border p-5" style={{ borderColor: "var(--border)" }}>
          <p className="text-sm text-navy-500 mb-4">
            CSV must include <span className="font-bold">name</span> and <span className="font-bold">email</span> columns.
            Optional: position, company, linkedin, notes, category.
          </p>
          <input ref={fileRef} type="file" accept=".csv" className="mb-4 text-sm text-navy-600" />
          {result && <p className={`text-sm font-semibold mb-3 ${result.startsWith("Error") ? "text-red-500" : "text-emerald-600"}`}>{result}</p>}
          <button
            onClick={submitCsv}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-coral-500 text-white text-sm font-bold rounded-xl hover:bg-coral-600 disabled:opacity-50"
          >
            <Upload size={14} /> {uploading ? "Uploading…" : "Upload CSV"}
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
          <div className="bg-white rounded-2xl border overflow-hidden" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: "var(--border)" }}>
                  {["Name", "Email", "Position", "Company", "Category", ""].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-black uppercase tracking-widest text-navy-400">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {contacts.map(c => (
                  <tr key={c.id} className="border-b last:border-0 hover:bg-navy-50/30 transition-colors" style={{ borderColor: "var(--border)" }}>
                    <td className="px-4 py-3 font-semibold text-navy-900">{c.name}</td>
                    <td className="px-4 py-3 text-navy-500">{c.email}</td>
                    <td className="px-4 py-3 text-navy-400">{c.position || "—"}</td>
                    <td className="px-4 py-3 text-navy-400">{c.company || "—"}</td>
                    <td className="px-4 py-3 text-navy-400">{c.category || "—"}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => deleteContact(c.id)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
