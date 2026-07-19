// Client-side helpers for the connected email account (Nylas-backed).
// Credentials never touch the browser — the server holds the Nylas grant
// and every call here goes through our own authenticated API routes.

export interface ConnectedEmailAccount {
  email: string;
}

/** The user's connected email account, or null if none. */
export async function getEmailAccount(): Promise<ConnectedEmailAccount | null> {
  try {
    const res = await fetch("/api/email-account");
    if (!res.ok) return null;
    const data = await res.json();
    return data?.email ? { email: data.email } : null;
  } catch {
    return null;
  }
}

/** Href that starts the hosted OAuth connect flow; returns to returnTo after. */
export function connectEmailUrl(returnTo: string): string {
  return `/api/nylas/auth?returnTo=${encodeURIComponent(returnTo)}`;
}

export async function disconnectEmail(): Promise<void> {
  await fetch("/api/email-account", { method: "DELETE" });
}

export async function sendEmail({
  to,
  subject,
  body,
  replyToMessageId,
}: {
  to: string;
  subject: string;
  body: string;
  replyToMessageId?: string;
}): Promise<void> {
  const res = await fetch("/api/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, body, replyToMessageId }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to send email.");
  }
}
