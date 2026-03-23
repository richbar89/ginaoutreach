"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Mail, Pencil, Check, X, Linkedin,
  AlertTriangle, Send, Building2, Briefcase, Clock, CheckCircle,
} from "lucide-react";
import InitialsAvatar from "@/components/InitialsAvatar";
import { getContacts, upsertContact, getContactEmailLog } from "@/lib/storage";
import { leads } from "@/lib/leads-data";
import type { StoredContact, EmailRecord } from "@/lib/types";

function weeksAgo(dateStr: string) {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 7);
}
function timeLabel(dateStr: string) {
  const w = weeksAgo(dateStr);
  if (w < 1) {
    const d = Math.floor(w * 7);
    return d <= 0 ? "today" : `${d} day${d !== 1 ? "s" : ""} ago`;
  }
  const ww = Math.floor(w);
  return `${ww} week${ww !== 1 ? "s" : ""} ago`;
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function RecencyAlert({ firstName, history }: { firstName: string; history: EmailRecord[] }) {
  if (!history.length) return null;
  const last = history[0];
  if (weeksAgo(last.sentAt) >= 4) return null;
  return (
    <div className="mb-6 flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
      <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-amber-800">
          {firstName} was contacted {timeLabel(last.sentAt)}
        </p>
        <p className="text-xs text-amber-600 mt-0.5">
          Do you need to reach out again, or give them more time?
        </p>
      </div>
    </div>
  );
}

function EmailHistory({ history, email, name }: { history: EmailRecord[]; email: string; name: string }) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-cream-100 flex items-center gap-2">
        <Clock size={14} className="text-navy-400" />
        <span className="text-sm font-semibold text-navy-700">Email History</span>
        {history.length > 0 && (
          <span className="ml-auto text-xs text-navy-400">
            {history.length} email{history.length !== 1 ? "s" : ""} sent
          </span>
        )}
      </div>
      {history.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <Mail size={28} className="text-cream-200 mx-auto mb-3" />
          <p className="text-sm text-navy-400">No emails sent yet.</p>
          <Link
            href={`/send?to=${encodeURIComponent(email)}&name=${encodeURIComponent(name)}`}
            className="inline-flex items-center gap-1.5 mt-4 text-xs text-coral-500 hover:text-coral-700 font-medium"
          >
            <Send size={12} /> Send your first email
          </Link>
        </div>
      ) : (
        <div className="divide-y divide-cream-100">
          {history.map((record) => (
            <div key={record.id} className="px-6 py-5">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                  <p className="text-sm font-semibold text-navy-900">{record.subject}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="text-xs text-navy-400">{formatDate(record.sentAt)}</p>
                  {record.campaignName && (
                    <p className="text-[10px] text-navy-300 mt-0.5">via {record.campaignName}</p>
                  )}
                </div>
              </div>
              <pre className="text-xs text-navy-500 whitespace-pre-wrap font-sans leading-relaxed bg-cream-50 rounded-xl px-4 py-3 border border-cream-100">
                {record.body}
              </pre>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Lead profile (read-only, from leads-data.ts)
function LeadProfile({ email }: { email: string }) {
  const lead = leads.find((l) => l.email.toLowerCase() === email.toLowerCase());
  if (!lead) return (
    <div className="p-10 text-center">
      <p className="text-navy-400 text-sm mb-4">Contact not found.</p>
      <Link href="/contacts" className="text-coral-500 text-sm hover:underline">Back to contacts</Link>
    </div>
  );
  const history = getContactEmailLog(email);
  const firstName = lead.name.split(" ")[0];
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/contacts" className="inline-flex items-center gap-1.5 text-sm text-navy-400 hover:text-navy-800 mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to contacts
      </Link>
      <RecencyAlert firstName={firstName} history={history} />
      <div className="bg-white border border-cream-200 rounded-2xl p-7 mb-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-serif text-xl font-bold"
              style={{ background: "linear-gradient(135deg, #e8715a, #d4533a)" }}>
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-navy-900 leading-tight">{lead.name}</h1>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {lead.position && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-navy-500">
                    <Briefcase size={12} className="text-navy-300" />{lead.position}
                  </span>
                )}
                {lead.company && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-navy-500">
                    <Building2 size={12} className="text-navy-300" />{lead.company}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5 text-xs text-navy-500">
                  <Mail size={12} className="text-navy-300" />{lead.email}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {lead.linkedin && (
              <a href={lead.linkedin.startsWith("http") ? lead.linkedin : `https://${lead.linkedin}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-cream-200 hover:border-navy-200 text-navy-600 text-xs font-medium rounded-xl transition-all">
                <Linkedin size={13} /> LinkedIn
              </a>
            )}
            <Link
              href={`/send?to=${encodeURIComponent(lead.email)}&name=${encodeURIComponent(lead.name)}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold rounded-xl transition-colors">
              <Send size={13} /> Send Email
            </Link>
          </div>
        </div>
      </div>
      <EmailHistory history={history} email={lead.email} name={lead.name} />
    </div>
  );
}

// Stored contact profile (editable)
function StoredContactProfile({ contact: initial }: { contact: StoredContact }) {
  const [contact, setContact] = useState(initial);
  const [history] = useState<EmailRecord[]>(() => getContactEmailLog(initial.email));
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [notes, setNotes] = useState(initial.notes || "");
  const [notesDirty, setNotesDirty] = useState(false);
  const firstName = contact.name.split(" ")[0];

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

  const EditableField = ({ field, label, value }: { field: keyof StoredContact; label: string; value: string }) => (
    <div>
      <p className="text-xs font-semibold text-navy-400 uppercase tracking-widest mb-1.5">{label}</p>
      {editingField === field ? (
        <div className="flex items-center gap-2">
          <input autoFocus type={field === "email" ? "email" : "text"} value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") saveField(field); if (e.key === "Escape") setEditingField(null); }}
            className="flex-1 input-base" />
          <button onClick={() => saveField(field)} className="text-emerald-500 hover:text-emerald-700"><Check size={16} /></button>
          <button onClick={() => setEditingField(null)} className="text-navy-300 hover:text-navy-600"><X size={15} /></button>
        </div>
      ) : (
        <div className="group flex items-center gap-2 cursor-pointer" onClick={() => { setEditingField(field); setEditValue(value); }}>
          <span className={`text-sm ${value ? "text-navy-800" : "text-navy-300 italic"}`}>{value || `No ${label.toLowerCase()}`}</span>
          <Pencil size={11} className="text-navy-200 group-hover:text-navy-400 transition-colors" />
        </div>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <Link href="/contacts" className="inline-flex items-center gap-1.5 text-sm text-navy-400 hover:text-navy-800 mb-6 transition-colors">
        <ArrowLeft size={14} /> Back to contacts
      </Link>
      <RecencyAlert firstName={firstName} history={history} />
      <div className="bg-white border border-cream-200 rounded-2xl p-7 mb-5 shadow-sm">
        <div className="flex items-start gap-5">
          <InitialsAvatar name={contact.name} email={contact.email} size="lg" />
          <div className="flex-1 min-w-0">
            <h1 className="font-serif text-2xl font-bold text-navy-900 tracking-tight">{contact.name || contact.email}</h1>
            {contact.position && contact.company && (
              <p className="text-sm text-navy-400 mt-0.5">{contact.position} at {contact.company}</p>
            )}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Link href={`/send?to=${encodeURIComponent(contact.email)}&name=${encodeURIComponent(contact.name)}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold rounded-xl transition-colors">
                <Send size={12} /> Send Email
              </Link>
              {contact.linkedin && (
                <a href={contact.linkedin.startsWith("http") ? contact.linkedin : `https://${contact.linkedin}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 border border-cream-200 hover:border-navy-200 text-navy-600 text-xs font-medium rounded-xl transition-all">
                  <Linkedin size={12} /> LinkedIn
                </a>
              )}
              <span className="text-xs text-navy-400">Added {formatDate(contact.createdAt)}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-5 mt-6 pt-6 border-t border-cream-100">
          <EditableField field="name" label="Full Name" value={contact.name} />
          <EditableField field="email" label="Email" value={contact.email} />
          <EditableField field="position" label="Position" value={contact.position} />
          <EditableField field="company" label="Company" value={contact.company} />
          <EditableField field="linkedin" label="LinkedIn URL" value={contact.linkedin || ""} />
        </div>
      </div>
      <div className="bg-white border border-cream-200 rounded-2xl p-6 mb-5 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-navy-800">Notes</h2>
          {notesDirty && (
            <button onClick={saveNotes} className="inline-flex items-center gap-1 text-xs text-coral-500 hover:text-coral-700 font-medium">
              <Check size={12} /> Save
            </button>
          )}
        </div>
        <textarea rows={4} value={notes}
          onChange={(e) => { setNotes(e.target.value); setNotesDirty(true); }}
          onBlur={saveNotes}
          placeholder="Add notes about this contact…"
          className="input-base resize-none leading-relaxed" />
      </div>
      <EmailHistory history={history} email={contact.email} name={contact.name} />
    </div>
  );
}

// Page: routes to the right profile based on whether id is a stored contact uuid or an encoded email
export default function ContactProfilePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [storedContact, setStoredContact] = useState<StoredContact | null | undefined>(undefined);

  useEffect(() => {
    const all = getContacts();
    const found = all.find((c) => c.id === id) ?? null;
    setStoredContact(found);
    if (!found) {
      const email = decodeURIComponent(id);
      const isLead = leads.some((l) => l.email.toLowerCase() === email.toLowerCase());
      if (!isLead) router.push("/contacts");
    }
  }, [id, router]);

  if (storedContact === undefined) return null;
  if (storedContact) return <StoredContactProfile contact={storedContact} />;
  return <LeadProfile email={decodeURIComponent(id)} />;
}
