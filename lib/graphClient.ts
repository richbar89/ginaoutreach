import { getMsalInstance } from "./msalInstance";
import type { AccountInfo } from "@azure/msal-browser";

export const GRAPH_SCOPES = ["Mail.Send", "User.Read"];

export async function signInWithMicrosoft(): Promise<AccountInfo> {
  const msal = await getMsalInstance();
  if (!msal) throw new Error("Configure an Azure Client ID in Settings first.");
  const result = await msal.loginPopup({ scopes: GRAPH_SCOPES });
  // Cache user info in localStorage so all pages can read it without re-initialising MSAL
  localStorage.setItem("ms_user_email", result.account.username);
  localStorage.setItem("ms_user_name", result.account.name || result.account.username);
  return result.account;
}

export async function signOutFromMicrosoft(): Promise<void> {
  const msal = await getMsalInstance();
  localStorage.removeItem("ms_user_email");
  localStorage.removeItem("ms_user_name");
  if (!msal) return;
  const account = msal.getAllAccounts()[0];
  if (account) await msal.logoutPopup({ account });
}

export function getMicrosoftUser(): { name: string; email: string } | null {
  if (typeof window === "undefined") return null;
  const email = localStorage.getItem("ms_user_email");
  const name = localStorage.getItem("ms_user_name");
  if (!email) return null;
  return { email, name: name || email };
}

async function acquireToken(): Promise<string> {
  const msal = await getMsalInstance();
  if (!msal) throw new Error("Not connected to Microsoft.");
  const account = msal.getAllAccounts()[0];
  if (!account) throw new Error("Please sign in with Microsoft first.");
  try {
    const r = await msal.acquireTokenSilent({ scopes: GRAPH_SCOPES, account });
    return r.accessToken;
  } catch {
    const r = await msal.acquireTokenPopup({ scopes: GRAPH_SCOPES, account });
    return r.accessToken;
  }
}

export async function sendEmailViaGraph(params: {
  to: string;
  subject: string;
  body: string;
}): Promise<void> {
  const token = await acquireToken();
  const res = await fetch("https://graph.microsoft.com/v1.0/me/sendMail", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: params.subject,
        body: { contentType: "Text", content: params.body },
        toRecipients: [{ emailAddress: { address: params.to } }],
      },
      saveToSentItems: true,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `Graph error ${res.status}`);
  }
}
