import { PublicClientApplication, type Configuration } from "@azure/msal-browser";

let _instance: PublicClientApplication | null = null;
let _initialized = false;
let _configuredClientId: string | null = null;

export async function getMsalInstance(): Promise<PublicClientApplication | null> {
  if (typeof window === "undefined") return null;

  // Prefer user-configured client ID, fall back to shared app client ID from env
  const clientId =
    localStorage.getItem("azure_client_id") ||
    process.env.NEXT_PUBLIC_AZURE_CLIENT_ID ||
    null;
  if (!clientId) return null;

  // Reset if client ID changed
  if (_configuredClientId !== clientId) {
    _instance = null;
    _initialized = false;
    _configuredClientId = clientId;
  }

  if (!_instance) {
    const config: Configuration = {
      auth: {
        clientId,
        authority: "https://login.microsoftonline.com/common",
        redirectUri: window.location.origin,
      },
      cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false,
      },
    };
    _instance = new PublicClientApplication(config);
  }

  if (!_initialized) {
    await _instance.initialize();
    _initialized = true;
  }

  return _instance;
}

export function resetMsalInstance(): void {
  _instance = null;
  _initialized = false;
  _configuredClientId = null;
}
