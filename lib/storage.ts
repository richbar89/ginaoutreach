import type { Campaign, StoredContact, EmailRecord, ScheduledPost, Recipe } from "./types";

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

// ── Recipes ─────────────────────────────────────────────────

export async function getRecipes(): Promise<Recipe[]> {
  try {
    const res = await fetch("/api/recipes");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function upsertRecipe(recipe: Recipe): Promise<void> {
  await fetch("/api/recipes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(recipe),
  });
}

export async function deleteRecipe(id: string): Promise<void> {
  await fetch(`/api/recipes/${id}`, { method: "DELETE" });
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
