// Gmail SMTP credential helpers — send via App Password, no OAuth required

export function getGmailCredentials(): { email: string; appPassword: string } | null {
  if (typeof window === "undefined") return null;
  const email = localStorage.getItem("gmail_smtp_email");
  const appPassword = localStorage.getItem("gmail_smtp_password");
  if (!email || !appPassword) return null;
  return { email, appPassword };
}

export function setGmailCredentials(email: string, appPassword: string): void {
  localStorage.setItem("gmail_smtp_email", email);
  localStorage.setItem("gmail_smtp_password", appPassword);
}

export function clearGmailCredentials(): void {
  localStorage.removeItem("gmail_smtp_email");
  localStorage.removeItem("gmail_smtp_password");
}

/** Returns connected Gmail account info, or null if not set up. */
export function getGoogleUser(): { name: string; email: string } | null {
  const creds = getGmailCredentials();
  if (!creds) return null;
  return { email: creds.email, name: creds.email };
}

/** Clears stored SMTP credentials. */
export function signOutFromGoogle(): void {
  clearGmailCredentials();
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
  const creds = getGmailCredentials();
  if (!creds) throw new Error("Gmail not connected. Please add your App Password in Settings.");

  const res = await fetch("/api/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to, subject, body, gmailEmail: creds.email, appPassword: creds.appPassword }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Failed to send email via Gmail.");
  }
}
