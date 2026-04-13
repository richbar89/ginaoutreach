/**
 * lib/db.ts — async Supabase equivalents of every lib/storage.ts function.
 * Each function takes a Supabase client (from useDb()) as its first argument.
 */

import { createSupabaseClient } from "./supabase";
import type { Campaign, Deal, EmailRecord, EmailTemplate, ScheduledPost, MediaKit, Brand } from "./types";
import { DEFAULT_MEDIA_KIT } from "./storage";

type DB = ReturnType<typeof createSupabaseClient>;

// ── Campaigns ───────────────────────────────────────────────

export async function dbGetCampaigns(db: DB): Promise<Campaign[]> {
  const { data } = await db
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  return (data || []).map(rowToCampaign);
}

export async function dbSaveCampaign(db: DB, campaign: Campaign): Promise<void> {
  await db.from("campaigns").upsert({
    id: campaign.id,
    name: campaign.name,
    subject: campaign.subject,
    body: campaign.body,
    contacts: campaign.contacts,
    created_at: campaign.createdAt,
  });
}

export async function dbDeleteCampaign(db: DB, id: string): Promise<void> {
  await db.from("campaigns").delete().eq("id", id);
}

function rowToCampaign(r: Record<string, unknown>): Campaign {
  return {
    id: r.id as string,
    name: r.name as string,
    subject: r.subject as string,
    body: r.body as string,
    contacts: (r.contacts as Campaign["contacts"]) || [],
    createdAt: r.created_at as string,
  };
}

// ── Email log ───────────────────────────────────────────────

export async function dbGetEmailLog(db: DB): Promise<EmailRecord[]> {
  const { data } = await db
    .from("email_log")
    .select("*")
    .order("sent_at", { ascending: false });
  return (data || []).map(rowToEmailRecord);
}

export async function dbAppendEmailRecord(
  db: DB,
  record: Omit<EmailRecord, "id" | "sentAt">
): Promise<void> {
  await db.from("email_log").insert({
    contact_email: record.contactEmail.toLowerCase(),
    subject: record.subject,
    body: record.body,
    campaign_id: record.campaignId || null,
    campaign_name: record.campaignName || null,
  });
}

export async function dbGetContactEmailLog(db: DB, email: string): Promise<EmailRecord[]> {
  const { data } = await db
    .from("email_log")
    .select("*")
    .eq("contact_email", email.toLowerCase())
    .order("sent_at", { ascending: false });
  return (data || []).map(rowToEmailRecord);
}

function rowToEmailRecord(r: Record<string, unknown>): EmailRecord {
  return {
    id: r.id as string,
    contactEmail: r.contact_email as string,
    subject: r.subject as string,
    body: r.body as string,
    sentAt: r.sent_at as string,
    campaignId: r.campaign_id as string | undefined,
    campaignName: r.campaign_name as string | undefined,
  };
}

// ── Deals ───────────────────────────────────────────────────

export async function dbGetDeals(db: DB): Promise<Deal[]> {
  const { data, error } = await db
    .from("deals")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []).map(rowToDeal);
}

