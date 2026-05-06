"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { CheckCircle, Loader2, ArrowRight, User, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";
import { getGoogleUser, setGmailCredentials } from "@/lib/googleClient";
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
type EmailSubStep = "intro" | "create" | "connect";

const GmailLogo = ({ size = 28 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 48 48">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
  </svg>
);

function StepDots({ emailSubStep }: { emailSubStep: EmailSubStep }) {
  const steps: EmailSubStep[] = ["intro", "create", "connect"];
  return (
    <div className="flex items-center justify-center gap-2 mt-10">
      {steps.map(s => (
        <div
          key={s}
          className={`h-1.5 rounded-full transition-all duration-400 ${emailSubStep === s ? "w-8 bg-coral-500" : "w-4 bg-cream-300"}`}
        />
      ))}
      <div className="h-1.5 w-4 bg-cream-200 rounded-full" />
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useUser();
  const { userId: clerkUserId } = useAuth();
  const userId = clerkUserId ?? undefined;
  const getDb = useDb();

  const [step, setStep] = useState<Step>("email");
  const [emailSubStep, setEmailSubStep] = useState<EmailSubStep>("intro");
  const [accountCreated, setAccountCreated] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [connectedEmail, setConnectedEmail] = useState<string | null>(null);
  const [gmailForm, setGmailForm] = useState({ email: "", password: "" });
  const [gmailError, setGmailError] = useState("");
  const [showInstructions, setShowInstructions] = useState(false);

  // Profile step
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [creatorType, setCreatorType] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (getGoogleUser()) router.replace("/dashboard");
  }, [router]);

  useEffect(() => {
    if (user?.fullName) setName(user.fullName);
    else if (user?.firstName) setName(user.firstName);
  }, [user]);

  const handleGmailConnect = async () => {
    setGmailError("");
    setConnecting(true);
    try {
      const res = await fetch("/api/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmailEmail: gmailForm.email.trim(), appPassword: gmailForm.password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      setGmailCredentials(gmailForm.email.trim(), gmailForm.password.trim());
      setConnectedEmail(gmailForm.email.trim());
    } catch (e: unknown) {
      setGmailError(e instanceof Error ? e.message : "Connection failed.");
    } finally {
      setConnecting(false);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const db = await getDb();
      const existing = await dbGetMediaKit(db);
      const selectedType = CREATOR_TYPES.find(t => t.key === creatorType);
      await dbSaveMediaKit(db, {
        ...existing,
        name: name.trim() || existing.name,
        handle: handle.trim() ? (handle.startsWith("@") ? handle.trim() : `@${handle.trim()}`) : existing.handle,
        tagline: selectedType ? `${selectedType.label} creator` : existing.tagline,
        email: connectedEmail || existing.email,
      });
      if (creatorType) {
        await db.from("user_settings").upsert({ creator_type: creatorType });
      }
      if (userId) {
        const [existingDeals, existingBrands] = await Promise.all([
          dbGetDeals(db),
          dbGetBrands(db, userId),
        ]);
        if (existingDeals.length === 0) {
          const now = new Date().toISOString();
          const demoDeals = [
            { id: crypto.randomUUID(), contactName: "Sarah Mitchell", contactEmail: "sarah@graze.com",  company: "Graze",           status: "pitched"     as const, value: "£400",   notes: "Sent initial pitch for snack box campaign", createdAt: now, updatedAt: now },
            { id: crypto.randomUUID(), contactName: "James Okafor",   contactEmail: "james@oatly.com",  company: "Oatly",           status: "replied"     as const, value: "£650",   notes: "Positive reply — awaiting brief",           createdAt: now, updatedAt: now },
            { id: crypto.randomUUID(), contactName: "Emma Chen",      contactEmail: "emma@innocent.com",company: "Innocent Drinks", status: "negotiating" as const, value: "£1,200", notes: "Negotiating deliverables and usage rights",  createdAt: now, updatedAt: now },
          ];
          await Promise.all(demoDeals.map(d => dbUpsertDeal(db, d, userId)));
        }
        if (existingBrands.length === 0) {
          await dbSaveBrands(db, [
            { name: "Graze",           runningAds: true,  domain: "graze.com" },
            { name: "Oatly",           runningAds: false, domain: "oatly.com" },
            { name: "Innocent Drinks", runningAds: true,  domain: "innocentdrinks.co.uk" },
            { name: "Pip & Nut",       runningAds: false, domain: "pipandnut.com" },
          ], userId);
        }
      }
    } catch {
      // Non-blocking
    } finally {
      setSaving(false);
      router.replace("/dashboard");
    }
  };

  // ── Step 1: Email ─────────────────────────────────────────────
  if (step === "email") {

    // Success state
    if (connectedEmail) {
      return (
        <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md animate-fade-slide-up">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-2xl mb-5">
                <CheckCircle size={30} className="text-emerald-500" />
              </div>
              <h1 className="font-serif text-3xl font-bold text-navy-900">You&apos;re all set!</h1>
              <p className="mt-3 text-navy-500 text-sm leading-relaxed">
                Your outreach Gmail is connected. Let&apos;s finish setting up your profile.
              </p>
            </div>
            <div className="flex items-center gap-4 p-5 bg-white border-2 border-emerald-200 rounded-2xl mb-4 shadow-sm">
              <GmailLogo size={24} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-navy-900">Gmail connected</p>
                <p className="text-xs text-navy-400 mt-0.5 truncate">{connectedEmail}</p>
              </div>
              <CheckCircle size={18} className="text-emerald-500 flex-shrink-0" />
            </div>
            <button
              onClick={() => setStep("profile")}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-2xl transition-colors"
            >
              Continue <ArrowRight size={16} />
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
        <div className="w-full max-w-md">

          {/* ── Phase 1: Why a dedicated account ────────────────── */}
          {emailSubStep === "intro" && (
            <div className="animate-fade-slide-up">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-coral-100 rounded-2xl mb-5">
                  <span className="text-2xl">👋</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-coral-500 mb-3">Before we dive in</p>
                <h1 className="font-serif text-3xl font-bold text-navy-900 leading-tight">
                  Okay, real talk for a sec
                </h1>
              </div>

              <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm space-y-4 text-sm text-navy-700 leading-relaxed mb-4">
                <p>
                  Cold emailing brands is one of the best ways creators land paid deals. But let&apos;s be honest — you&apos;re emailing people who didn&apos;t ask for it. That&apos;s technically what spam filters call &ldquo;cold outreach.&rdquo;
                </p>
                <p>
                  <strong>It&apos;s completely legal. Brands expect it. It&apos;s how the industry works.</strong>
                </p>
                <p>
                  But here&apos;s the thing: if you do this from your main Gmail and a filter flags you one day, it affects <em>every</em> email you send — to friends, clients, collaborators, everyone.
                </p>
                <div className="bg-coral-50 border border-coral-100 rounded-xl p-4">
                  <p className="font-semibold text-coral-800 mb-1.5">
                    So we&apos;re going to set up a brand new Gmail purely for brand outreach.
                  </p>
                  <p className="text-coral-700 text-xs leading-relaxed">
                    It takes about 2 minutes and completely separates the risk. Think of it like having a business phone — if it gets spam calls, your personal number is completely untouched.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setEmailSubStep("create")}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-2xl transition-colors"
              >
                Makes sense — let&apos;s do it <ArrowRight size={16} />
              </button>

              <p className="text-center text-xs text-navy-400 mt-4">
                Already have a dedicated outreach Gmail?{" "}
                <button onClick={() => setEmailSubStep("connect")} className="text-coral-500 hover:underline font-medium">
                  Skip ahead to connect it
                </button>
              </p>
              <p className="text-center text-xs text-navy-400 mt-2">
                <button onClick={() => router.replace("/dashboard")} className="hover:text-navy-600">
                  Skip for now — connect later in Settings
                </button>
              </p>

              <StepDots emailSubStep={emailSubStep} />
            </div>
          )}

          {/* ── Phase 2: Create the Gmail ────────────────────────── */}
          {emailSubStep === "create" && (
            <div className="animate-fade-slide-up">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-navy-900 rounded-2xl mb-5">
                  <span className="text-white font-bold font-serif text-xl">1</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-coral-500 mb-3">Step 1 of 2</p>
                <h1 className="font-serif text-3xl font-bold text-navy-900">
                  Create a new Gmail
                </h1>
                <p className="mt-3 text-navy-500 text-sm leading-relaxed">
                  Head to Gmail and create a fresh account. Something like:
                </p>
                <code className="inline-block mt-2 px-3 py-1.5 bg-cream-200 text-navy-700 text-sm rounded-lg font-mono">
                  yourname.brands@gmail.com
                </code>
              </div>

              <a
                href="https://accounts.google.com/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-navy-900 hover:bg-navy-800 text-white font-bold rounded-2xl transition-colors mb-4"
              >
                <GmailLogo size={20} />
                Create a Gmail account
                <ExternalLink size={14} className="opacity-60" />
              </a>

              <button
                onClick={() => setAccountCreated(v => !v)}
                className={`w-full flex items-start gap-4 p-5 rounded-2xl border-2 text-left transition-all mb-4 ${
                  accountCreated
                    ? "border-emerald-400 bg-emerald-50"
                    : "border-cream-200 bg-white hover:border-cream-300"
                }`}
              >
                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
                  accountCreated ? "bg-emerald-500 border-emerald-500" : "border-cream-300 bg-white"
                }`}>
                  {accountCreated && <CheckCircle size={14} className="text-white" />}
                </div>
                <div>
                  <p className={`text-sm font-bold ${accountCreated ? "text-emerald-800" : "text-navy-900"}`}>
                    Done! I&apos;ve created my new outreach Gmail
                  </p>
                  <p className="text-xs text-navy-400 mt-0.5">Tick this when you&apos;re ready to move on</p>
                </div>
              </button>

              <button
                onClick={() => setEmailSubStep("connect")}
                disabled={!accountCreated}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors"
              >
                Next: connect it to Collabi <ArrowRight size={16} />
              </button>

              <p className="text-center text-xs text-navy-400 mt-4">
                <button onClick={() => setEmailSubStep("intro")} className="text-coral-500 hover:underline">
                  ← Back
                </button>
              </p>

              <StepDots emailSubStep={emailSubStep} />
            </div>
          )}

          {/* ── Phase 3: Connect via App Password ───────────────── */}
          {emailSubStep === "connect" && (
            <div className="animate-fade-slide-up">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-coral-500 rounded-2xl mb-5">
                  <span className="text-white font-bold font-serif text-xl">2</span>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest text-coral-500 mb-3">Step 2 of 2</p>
                <h1 className="font-serif text-3xl font-bold text-navy-900">
                  Connect it to Collabi
                </h1>
                <p className="mt-3 text-navy-500 text-sm leading-relaxed">
                  We use an &ldquo;App Password&rdquo; — a special key you generate inside Google in about 60 seconds. Not your regular Gmail password.
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-cream-200 p-5 shadow-sm space-y-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-navy-400 mb-1.5 uppercase tracking-widest">
                    Your outreach Gmail address
                  </label>
                  <input
                    type="email"
                    value={gmailForm.email}
                    onChange={e => setGmailForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="yourname.brands@gmail.com"
                    className="w-full text-sm border border-cream-200 rounded-xl px-4 py-3 outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-navy-400 mb-1.5 uppercase tracking-widest">
                    App Password
                  </label>
                  <input
                    type="password"
                    value={gmailForm.password}
                    onChange={e => setGmailForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="xxxx xxxx xxxx xxxx"
                    className="w-full font-mono tracking-widest text-sm border border-cream-200 rounded-xl px-4 py-3 outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100"
                  />
                </div>

                {/* Instructions accordion */}
                <button
                  onClick={() => setShowInstructions(v => !v)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-navy-500 hover:text-coral-600 transition-colors py-1"
                >
                  <span>How do I get an App Password?</span>
                  {showInstructions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                </button>

                {showInstructions && (
                  <ol className="space-y-3 text-xs text-navy-700 bg-cream-50 border border-cream-200 rounded-xl p-4">
                    {[
                      <>Sign into your <strong>new outreach Gmail</strong> at <a href="https://gmail.com" target="_blank" rel="noopener noreferrer" className="text-coral-500 hover:underline">gmail.com</a></>,
                      <>Go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-coral-500 hover:underline">myaccount.google.com/security</a> and turn on <strong>2-Step Verification</strong> (required)</>,
                      <>Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-coral-500 hover:underline">myaccount.google.com/apppasswords</a></>,
                      <>Type <span className="font-mono bg-cream-200 px-1 rounded">Collabi</span> as the app name and click <strong>Create</strong></>,
                      <>Copy the <strong>16-character password</strong> it shows you (spaces are fine)</>,
                      <>Paste the Gmail address and that password above, then hit <strong>Connect Gmail</strong></>,
                    ].map((s, i) => (
                      <li key={i} className="flex gap-3">
                        <span className="flex-shrink-0 w-5 h-5 bg-coral-100 text-coral-600 text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">{i + 1}</span>
                        <span className="leading-relaxed">{s}</span>
                      </li>
                    ))}
                  </ol>
                )}

                {gmailError && (
                  <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{gmailError}</p>
                )}

                <button
                  onClick={handleGmailConnect}
                  disabled={connecting || !gmailForm.email.trim() || !gmailForm.password.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-coral-500 hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
                >
                  {connecting && <Loader2 size={15} className="animate-spin" />}
                  {connecting ? "Connecting…" : "Connect Gmail"}
                </button>
              </div>

              <p className="text-center text-xs text-navy-400">
                <button onClick={() => setEmailSubStep("create")} className="text-coral-500 hover:underline">
                  ← Back
                </button>
                {" · "}
                <button onClick={() => router.replace("/dashboard")} className="hover:text-navy-600">
                  Skip for now
                </button>
              </p>

              <StepDots emailSubStep={emailSubStep} />
            </div>
          )}

        </div>
      </div>
    );
  }

  // ── Step 2: Profile ───────────────────────────────────────────
  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">

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
                    {selected && <CheckCircle size={15} className="text-coral-500 flex-shrink-0 ml-auto" />}
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

        <div className="flex items-center justify-center gap-2 mt-8">
          <div className="w-4 h-1.5 rounded-full bg-cream-200" />
          <div className="w-4 h-1.5 rounded-full bg-cream-200" />
          <div className="w-4 h-1.5 rounded-full bg-cream-200" />
          <div className="w-8 h-1.5 rounded-full bg-coral-500" />
        </div>

      </div>
    </div>
  );
}
