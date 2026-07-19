// Thin Nylas v3 client (raw REST — no SDK dependency). Server-side only.
// All connect / send / inbox / reply-detection traffic goes through this
// module, so a future provider change touches only this file.

import { getSupabaseAdmin } from "@/lib/supabase";

const API = process.env.NYLAS_API_URI ?? "https://api.eu.nylas.com";

function apiKey(): string {
  const key = process.env.NYLAS_API_KEY;
  if (!key) throw new Error("NYLAS_API_KEY is not set");
  return key;
}

// ── Hosted auth ──────────────────────────────────────────────────

export function nylasAuthUrl(redirectUri: string, state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.NYLAS_CLIENT_ID!,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    state,
  });
  return `${API}/v3/connect/auth?${params.toString()}`;
}

export async function exchangeCodeForGrant(
  code: string,
  redirectUri: string
): Promise<{ grantId: string; email: string }> {
  const res = await fetch(`${API}/v3/connect/token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.NYLAS_CLIENT_ID,
      client_secret: apiKey(),
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
    }),
  });
  if (!res.ok) {
    throw new Error(`Nylas token exchange failed (${res.status}): ${await res.text()}`);
  }
  const data = await res.json();
  return { grantId: data.grant_id, email: data.email };
}

export async function revokeGrant(grantId: string): Promise<void> {
  await fetch(`${API}/v3/grants/${grantId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey()}` },
  }).catch(() => {});
}

// ── Account lookup ───────────────────────────────────────────────

export interface EmailAccount {
  email: string;
  grantId: string;
}

export async function getAccountForUser(userId: string): Promise<EmailAccount | null> {
  const db = getSupabaseAdmin();
  const { data } = await db
    .from("user_email_accounts")
    .select("email, nylas_grant_id")
    .eq("user_id", userId)
    .single();
  if (!data?.nylas_grant_id) return null;
  return { email: data.email, grantId: data.nylas_grant_id };
}

// ── Sending ──────────────────────────────────────────────────────

/** Campaign bodies are written as plain text; Nylas expects HTML. */
export function textToHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}

export interface SendResult {
  messageId: string;
  threadId: string;
}

export async function sendMessage(
  grantId: string,
  opts: {
    to: { email: string; name?: string };
    subject: string;
    htmlBody: string;
    replyToMessageId?: string;
  }
): Promise<SendResult> {
  const payload: Record<string, unknown> = {
    to: [opts.to],
    subject: opts.subject,
    body: opts.htmlBody,
  };
  if (opts.replyToMessageId) payload.reply_to_message_id = opts.replyToMessageId;

  const res = await fetch(`${API}/v3/grants/${grantId}/messages/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Nylas send failed (${res.status}): ${await res.text()}`);
  }
  const { data } = await res.json();
  return { messageId: data.id, threadId: data.thread_id };
}

// ── Inbox ────────────────────────────────────────────────────────

export interface InboxMessage {
  id: string;
  threadId: string;
  subject: string;
  from: { name: string; address: string };
  date: string; // ISO
  isRead: boolean;
  snippet: string;
}

interface RawMessage {
  id: string;
  thread_id: string;
  subject?: string;
  from?: { name?: string; email?: string }[];
  date?: number; // unix seconds
  unread?: boolean;
  snippet?: string;
  body?: string;
}

function toInboxMessage(m: RawMessage): InboxMessage {
  const sender = m.from?.[0];
  return {
    id: m.id,
    threadId: m.thread_id,
    subject: m.subject || "(no subject)",
    from: {
      name: sender?.name || sender?.email || "",
      address: sender?.email || "",
    },
    date: m.date ? new Date(m.date * 1000).toISOString() : "",
    isRead: !m.unread,
    snippet: m.snippet ?? "",
  };
}

export async function listInboxMessages(grantId: string, limit = 50): Promise<InboxMessage[]> {
  const params = new URLSearchParams({ limit: String(limit), in: "INBOX" });
  const res = await fetch(`${API}/v3/grants/${grantId}/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) {
    throw new Error(`Nylas list messages failed (${res.status}): ${await res.text()}`);
  }
  const { data } = await res.json();
  return ((data ?? []) as RawMessage[]).map(toInboxMessage);
}

/** Rough plain-text rendering of an HTML email body for the reading pane. */
function htmlToText(html: string): string {
  // Already plain text — leave its line breaks alone
  if (!/<[a-z!][^>]*>/i.test(html)) return html.trim();

  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    // Source-formatting whitespace in HTML is insignificant
    .replace(/[\r\n\t]+/g, " ")
    // Gmail wraps each line as <div>text<br></div> — the br is redundant
    .replace(/<br\s*\/?>\s*(<\/(?:div|p|li|td)>)/gi, "$1")
    .replace(/<br\s*\/?>/gi, "\n")
    // Real paragraph boundaries get a blank line…
    .replace(/<\/(p|h[1-6]|blockquote|ul|ol|table)>/gi, "\n\n")
    // …block containers just a line break
    .replace(/<\/(div|tr|li)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&(?:rsquo|lsquo);/g, "'")
    .replace(/&(?:rdquo|ldquo);/g, '"')
    .replace(/&mdash;/g, "—")
    .replace(/&ndash;/g, "–")
    .replace(/&hellip;/g, "…")
    // Tidy: strip spaces hugging line breaks, cap blank runs, collapse doubles
    .replace(/[  ]*\n[  ]*/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/ {2,}/g, " ")
    .trim();
}

export async function getMessage(
  grantId: string,
  messageId: string
): Promise<InboxMessage & { body: string; bodyHtml: string }> {
  const res = await fetch(`${API}/v3/grants/${grantId}/messages/${messageId}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) {
    throw new Error(`Nylas get message failed (${res.status}): ${await res.text()}`);
  }
  const { data } = (await res.json()) as { data: RawMessage };

  // Mark as read — best effort, don't block the response on it
  fetch(`${API}/v3/grants/${grantId}/messages/${messageId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${apiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ unread: false }),
  }).catch(() => {});

  return {
    ...toInboxMessage(data),
    isRead: true,
    body: htmlToText(data.body ?? ""),
    bodyHtml: data.body ?? "",
  };
}

export async function deleteMessage(grantId: string, messageId: string): Promise<void> {
  const res = await fetch(`${API}/v3/grants/${grantId}/messages/${messageId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) {
    throw new Error(`Nylas delete message failed (${res.status}): ${await res.text()}`);
  }
}

// ── Reply detection ──────────────────────────────────────────────

const AUTO_REPLY_SUBJECTS = [
  "out of office", "automatic reply", "auto-reply", "autoreply",
  "on vacation", "away from", "on annual leave", "on leave",
  "i am away", "i'm away", "i am out", "i'm out", "be back",
];

/** True if fromEmail sent a genuine (non-auto) reply after the given time. */
export async function hasGenuineReplyFrom(
  grantId: string,
  fromEmail: string,
  receivedAfterUnix: number
): Promise<boolean> {
  const params = new URLSearchParams({
    from: fromEmail,
    received_after: String(receivedAfterUnix),
    limit: "10",
  });
  const res = await fetch(`${API}/v3/grants/${grantId}/messages?${params.toString()}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!res.ok) return false;
  const { data } = await res.json();
  return ((data ?? []) as RawMessage[]).some(m => {
    const subject = (m.subject ?? "").toLowerCase();
    return !AUTO_REPLY_SUBJECTS.some(s => subject.includes(s));
  });
}
