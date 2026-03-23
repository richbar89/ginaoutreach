import { getMsalInstance } from "./msalInstance";
import type { AccountInfo } from "@azure/msal-browser";

export const GRAPH_SCOPES = ["Mail.Send", "User.Read"];

export async function signInWithMicrosoft(): Promise<AccountInfo> {
  const msal = await getMsalInstance();
  if (!msal) throw new Error("Configure an Azure Client ID in Settings first.");
  const result = await msal.loginPopup({ scopes: GRAPH_SCOPES });
  return result.account;
}

export async function signOutFromMicrosoft(): Promise<void> {
  const msal = await getMsalInstance();
  if (!msal) return;
  const account = msal.getAllAccounts()[0];
  if (account) await msal.logoutPopup({ account });
}

export async function getMicrosoftUser(): Promise<{ name: string; email: string } | null> {
  const msal = await getMsalInstance();
  if (!msal) return null;
  const accounts = msal.getAllAccounts();
  if (!accounts.length) return null;
  return {
    name: accounts[0].name || accounts[0].username,
    email: accounts[0].username,
  };
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
