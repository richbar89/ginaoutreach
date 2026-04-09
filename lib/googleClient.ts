// Google OAuth + Gmail send + Gmail inbox — mirrors the Microsoft/graphClient pattern
import type { InboxMessage, MessageDetail } from "./graphClient";

// ── Gmail inbox helpers ──────────────────────────────────────────

type GmailHeader = { name: string; value: string };
type GmailPayload = {
  mimeType?: string;
  headers?: GmailHeader[];
  body?: { data?: string };
  parts?: GmailPayload[];
};
type GmailMsg = {
  id: string;
  labelIds: string[];
  snippet: string;
  payload: GmailPayload;
  internalDate: string;
};

function parseFrom(raw: string): { name: string; address: string } {
  const m = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (m) return { name: m[1].trim(), address: m[2].trim() };
  return { name: raw.trim(), address: raw.trim() };
}

function extractText(payload: GmailPayload): string {
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return atob(payload.body.data.replace(/-/g, "+").replace(/_/g, "/"));
  }
  for (const part of payload.parts ?? []) {
    const t = extractText(part);
    if (t) return t;
  }
  return "";
}

async function gFetch(path: string, init?: RequestInit): Promise<Response> {
  const token = localStorage.getItem("google_access_token");
  if (!token) throw new Error("Not connected to Gmail.");
  return fetch(`https://gmail.googleapis.com/gmail/v1/users/me${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
}

export async function getGmailMessages(): Promise<InboxMessage[]> {
  const listRes = await gFetch("/messages?labelIds=INBOX&maxResults=30");
  if (listRes.status === 401) throw new Error("Gmail session expired. Please reconnect in Settings.");
  if (!listRes.ok) throw new Error("Failed to fetch Gmail inbox.");
  const { messages: ids = [] } = await listRes.json();

  const results = await Promise.all(
    (ids as { id: string }[]).map(async ({ id }) => {
      const r = await gFetch(`/messages/${id}?format=metadata&metadataHeaders=From,Subject,Date`);
      if (!r.ok) return null;
      const msg: GmailMsg = await r.json();
      const h = (name: string) => msg.payload.headers?.find(x => x.name.toLowerCase() === name)?.value ?? "";
      const from = parseFrom(h("from"));
      const dateStr = h("date");
      return {
        id: msg.id,
        subject: h("subject") || "(no subject)",
        from: { emailAddress: { name: from.name, address: from.address } },
        receivedDateTime: dateStr ? new Date(dateStr).toISOString() : new Date(Number(msg.internalDate)).toISOString(),
        isRead: !msg.labelIds.includes("UNREAD"),
        bodyPreview: msg.snippet ?? "",
      } as InboxMessage;
    })
  );
  return results.filter(Boolean) as InboxMessage[];
}

export async function getGmailMessageDetail(id: string): Promise<MessageDetail> {
  const r = await gFetch(`/messages/${id}?format=full`);
  if (!r.ok) throw new Error("Failed to load message.");
  const msg: GmailMsg = await r.json();
  const h = (name: string) => msg.payload.headers?.find(x => x.name.toLowerCase() === name)?.value ?? "";
  const from = parseFrom(h("from"));
  const dateStr = h("date");
  return {
    id: msg.id,
    subject: h("subject") || "(no subject)",
    from: { emailAddress: { name: from.name, address: from.address } },
    receivedDateTime: dateStr ? new Date(dateStr).toISOString() : new Date(Number(msg.internalDate)).toISOString(),
    isRead: !msg.labelIds.includes("UNREAD"),
    bodyPreview: msg.snippet ?? "",
    body: { content: extractText(msg.payload) || msg.snippet || "", contentType: "text" },
  };
}

export async function markGmailAsRead(id: string): Promise<void> {
  await gFetch(`/messages/${id}/modify`, {
    method: "POST",
    body: JSON.stringify({ removeLabelIds: ["UNREAD"] }),
  });
}

export function getGoogleUser(): { name: string; email: string } | null {
  if (typeof window === "undefined") return null;
  const email = localStorage.getItem("google_user_email");
  const name = localStorage.getItem("google_user_name");
  if (!email) return null;
  return { email, name: name || email };
}

export function signOutFromGoogle(): void {
  localStorage.removeItem("google_access_token");
  localStorage.removeItem("google_user_email");
  localStorage.removeItem("google_user_name");
  localStorage.removeItem("google_token_expires_at");
}

/** Returns true if the stored Gmail token is missing or expired */
export function isGoogleTokenExpired(): boolean {
  if (typeof window === "undefined") return false;
  const token = localStorage.getItem("google_access_token");
  if (!token) return true;
  const expiresAt = Number(localStorage.getItem("google_token_expires_at") || "0");
  // Treat as expired 5 minutes before actual expiry
  return expiresAt > 0 && Date.now() > expiresAt - 5 * 60 * 1000;
}

export function signInWithGoogle(): Promise<{ name: string; email: string }> {
  return new Promise((resolve, reject) => {
    const popup = window.open(
      "/api/auth/google/connect",
      "google-oauth",
      "width=500,height=620,left=100,top=100"
    );

    const handler = (event: MessageEvent) => {
      if (event.data?.type !== "google-oauth") return;
      window.removeEventListener("message", handler);
      clearInterval(pollClosed);

      if (event.data.error) {
        reject(new Error(event.data.error));
        return;
      }

      const { email, name, access_token } = event.data;
      localStorage.setItem("google_access_token", access_token);
      localStorage.setItem("google_user_email", email);
      localStorage.setItem("google_user_name", name || email);
      // Store expiry — Google access tokens last 1 hour
      localStorage.setItem("google_token_expires_at", String(Date.now() + 3600 * 1000));
      resolve({ email, name: name || email });
    };

    window.addEventListener("message", handler);

    // Detect popup closed without completing
    const pollClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(pollClosed);
        window.removeEventListener("message", handler);
        reject(new Error("cancelled"));
      }
    }, 500);
  });
}

export async function sendEmailViaGmail({
  to,
  subject,
  body,
}: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  const accessToken = localStorage.getItem("google_access_token");
  if (!accessToken) throw new Error("Not connected to Gmail. Please reconnect in Settings.");

  // Build RFC 2822 message
  const message = [
    `To: ${to}`,
    `Subject: ${subject}`,
    "Content-Type: text/plain; charset=utf-8",
    "MIME-Version: 1.0",
    "",
    body,
  ].join("\r\n");

  // Base64url encode (required by Gmail API)
  const encoded = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");

  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ raw: encoded }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      throw new Error("Gmail session expired. Please reconnect in Settings.");
    }
    throw new Error(err.error?.message || "Failed to send email via Gmail.");
  }
}
