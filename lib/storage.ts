import type { Campaign, StoredContact, EmailRecord, ScheduledPost, EmailTemplate, Deal, MediaKit, Brand } from "./types";

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

// ── Scheduled Posts ─────────────────────────────────────────

export function getScheduledPosts(): ScheduledPost[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("ginaos_scheduled_posts") || "[]");
}

export function saveScheduledPosts(posts: ScheduledPost[]): void {
  localStorage.setItem("ginaos_scheduled_posts", JSON.stringify(posts));
}

export function upsertScheduledPost(post: ScheduledPost): void {
  const all = getScheduledPosts();
  const idx = all.findIndex((p) => p.id === post.id);
  if (idx >= 0) all[idx] = post;
  else all.push(post);
  saveScheduledPosts(all);
}

export function deleteScheduledPost(id: string): void {
  saveScheduledPosts(getScheduledPosts().filter((p) => p.id !== id));
}

// ── Email Templates ─────────────────────────────────────────

export function getTemplates(): EmailTemplate[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("ginaos_templates") || "[]");
}

export function saveTemplates(templates: EmailTemplate[]): void {
  localStorage.setItem("ginaos_templates", JSON.stringify(templates));
}

export function upsertTemplate(template: EmailTemplate): void {
  const all = getTemplates();
  const idx = all.findIndex((t) => t.id === template.id);
  if (idx >= 0) all[idx] = template;
  else all.unshift(template);
  saveTemplates(all);
}

export function deleteTemplate(id: string): void {
  saveTemplates(getTemplates().filter((t) => t.id !== id));
}

// ── Signature ───────────────────────────────────────────────

export function getSignature(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem("ginaos_signature") || "";
}

export function saveSignature(sig: string): void {
  localStorage.setItem("ginaos_signature", sig);
}

// ── Deal Pipeline ───────────────────────────────────────────

export function getDeals(): Deal[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("ginaos_deals") || "[]");
}

export function saveDeals(deals: Deal[]): void {
  localStorage.setItem("ginaos_deals", JSON.stringify(deals));
}

export function upsertDeal(deal: Deal): void {
  const all = getDeals();
  const idx = all.findIndex((d) => d.id === deal.id);
  if (idx >= 0) all[idx] = deal;
  else all.unshift(deal);
  saveDeals(all);
}

export function deleteDeal(id: string): void {
  saveDeals(getDeals().filter((d) => d.id !== id));
}

// ── Media Kit ───────────────────────────────────────────────

const MEDIA_KIT_KEY = "ginaos_media_kit";

export const DEFAULT_MEDIA_KIT: MediaKit = {
  name: "",
  handle: "",
  tagline: "",
  bio: "",
  email: "",
  rates: [
    { label: "Instagram Story", price: "" },
    { label: "Instagram Reel", price: "" },
    { label: "Instagram Feed Post", price: "" },
  ],
  pastBrands: [],
};

export function getMediaKit(): MediaKit {
  if (typeof window === "undefined") return { ...DEFAULT_MEDIA_KIT };
  const stored = localStorage.getItem(MEDIA_KIT_KEY);
  return stored ? { ...DEFAULT_MEDIA_KIT, ...JSON.parse(stored) } : { ...DEFAULT_MEDIA_KIT };
}

export function saveMediaKit(kit: MediaKit): void {
  localStorage.setItem(MEDIA_KIT_KEY, JSON.stringify(kit));
}

// ── Brand Monitor ───────────────────────────────────────────

export function getBrands(): Brand[] {
  if (typeof window === "undefined") return [];
  return JSON.parse(localStorage.getItem("ginaos_brands") || "[]");
}

export function saveBrands(brands: Brand[]): void {
  localStorage.setItem("ginaos_brands", JSON.stringify(brands));
}

// ── Merge tags ─────────────────────────────────────────────

export function applyMerge(
  template: string,
  contact: { name?: string; email?: string; position?: string; company?: string },
  signature?: string
): string {
  const firstName = contact.name ? contact.name.split(" ")[0] : "";
  const sig = signature ?? (typeof window !== "undefined" ? getSignature() : "");
  return template
    // legacy double-brace format
    .replace(/\{\{name\}\}/g, contact.name || "")
    .replace(/\{\{email\}\}/g, contact.email || "")
    .replace(/\{\{position\}\}/g, contact.position || "")
    .replace(/\{\{company\}\}/g, contact.company || "")
    // new bracket format
    .replace(/\[FirstName\]/g, firstName)
    .replace(/\[BusinessName\]/g, contact.company || "")
    .replace(/\[Signature\]/g, sig);
}
