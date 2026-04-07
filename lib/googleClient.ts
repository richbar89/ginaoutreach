// Google OAuth + Gmail send — mirrors the Microsoft/graphClient pattern

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
