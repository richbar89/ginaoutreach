"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Pencil, Check, X, ExternalLink, Linkedin } from "lucide-react";
import InitialsAvatar from "@/components/InitialsAvatar";
import { getContacts, upsertContact, getContactEmailLog } from "@/lib/storage";
import type { StoredContact, EmailRecord } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function ContactProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [contact, setContact] = useState<StoredContact | null>(null);
  const [history, setHistory] = useState<EmailRecord[]>([]);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);

  useEffect(() => {
    const all = getContacts();
    const found = all.find((c) => c.id === id);
    if (!found) { router.push("/contacts"); return; }
    setContact(found);
    setNotes(found.notes || "");
    setHistory(getContactEmailLog(found.email));
  }, [id, router]);

  if (!contact) return null;

  const saveField = (field: keyof StoredContact) => {
    const updated = { ...contact, [field]: editValue };
    setContact(updated);
    upsertContact(updated);
    setEditingField(null);
  };

  const saveNotes = () => {
    const updated = { ...contact, notes };
    setContact(updated);
    upsertContact(updated);
    setNotesDirty(false);
  };

  const EditableField = ({
    field, label, value,
  }: { field: keyof StoredContact; label: string; value: string }) => (
    <div>
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-1">{label}</p>
      {editingField === field ? (
        <div className="flex items-center gap-2">
          <input
            autoFocus
            type={field === "email" ? "email" : "text"}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") saveField(field);
              if (e.key === "Escape") setEditingField(null);
            }}
            className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={() => saveField(field)} className="text-green-600 hover:text-green-700">
            <Check size={16} />
          </button>
          <button onClick={() => setEditingField(null)} className="text-slate-400 hover:text-slate-600">
            <X size={15} />
          </button>
        </div>
      ) : (
        <div
          className="group flex items-center gap-2 cursor-pointer"
          onClick={() => { setEditingField(field); setEditValue(value); }}
        >
          <span className={`text-sm ${value ? "text-slate-800" : "text-slate-300 italic"}`}>
            {value || `No ${label.toLowerCase()}`}
          </span>
          <Pencil size={12} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-6 transition-colors"
      >
        <ArrowLeft size={14} /> Back to contacts
      </Link>

      {/* Profile header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
        <div className="flex items-start gap-4">
          <InitialsAvatar name={contact.name} email={contact.email} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              {contact.name || contact.email}
            </h1>
            {contact.position && contact.company && (
              <p className="text-sm text-slate-500 mt-0.5">
                {contact.position} at {contact.company}
              </p>
            )}
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
              >
                <Mail size={12} />
                Send email
              </a>
              {contact.linkedin && (
                <a
                  href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-lg transition-colors"
                >
                  <Linkedin size={12} />
                  LinkedIn
                  <ExternalLink size={10} className="opacity-70" />
                </a>
              )}
              <span className="text-xs text-slate-400">
                Added {formatDate(contact.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {/* Editable fields */}
        <div className="grid grid-cols-2 gap-5 mt-6 pt-6 border-t border-slate-100">
          <EditableField field="name" label="Full Name" value={contact.name} />
          <EditableField field="email" label="Email" value={contact.email} />
          <EditableField field="position" label="Position" value={contact.position} />
          <EditableField field="company" label="Company" value={contact.company} />
          <EditableField field="linkedin" label="LinkedIn URL" value={contact.linkedin || ""} />
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-slate-800">Notes</h2>
          {notesDirty && (
            <button
              onClick={saveNotes}
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <Check size={12} /> Save
            </button>
          )}
        </div>
        <textarea
          rows={4}
          value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
          onBlur={saveNotes}
          placeholder="Add notes about this contact..."
          className="w-full px-3 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none leading-relaxed"
        />
      </div>

      {/* Email history */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Email History</h2>
          <span className="text-xs text-slate-400">
            {history.length} email{history.length !== 1 ? "s" : ""}
          </span>
        </div>

        {history.length === 0 ? (
          <div className="px-6 py-10 text-center">
            <p className="text-sm text-slate-400">No emails sent to this contact yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {history.map((record) => (
              <div key={record.id} className="px-6 py-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-900">{record.subject}</p>
                    {record.campaignName && (
                      <span className="text-xs px-2 py-0.5 bg-violet-50 text-violet-600 rounded-full font-medium">
                        {record.campaignName}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex-shrink-0">{formatDate(record.sentAt)}</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 whitespace-pre-line">
                  {record.body}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
