"use client";

import { useState, useEffect } from "react";
import {
  Settings,
  CheckCircle,
  LogIn,
  LogOut,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Loader2,
} from "lucide-react";
import {
  signInWithMicrosoft,
  signOutFromMicrosoft,
  getMicrosoftUser,
} from "@/lib/graphClient";
import { resetMsalInstance } from "@/lib/msalInstance";

type MsUser = { name: string; email: string } | null;

export default function SettingsPage() {
  const [clientId, setClientId] = useState("");
  const [savedClientId, setSavedClientId] = useState("");
  const [msUser, setMsUser] = useState<MsUser>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("azure_client_id") || "";
    setSavedClientId(stored);
    setClientId(stored);
    setMsUser(getMicrosoftUser());
    setLoading(false);
  }, []);

  const saveClientId = () => {
    const trimmed = clientId.trim();
    localStorage.setItem("azure_client_id", trimmed);
    setSavedClientId(trimmed);
    resetMsalInstance();
    setMsUser(null);
    setError("");
  };

  const handleConnect = async () => {
    setError("");
    setSigning(true);
    try {
      const account = await signInWithMicrosoft();
      setMsUser({ name: account.name || account.username, email: account.username });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign-in failed.";
      // User cancelled popup — don't show error
      if (!msg.toLowerCase().includes("cancelled") && !msg.toLowerCase().includes("user_cancelled")) {
        setError(msg);
      }
    } finally {
      setSigning(false);
    }
  };

  const handleDisconnect = async () => {
    setSigning(true);
    try {
      await signOutFromMicrosoft();
      setMsUser(null);
    } finally {
      setSigning(false);
    }
  };

  return (
    <div className="p-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-10 bg-coral-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">
            Settings
          </span>
        </div>
        <h1 className="font-serif text-4xl font-bold text-navy-900 leading-tight">
          Account
        </h1>
        <p className="mt-2 text-navy-500 text-base">
          Connect your Microsoft 365 account to send emails directly from GinaOS.
        </p>
      </div>

      {/* Microsoft Connection Card */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm mb-6">
        <div className="px-7 py-5 border-b border-cream-100 flex items-center gap-3">
          {/* Microsoft logo */}
          <svg width="20" height="20" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
            <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
            <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
            <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
          </svg>
          <span className="text-sm font-semibold text-navy-800">Microsoft 365</span>
          {msUser && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <CheckCircle size={11} />
              Connected
            </span>
          )}
        </div>

        <div className="px-7 py-6 space-y-5">
          {/* Client ID field */}
          <div>
            <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">
              Azure Application (Client) ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="input-base font-mono text-xs"
              />
              <button
                onClick={saveClientId}
                disabled={clientId.trim() === savedClientId || !clientId.trim()}
                className="flex-shrink-0 px-4 py-2.5 bg-navy-800 hover:bg-navy-900 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
              >
                Save
              </button>
            </div>
            <p className="mt-1.5 text-xs text-navy-400">
              Found in your Azure App Registration under{" "}
              <span className="font-mono bg-cream-100 px-1 rounded">Overview</span>.
            </p>
          </div>

          {/* Connect / status */}
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-navy-400">
              <Loader2 size={14} className="animate-spin" />
              Checking connection…
            </div>
          ) : msUser ? (
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-navy-900">{msUser.name}</p>
                <p className="text-xs text-navy-400 mt-0.5">{msUser.email}</p>
              </div>
              <button
                onClick={handleDisconnect}
                disabled={signing}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-navy-500 hover:text-red-600 border border-cream-200 hover:border-red-200 bg-white rounded-xl transition-all"
              >
                {signing ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                Disconnect
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={handleConnect}
                disabled={signing || !savedClientId}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {signing ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <LogIn size={15} />
                )}
                {signing ? "Signing in…" : "Connect Microsoft Account"}
              </button>
              {!savedClientId && (
                <p className="mt-2 text-xs text-navy-400">Save a Client ID above first.</p>
              )}
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
        <button
          onClick={() => setShowInstructions(!showInstructions)}
          className="w-full px-7 py-5 flex items-center justify-between text-left hover:bg-cream-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Settings size={16} className="text-navy-400" />
            <span className="text-sm font-semibold text-navy-800">How to set up your Azure App</span>
          </div>
          {showInstructions ? (
            <ChevronUp size={15} className="text-navy-400" />
          ) : (
            <ChevronDown size={15} className="text-navy-400" />
          )}
        </button>

        {showInstructions && (
          <div className="px-7 pb-7 border-t border-cream-100">
            <ol className="mt-5 space-y-4 text-sm text-navy-700">
              {[
                <>
                  Go to{" "}
                  <a
                    href="https://portal.azure.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-coral-500 hover:underline inline-flex items-center gap-0.5"
                  >
                    portal.azure.com <ExternalLink size={10} />
                  </a>{" "}
                  and sign in with your Microsoft account.
                </>,
                <>
                  Navigate to <strong>Microsoft Entra ID</strong> →{" "}
                  <strong>App Registrations</strong> → <strong>New Registration</strong>.
                </>,
                <>
                  Name it anything (e.g. <em>GinaOS Outreach</em>). Under{" "}
                  <strong>Supported account types</strong>, choose{" "}
                  <strong>
                    Accounts in any organizational directory and personal Microsoft accounts
                  </strong>.
                </>,
                <>
                  Under <strong>Redirect URI</strong>, select{" "}
                  <strong>Single-page application (SPA)</strong> and set the URL to{" "}
                  <span className="font-mono bg-cream-100 px-1.5 py-0.5 rounded text-xs">
                    {typeof window !== "undefined" ? window.location.origin : "https://your-app.replit.app"}
                  </span>
                  .
                </>,
                <>
                  Click <strong>Register</strong>. On the Overview page, copy the{" "}
                  <strong>Application (client) ID</strong> and paste it above.
                </>,
                <>
                  Go to <strong>API Permissions</strong> → <strong>Add a permission</strong> →{" "}
                  <strong>Microsoft Graph</strong> → <strong>Delegated permissions</strong> →
                  search for and add <strong>Mail.Send</strong>.
                </>,
                <>
                  Done! Click <strong>Connect Microsoft Account</strong> above and sign in.
                  You&apos;ll only need to do this once.
                </>,
              ].map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 bg-coral-100 text-coral-600 text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">
                    {i + 1}
                  </span>
                  <span className="leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
