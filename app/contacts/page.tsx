"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Plus, Search, Upload, Mail, X, Linkedin } from "lucide-react";
import Papa from "papaparse";
import InitialsAvatar from "@/components/InitialsAvatar";
import { getContacts, saveContacts, getEmailLog, upsertContact } from "@/lib/storage";
import type { StoredContact, EmailRecord } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
  });
}

function lastEmailed(email: string, log: EmailRecord[]): string | null {
  const records = log.filter((r) => r.contactEmail === email.toLowerCase());
  if (!records.length) return null;
  return records.sort((a, b) => b.sentAt.localeCompare(a.sentAt))[0].sentAt;
}

function blankContact(): StoredContact {
  return { id: "", name: "", email: "", position: "", company: "", linkedin: "", notes: "", createdAt: "" };
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<StoredContact[]>([]);
  const [log, setLog] = useState<EmailRecord[]>([]);
  const [query, setQuery] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<StoredContact>(blankContact());

  useEffect(() => {
    setContacts(getContacts());
    setLog(getEmailLog());
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return contacts;
    const q = query.toLowerCase();
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.position.toLowerCase().includes(q)
    );
  }, [contacts, query]);

  const saveContact = () => {
    if (!form.email) return;
    const contact: StoredContact = {
      id: form.id || crypto.randomUUID(),
      name: form.name,
      email: form.email.toLowerCase(),
      position: form.position,
      company: form.company,
      linkedin: form.linkedin,
      notes: form.notes,
      createdAt: form.createdAt || new Date().toISOString(),
    };
    upsertContact(contact);
    setContacts(getContacts());
    setShowAdd(false);
    setForm(blankContact());
  };

  const deleteContact = (id: string) => {
    if (!confirm("Delete this contact?")) return;
    const updated = contacts.filter((c) => c.id !== id);
    saveContacts(updated);
    setContacts(updated);
  };

  const handleCSV = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const existing = new Set(getContacts().map((c) => c.email));
        const parsed: StoredContact[] = rows
          .map((row) => {
            const find = (keys: string[]) => keys.map((k) => row[k]).find(Boolean) || "";
            return {
              id: crypto.randomUUID(),
              email: find(["email", "Email", "EMAIL"]).toLowerCase(),
              name: find(["name", "Name", "full_name", "Full Name"]),
              position: find(["position", "Position", "job_title", "Job Title", "title"]),
              company: find(["company", "Company", "organisation", "organization"]),
              linkedin: find(["linkedin", "LinkedIn", "linkedin_url", "LinkedIn URL"]),
              notes: "",
              createdAt: new Date().toISOString(),
            };
          })
          .filter((c) => c.email && !existing.has(c.email));
        const all = [...getContacts(), ...parsed];
        saveContacts(all);
        setContacts(all);
      },
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Contacts</h1>
          <p className="text-slate-500 text-sm mt-1">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 text-sm font-medium rounded-xl cursor-pointer transition-colors">
            <Upload size={14} />
            Import CSV
            <input
              type="file"
              accept=".csv"
              className="sr-only"
              onChange={(e) => { if (e.target.files?.[0]) handleCSV(e.target.files[0]); }}
            />
          </label>
          <button
            onClick={() => { setForm(blankContact()); setShowAdd(true); }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={14} />
            Add contact
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search by name, email, company or position..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        {query && (
          <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Table */}
      {contacts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search size={20} className="text-slate-400" />
          </div>
          <h2 className="text-sm font-semibold text-slate-800 mb-1">No contacts yet</h2>
          <p className="text-xs text-slate-400 mb-5">Import a CSV or add contacts one by one.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={14} /> Add your first contact
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Name</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Company</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Position</th>
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Last Emailed</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-10 text-center text-sm text-slate-400">
                    No contacts match &ldquo;{query}&rdquo;
                  </td>
                </tr>
              ) : (
                filtered.map((c) => {
                  const last = lastEmailed(c.email, log);
                  return (
                    <tr key={c.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-5 py-3.5">
                        <Link href={`/contacts/${c.id}`} className="flex items-center gap-3">
                          <InitialsAvatar name={c.name} email={c.email} size="sm" />
                          <div className="min-w-0">
                            <p className="font-medium text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                              {c.name || <span className="text-slate-400 italic">No name</span>}
                            </p>
                            <p className="text-xs text-slate-400 truncate">{c.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-5 py-3.5 text-slate-600">
                        {c.company || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5 text-slate-500">
                        {c.position || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        {last ? (
                          <span className="text-xs text-slate-500">{formatDate(last)}</span>
                        ) : (
                          <span className="text-xs text-slate-300">Never</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          {c.linkedin && (
                            <a
                              href={c.linkedin.startsWith("http") ? c.linkedin : `https://${c.linkedin}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="LinkedIn"
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Linkedin size={14} />
                            </a>
                          )}
                          <a
                            href={`mailto:${c.email}`}
                            title="Quick email"
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Mail size={14} />
                          </a>
                          <button
                            onClick={() => deleteContact(c.id)}
                            title="Delete"
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add contact modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-slate-900">Add contact</h2>
              <button onClick={() => setShowAdd(false)} className="text-slate-400 hover:text-slate-600">
                <X size={18} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                  Email <span className="text-red-400">*</span>
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="jane@acme.com"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Jane Smith"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={form.position}
                  onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  placeholder="Head of Marketing"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                  Company
                </label>
                <input
                  type="text"
                  value={form.company}
                  onChange={(e) => setForm((f) => ({ ...f, company: e.target.value }))}
                  placeholder="Acme Ltd"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">
                  LinkedIn URL
                </label>
                <input
                  type="url"
                  value={form.linkedin}
                  onChange={(e) => setForm((f) => ({ ...f, linkedin: e.target.value }))}
                  placeholder="https://linkedin.com/in/janesmith"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 transition-colors">
                Cancel
              </button>
              <button
                onClick={saveContact}
                disabled={!form.email}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-xl transition-colors"
              >
                Save contact
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