export async function dbUpsertDeal(db: DB, deal: Deal, userId?: string): Promise<void> {
  if (!userId) throw new Error("userId is required to save a deal");
  const { error } = await db.from("deals").upsert({
    id: deal.id,
    user_id: userId,
    contact_email: deal.contactEmail,
    contact_name: deal.contactName,
    company: deal.company,
    status: deal.status,
    value: deal.value || null,
    notes: deal.notes || null,
    created_at: deal.createdAt,
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(error.message);
}

export async function dbDeleteDeal(db: DB, id: string): Promise<void> {
  await db.from("deals").delete().eq("id", id);
}

function rowToDeal(r: Record<string, unknown>): Deal {
  return {
    id: r.id as string,
    contactEmail: r.contact_email as string,
    contactName: r.contact_name as string,
    company: r.company as string,
    status: r.status as Deal["status"],
    value: r.value as string | undefined,
    notes: r.notes as string | undefined,
    createdAt: r.created_at as string,
    updatedAt: r.updated_at as string,
  };
}

// ── Templates ───────────────────────────────────────────────

export async function dbGetTemplates(db: DB): Promise<EmailTemplate[]> {
  const { data } = await db
    .from("templates")
    .select("*")
    .order("created_at", { ascending: false });
  return (data || []).map(rowToTemplate);
}

export async function dbUpsertTemplate(db: DB, template: EmailTemplate): Promise<void> {
  await db.from("templates").upsert({
    id: template.id,
    name: template.name,
    subject: template.subject,
    body: template.body,
    created_at: template.createdAt,
  });
}

export async function dbDeleteTemplate(db: DB, id: string): Promise<void> {
  await db.from("templates").delete().eq("id", id);
}

function rowToTemplate(r: Record<string, unknown>): EmailTemplate {
  return {
    id: r.id as string,
    name: r.name as string,
    subject: r.subject as string,
    body: r.body as string,
    createdAt: r.created_at as string,
  };
}

// ── Scheduled posts ─────────────────────────────────────────

export async function dbGetScheduledPosts(db: DB): Promise<ScheduledPost[]> {
  const { data } = await db
    .from("scheduled_posts")
    .select("*")
    .order("date", { ascending: true });
  return (data || []).map(rowToPost);
}

export async function dbUpsertScheduledPost(db: DB, post: ScheduledPost): Promise<void> {
  await db.from("scheduled_posts").upsert({
    id: post.id,
    date: post.date,
    time: post.time || null,
    platforms: post.platforms,
    media_type: post.mediaType,
    caption: post.caption || null,
    status: post.status,
    notes: post.notes || null,
    created_at: post.createdAt,
  });
}

export async function dbDeleteScheduledPost(db: DB, id: string): Promise<void> {
  await db.from("scheduled_posts").delete().eq("id", id);
}

function rowToPost(r: Record<string, unknown>): ScheduledPost {
  return {
    id: r.id as string,
    date: r.date as string,
    time: r.time as string | undefined,
    platforms: (r.platforms as ScheduledPost["platforms"]) || [],
    mediaType: r.media_type as ScheduledPost["mediaType"],
    caption: r.caption as string | undefined,
    status: r.status as ScheduledPost["status"],
    notes: r.notes as string | undefined,
    createdAt: r.created_at as string,
  };
}

// ── Brands ──────────────────────────────────────────────────

export async function dbGetBrands(db: DB): Promise<Brand[]> {
  const { data } = await db.from("brands").select("*");
  return (data || []).map((r) => ({ name: r.name as string, runningAds: r.running_ads as boolean }));
}

export async function dbSaveBrands(db: DB, brands: Brand[]): Promise<void> {
  // Replace all brands for this user
  await db.from("brands").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  if (brands.length > 0) {
    await db.from("brands").insert(brands.map((b) => ({ name: b.name, running_ads: b.runningAds })));
  }
}

// ── User settings (signature + media kit) ───────────────────

export async function dbGetSignature(db: DB): Promise<string> {
  const { data } = await db.from("user_settings").select("signature").maybeSingle();
  return (data?.signature as string) || "";
}

export async function dbSaveSignature(db: DB, sig: string): Promise<void> {
  await db.from("user_settings").upsert({ signature: sig });
}

export async function dbGetMediaKit(db: DB): Promise<MediaKit> {
  const { data } = await db.from("user_settings").select("media_kit").maybeSingle();
  return data?.media_kit ? { ...DEFAULT_MEDIA_KIT, ...(data.media_kit as object) } : { ...DEFAULT_MEDIA_KIT };
}

export async function dbSaveMediaKit(db: DB, kit: MediaKit): Promise<void> {
  await db.from("user_settings").upsert({ media_kit: kit });
}
