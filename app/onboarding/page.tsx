"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CheckCircle, Loader2, Mail, ArrowRight, User } from "lucide-react";
import { getGoogleUser, setGmailCredentials } from "@/lib/googleClient";
import { getMicrosoftUser } from "@/lib/graphClient";
import { useAuth } from "@clerk/nextjs";
import { useDb } from "@/lib/useDb";
import { dbGetMediaKit, dbSaveMediaKit, dbGetDeals, dbUpsertDeal, dbGetBrands, dbSaveBrands } from "@/lib/db";

const CREATOR_TYPES = [
  { key: "foodie",    label: "Foodie",    emoji: "🍔", desc: "Food, drink, restaurants, recipes" },
  { key: "lifestyle", label: "Lifestyle", emoji: "✨", desc: "Everyday life, home, mindfulness" },
  { key: "beauty",    label: "Beauty",    emoji: "💄", desc: "Makeup, skincare, haircare" },
  { key: "fitness",   label: "Fitness",   emoji: "💪", desc: "Fitness, wellness, nutrition" },
];

type Step = "email" | "profile";
type EmailProvider = "gmail" | "microsoft";
type Connected = { provider: EmailProvider; email: string; name: string } | null;

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { userId: clerkUserId } = useAuth();
  const userId = clerkUserId ?? undefined;
  const getDb = useDb();

  const [step, setStep] = useState<Step>("email");
  const [connecting, setConnecting] = useState<EmailProvider | null>(null);
  const [connected, setConnected] = useState<Connected>(null);
  const [error, setError] = useState("");
  const [showGmailForm, setShowGmailForm] = useState(false);
  const [gmailForm, setGmailForm] = useState({ email: "", password: "" });
  const [gmailError, setGmailError] = useState("");

  // Profile step
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [creatorType, setCreatorType] = useState("");
  const [saving, setSaving] = useState(false);

  // Skip onboarding entirely if already connected
  useEffect(() => {
    const g = getGoogleUser();
    const m = getMicrosoftUser();
    if (g || m) router.replace("/dashboard");
  }, [router]);

  // Pre-fill name from Clerk
  useEffect(() => {
    if (user?.fullName) setName(user.fullName);
    else if (user?.firstName) setName(user.firstName);
  }, [user]);

  const handleGmailConnect = async () => {
    setGmailError("");
    setConnecting("gmail");
    try {
      const res = await fetch("/api/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmailEmail: gmailForm.email.trim(), appPassword: gmailForm.password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      setGmailCredentials(gmailForm.email.trim(), gmailForm.password.trim());
      setConnected({ provider: "gmail", email: gmailForm.email.trim(), name: gmailForm.email.trim() });
    } catch (e: unknown) {
      setGmailError(e instanceof Error ? e.message : "Connection failed.");
    } finally {
      setConnecting(null);
    }
  };


  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const db = await getDb();

      // Save media kit fields
      const existing = await dbGetMediaKit(db);
      const selectedType = CREATOR_TYPES.find(t => t.key === creatorType);
      await dbSaveMediaKit(db, {
        ...existing,
        name: name.trim() || existing.name,
        handle: handle.trim() ? (handle.startsWith("@") ? handle.trim() : `@${handle.trim()}`) : existing.handle,
        tagline: selectedType ? `${selectedType.label} creator` : existing.tagline,
        email: connected?.email || existing.email,
      });

      // Save creator_type separately
      if (creatorType) {
        await db.from("user_settings").upsert({ creator_type: creatorType });
      }

      // Seed demo data if this is a fresh account
      if (userId) {
        const [existingDeals, existingBrands] = await Promise.all([
          dbGetDeals(db),
          dbGetBrands(db),
        ]);

        if (existingDeals.length === 0) {
          const now = new Date().toISOString();
          const demoDeals = [
            { id: crypto.randomUUID(), contactName: "Sarah Mitchell", contactEmail: "sarah@graze.com",      company: "Graze",           status: "pitched"     as const, value: "£400",  notes: "Sent initial pitch for snack box campaign", createdAt: now, updatedAt: now },
            { id: crypto.randomUUID(), contactName: "James Okafor",   contactEmail: "james@oatly.com",       company: "Oatly",           status: "replied"     as const, value: "£650",  notes: "Positive reply — awaiting brief",           createdAt: now, updatedAt: now },
            { id: crypto.randomUUID(), contactName: "Emma Chen",      contactEmail: "emma@innocent.com",     company: "Innocent Drinks", status: "negotiating" as const, value: "£1,200",notes: "Negotiating deliverables and usage rights",  createdAt: now, updatedAt: now },
          ];
          await Promise.all(demoDeals.map(d => dbUpsertDeal(db, d, userId)));
        }

        if (existingBrands.length === 0) {
          await dbSaveBrands(db, [
            { name: "Graze",           runningAds: true,  domain: "graze.com" },
            { name: "Oatly",           runningAds: false, domain: "oatly.com" },
            { name: "Innocent Drinks", runningAds: true,  domain: "innocentdrinks.co.uk" },
            { name: "Pip & Nut",       runningAds: false, domain: "pipandnut.com" },
          ]);
        }
      }
    } catch {
      // Non-blocking — proceed to dashboard even if save fails
    } finally {
      setSaving(false);
      router.replace("/dashboard");
    }
  };

  // ── Step 1: Connect Email ─────────────────────────────────────
  if (step === "email") {
    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-coral-500 rounded-2xl mb-5">
              <Mail size={26} className="text-white" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-navy-900">
              {connected ? "Email connected" : "One last step"}
            </h1>
            <p className="mt-3 text-navy-500 text-base leading-relaxed">
              {connected
                ? "You're ready to send outreach directly from your inbox."
                : "Connect your email so you can send outreach directly from your own address."}
            </p>
          </div>

          {/* Connected success state */}
          {connected ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-5 bg-white border-2 border-emerald-200 rounded-2xl">
                <CheckCircle size={28} className="text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-navy-900">
                    {connected.provider === "gmail" ? "Gmail" : "Microsoft"} connected
                  </p>
                  <p className="text-xs text-navy-400 mt-0.5 truncate">{connected.email}</p>
                </div>
              </div>

              <button
                onClick={() => setStep("profile")}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-2xl transition-colors"
              >
                Continue <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            /* Connection buttons */
            <div className="space-y-3">
              {/* Dedicated account warning */}
              {!showGmailForm && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800 leading-relaxed">
                  <p className="font-bold mb-1">We strongly recommend a dedicated Gmail account for outreach.</p>
                  <p>High-volume cold email can get accounts flagged for spam. If that happens to your main Gmail, it affects <em>every</em> email you send — personal, work, everything. A separate outreach account (takes 2 mins to create) keeps that risk completely isolated. You can set one up at <a href="https://accounts.google.com/signup" target="_blank" rel="noopener noreferrer" className="text-amber-700 underline font-medium">gmail.com</a> before connecting.</p>
                </div>
              )}

              {/* Gmail */}
              {showGmailForm ? (
                <div className="bg-white border-2 border-coral-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-3 mb-1">
                    <svg width="24" height="24" viewBox="0 0 48 48" className="flex-shrink-0">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                    <p className="text-sm font-bold text-navy-900">Connect Gmail</p>
                  </div>
                  <input
                    type="email"
                    value={gmailForm.email}
                    onChange={e => setGmailForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="yourname.outreach@gmail.com"
                    className="w-full text-sm border border-cream-200 rounded-xl px-4 py-3 outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
                  />
                  <div>
                    <input
                      type="password"
                      value={gmailForm.password}
                      onChange={e => setGmailForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="App Password (xxxx xxxx xxxx xxxx)"
                      className="w-full font-mono tracking-widest text-sm border border-cream-200 rounded-xl px-4 py-3 outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
                    />
                    <p className="text-xs text-navy-400 mt-1.5">
                      <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-coral-500 hover:underline">Generate an App Password</a> — requires 2-Step Verification.
                    </p>
                  </div>
                  {gmailError && <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{gmailError}</p>}
                  <div className="flex gap-2">
                    <button
                      onClick={handleGmailConnect}
                      disabled={connecting === "gmail" || !gmailForm.email.trim() || !gmailForm.password.trim()}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white text-sm font-bold rounded-xl transition-colors"
                    >
                      {connecting === "gmail" ? <Loader2 size={15} className="animate-spin" /> : null}
                      {connecting === "gmail" ? "Verifying…" : "Connect"}
                    </button>
                    <button onClick={() => setShowGmailForm(false)} className="px-4 py-2.5 text-sm text-navy-500 hover:text-navy-800 border border-cream-200 rounded-xl transition-colors">
                      Back
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowGmailForm(true)}
                  disabled={!!connecting}
                  className="w-full flex items-center gap-4 p-5 bg-white border-2 border-cream-200 hover:border-coral-300 hover:shadow-md rounded-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed text-left"
                >
                  <div className="flex-shrink-0">
                    <svg width="32" height="32" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-navy-900">Connect Gmail</p>
                    <p className="text-xs text-navy-400 mt-0.5">Connect your dedicated outreach Gmail — keep your main account safe</p>
                  </div>
                  <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-cream-300" />
                </button>
              )}

              {error && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
              )}

              <p className="text-center text-xs text-navy-400 pt-2">
                Not sure?{" "}
                <button onClick={() => router.replace("/dashboard")} className="text-coral-500 hover:underline">
                  Skip for now
                </button>{" "}
                — you can connect later in Settings.
              </p>
            </div>
          )}

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mt-10">
            <div className="w-6 h-1.5 rounded-full bg-coral-500" />
            <div className="w-6 h-1.5 rounded-full bg-cream-200" />
          </div>
        </div>
      </div>
    );
  }

  // ── Step 2: Profile ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-navy-900 rounded-2xl mb-5">
            <User size={24} className="text-white" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-navy-900">Tell us about you</h1>
          <p className="mt-3 text-navy-500 text-base leading-relaxed">
            This pre-fills your media kit and personalises your outreach.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-cream-200 p-6 space-y-5 shadow-sm">
          {/* Name */}
          <div>
            <label className="text-xs font-bold text-navy-500 uppercase tracking-widest mb-1.5 block">Your Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Gina Smith"
              className="w-full text-sm border border-cream-200 rounded-xl px-4 py-3 outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
            />
          </div>

          {/* Handle */}
          <div>
            <label className="text-xs font-bold text-navy-500 uppercase tracking-widest mb-1.5 block">Instagram Handle</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-navy-300 text-sm font-medium">@</span>
              <input
                type="text"
                value={handle.replace(/^@/, "")}
                onChange={e => setHandle(e.target.value.replace(/^@/, ""))}
                placeholder="yourhandle"
                className="w-full pl-8 text-sm border border-cream-200 rounded-xl px-4 py-3 outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
              />
            </div>
          </div>

          {/* Creator type */}
          <div>
            <label className="text-xs font-bold text-navy-500 uppercase tracking-widest mb-2 block">What kind of creator are you?</label>
            <div className="grid grid-cols-2 gap-2">
              {CREATOR_TYPES.map(type => {
                const selected = creatorType === type.key;
                return (
                  <button
                    key={type.key}
                    type="button"
                    onClick={() => setCreatorType(type.key)}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border-2 text-left transition-all ${
                      selected
                        ? "border-coral-400 bg-coral-50"
                        : "border-cream-200 bg-white hover:border-cream-300 hover:bg-cream-50"
                    }`}
                  >
                    <span className="text-2xl leading-none">{type.emoji}</span>
                    <div className="min-w-0">
                      <p className={`text-sm font-bold leading-tight ${selected ? "text-coral-700" : "text-navy-900"}`}>
                        {type.label}
                      </p>
                      <p className="text-[11px] text-navy-400 leading-snug mt-0.5 truncate">{type.desc}</p>
                    </div>
                    {selected && (
                      <CheckCircle size={15} className="text-coral-500 flex-shrink-0 ml-auto" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <button
          onClick={handleSaveProfile}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 mt-4 py-3.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white font-bold rounded-2xl transition-colors"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          {saving ? "Saving…" : "Get started"}
        </button>

        <p className="text-center text-xs text-navy-400 mt-4">
          <button onClick={() => router.replace("/dashboard")} className="text-coral-500 hover:underline">
            Skip this step
          </button>{" "}
          — you can fill this in later under Settings.
        </p>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mt-8">
          <div className="w-6 h-1.5 rounded-full bg-cream-200" />
          <div className="w-6 h-1.5 rounded-full bg-coral-500" />
        </div>
      </div>
    </div>
  );
}
