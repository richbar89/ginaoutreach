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
import {
  signInWithGoogle,
  signOutFromGoogle,
  getGoogleUser,
} from "@/lib/googleClient";
import { useDb } from "@/lib/useDb";
import {
  dbGetSignature,
  dbSaveSignature,
  dbGetBrands,
  dbSaveBrands,
} from "@/lib/db";
import type { Brand } from "@/lib/types";

type ConnectedUser = { name: string; email: string } | null;

export default function SettingsPage() {
  const getDb = useDb();
  const [clientId, setClientId] = useState("");
  const [savedClientId, setSavedClientId] = useState("");
  const [msUser, setMsUser] = useState<ConnectedUser>(null);
  const [gUser, setGUser] = useState<ConnectedUser>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<"ms" | "google" | null>(null);
  const [error, setError] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);
  const [signature, setSignature] = useState("");
  const [sigSaved, setSigSaved] = useState(false);
  const [brands, setBrands] = useState<Brand[]>(Array.from({ length: 10 }, () => ({ name: "", runningAds: false })));
  const [brandsSaved, setBrandsSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("azure_client_id") || "";
    setSavedClientId(stored);
    setClientId(stored);
    setMsUser(getMicrosoftUser());
    setGUser(getGoogleUser());
    (async () => {
      const db = await getDb();
      const sig = await dbGetSignature(db);
      setSignature(sig);
      const storedBrands = await dbGetBrands(db);
      setBrands(Array.from({ length: 10 }, (_, i) => storedBrands[i] ?? { name: "", runningAds: false }));
      setLoading(false);
    })();
  }, [getDb]);

  const handleSaveSignature = async () => {
    const db = await getDb();
    await dbSaveSignature(db, signature);
    setSigSaved(true);
    setTimeout(() => setSigSaved(false), 2500);
  };

  const handleSaveBrands = async () => {
    const db = await getDb();
    await dbSaveBrands(db, brands.filter(b => b.name.trim()));
    setBrandsSaved(true);
    setTimeout(() => setBrandsSaved(false), 2500);
  };

  const updateBrand = (i: number, patch: Partial<Brand>) => {
    setBrands(prev => prev.map((b, idx) => idx === i ? { ...b, ...patch } : b));
  };

  const saveClientId = () => {
    const trimmed = clientId.trim();
    localStorage.setItem("azure_client_id", trimmed);
    setSavedClientId(trimmed);
    resetMsalInstance();
    setMsUser(null);
    setError("");
  };

  const handleConnectMicrosoft = async () => {
    setError("");
    setSigning("ms");
    try {
      const account = await signInWithMicrosoft();
      setMsUser({ name: account.name || account.username, email: account.username });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign-in failed.";
      if (!msg.toLowerCase().includes("cancelled") && !msg.toLowerCase().includes("user_cancelled")) {
        setError(msg);
      }
    } finally {
      setSigning(null);
    }
  };

  const handleDisconnectMicrosoft = async () => {
    setSigning("ms");
    try {
      await signOutFromMicrosoft();
      setMsUser(null);
    } finally {
      setSigning(null);
    }
  };

  const handleConnectGoogle = async () => {
    setError("");
    setSigning("google");
    try {
      const user = await signInWithGoogle();
      setGUser(user);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Sign-in failed.";
      if (!msg.toLowerCase().includes("cancelled")) {
        setError(msg);
      }
    } finally {
      setSigning(null);
    }
  };

  const handleDisconnectGoogle = () => {
    signOutFromGoogle();
    setGUser(null);
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
          Connect your email account to send outreach directly from your own address.
        </p>
      </div>

      {/* Gmail Connection Card */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm mb-6">
        <div className="px-7 py-5 border-b border-cream-100 flex items-center gap-3">
          {/* Gmail / Google logo */}
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span className="text-sm font-semibold text-navy-800">Gmail</span>
          <span className="text-xs text-navy-400">— @gmail.com addresses</span>
          {gUser && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <CheckCircle size={11} />
              Connected
            </span>
          )}
        </div>
        <div className="px-7 py-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-navy-400">
              <Loader2 size={14} className="animate-spin" />
              Checking connection…
            </div>
          ) : gUser ? (
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-navy-900">{gUser.name}</p>
                <p className="text-xs text-navy-400 mt-0.5">{gUser.email}</p>
              </div>
              <button
                onClick={handleDisconnectGoogle}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-navy-500 hover:text-red-600 border border-cream-200 hover:border-red-200 bg-white rounded-xl transition-all"
              >
                <LogOut size={12} />
                Disconnect
              </button>
            </div>
          ) : (
            <button
              onClick={handleConnectGoogle}
              disabled={signing === "google"}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {signing === "google" ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
              {signing === "google" ? "Connecting…" : "Connect Gmail"}
            </button>
          )}
        </div>
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
                onClick={handleDisconnectMicrosoft}
                disabled={signing === "ms"}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-navy-500 hover:text-red-600 border border-cream-200 hover:border-red-200 bg-white rounded-xl transition-all"
              >
                {signing === "ms" ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                Disconnect
              </button>
            </div>
          ) : (
            <div>
              <button
                onClick={handleConnectMicrosoft}
                disabled={signing === "ms" || !savedClientId}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {signing === "ms" ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <LogIn size={15} />
                )}
                {signing === "ms" ? "Signing in…" : "Connect Microsoft Account"}
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

      {/* Signature */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm mb-6">
        <div className="px-7 py-5 border-b border-cream-100">
          <p className="text-sm font-semibold text-navy-800">Email Signature</p>
          <p className="text-xs text-navy-400 mt-1">
            Saved once and inserted wherever you use the <span className="font-mono text-coral-600">[Signature]</span> merge tag in templates.
          </p>
        </div>
        <div className="px-7 py-6 space-y-4">
          <textarea
            rows={5}
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder={`Best,\nGina\n\nFood & Drinks Content Creator\ngina@example.com | @ginanutrition`}
            className="input-base resize-y text-sm font-mono leading-relaxed"
          />
          <button
            onClick={handleSaveSignature}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {sigSaved ? <CheckCircle size={14} /> : null}
            {sigSaved ? "Saved!" : "Save Signature"}
          </button>
        </div>
      </div>

      {/* Brand Monitor */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm mb-6">
        <div className="px-7 py-5 border-b border-cream-100">
          <p className="text-sm font-bold text-navy-800">Brand Monitor</p>
          <p className="text-xs text-navy-400 mt-1">
            Track up to 10 brands and flag whether they&apos;re running ads. These appear on your dashboard.
          </p>
        </div>
        <div className="px-7 py-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
            {brands.map((brand, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-navy-400 w-4 flex-shrink-0">{i + 1}</span>
                <input
                  type="text"
                  value={brand.name}
                  onChange={(e) => updateBrand(i, { name: e.target.value })}
                  placeholder={`Brand ${i + 1}`}
                  className="input-base flex-1 text-sm"
                />
                <button
                  onClick={() => updateBrand(i, { runningAds: !brand.runningAds })}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                    brand.runningAds
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-red-50 text-red-500 border-red-200 hover:bg-red-100"
                  }`}
                  title="Toggle ads status"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${brand.runningAds ? "bg-emerald-500" : "bg-red-400"}`} />
                  {brand.runningAds ? "Ads on" : "No ads"}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveBrands}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {brandsSaved ? <CheckCircle size={14} /> : null}
            {brandsSaved ? "Saved!" : "Save Brands"}
          </button>
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
