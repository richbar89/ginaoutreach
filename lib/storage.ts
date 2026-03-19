import type { Campaign, StoredContact, EmailRecord } from "./types";

// ── Campaigns ──────────────────────────────────────────────

export function getCampaigns(): Campaign[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("mailflow_campaigns") || "[]");
}

export function saveCampaigns(campaigns: Campaign[]): void {
  localStorage.setItem("mailflow_campaigns", JSON.stringify(campaigns));
}

// ── Contacts ───────────────────────────────────────────────

export function getContacts(): StoredContact[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("mailflow_contacts") || "[]");
}

export function saveContacts(contacts: StoredContact[]): void {
  localStorage.setItem("mailflow_contacts", JSON.stringify(contacts));
}

export function upsertContact(contact: StoredContact): void {
  const all = getContacts();
  const idx = all.findIndex((c) => c.id === contact.id);
  if (idx >= 0) all[idx] = contact;
  else all.unshift(contact);
  saveContacts(all);
}

// ── Email log ──────────────────────────────────────────────

export function getEmailLog(): EmailRecord[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("mailflow_email_log") || "[]");
}

export function appendEmailRecord(
  record: Omit<EmailRecord, "id" | "sentAt">
): void {
  const log = getEmailLog();
  log.unshift({
    ...record,
    id: crypto.randomUUID(),
    contactEmail: record.contactEmail.toLowerCase(),
    sentAt: new Date().toISOString(),
  });
  localStorage.setItem("mailflow_email_log", JSON.stringify(log));
}

export function getContactEmailLog(email: string): EmailRecord[] {
  return getEmailLog().filter(
    (r) => r.contactEmail === email.toLowerCase()
  );
}

// ── Merge tags ─────────────────────────────────────────────

export function applyMerge(
  template: string,
  contact: { name?: string; email?: string; position?: string; company?: string }
): string {
  return template
    .replace(/\{\{name\}\}/g, contact.name || "")
    .replace(/\{\{email\}\}/g, contact.email || "")
    .replace(/\{\{position\}\}/g, contact.position || "")
    .replace(/\{\{company\}\}/g, contact.company || "");
}
