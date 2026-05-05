"use client";

import { useState } from "react";
import { Check, Loader2, ExternalLink, ArrowRight, Send, Inbox } from "lucide-react";
import Link from "next/link";
import { setGmailCredentials } from "@/lib/googleClient";

type Step =
  | "intro"
  | "email"
  | "app-pass-intro"
  | "app-pass-steps"
  | "app-pass-enter"
  | "mode-choice"
  | "imap-steps"
  | "done-send";

const PROGRESS: Record<Step, number> = {
  intro: 8,
  email: 22,
  "app-pass-intro": 38,
  "app-pass-steps": 52,
  "app-pass-enter": 66,
  "mode-choice": 80,
  "imap-steps": 91,
  "done-send": 100,
};

interface Props {
  initialStep?: Step;
  initialEmail?: string;
  onInboxReady: () => void;
}

function CheckItem({
  checked,
  onToggle,
  children,
  link,
}: {
  checked: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  link?: { href: string; label: string };
}) {
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-start gap-3 p-4 rounded-xl border text-left transition-all ${
        checked ? "border-emerald-200 bg-emerald-50" : "border-cream-200 bg-white hover:border-cream-300"
      }`}
    >
      <div
        className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 mt-0.5 transition-all ${
          checked ? "bg-emerald-500 border-emerald-500" : "border-navy-300"
        }`}
      >
        {checked && <Check size={11} className="text-white" strokeWidth={3} />}
      </div>
      <div className="flex-1 min-w-0">
        <span className={`text-sm leading-relaxed ${checked ? "text-navy-400 line-through" : "text-navy-700"}`}>
          {children}
        </span>
        {link && !checked && (
          <a
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="inline-flex items-center gap-1 mt-1.5 text-[11px] font-bold text-coral-500 hover:text-coral-700 transition-colors"
          >
            {link.label} <ExternalLink size={10} />
          </a>
        )}
      </div>
    </button>
  );
}

export function EmailSetupWizard({ initialStep = "intro", initialEmail = "", onInboxReady }: Props) {
  const [step, setStep] = useState<Step>(initialStep);
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState("");
  const [appPassDone, setAppPassDone] = useState<Set<number>>(new Set());
  const [imapDone, setImapDone] = useState<Set<number>>(new Set());

  const toggle = (setter: React.Dispatch<React.SetStateAction<Set<number>>>, i: number) => {
    setter(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const handleConnect = async () => {
    setConnectError("");
    setConnecting(true);
    try {
      const res = await fetch("/api/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmailEmail: email.trim(), appPassword: password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      setGmailCredentials(email.trim(), password.trim());
      setConnectError("");
      setStep("mode-choice");
    } catch (e: unknown) {
      setConnectError(e instanceof Error ? e.message : "Connection failed.");
    } finally {
      setConnecting(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Progress bar */}
      <div className="h-1 bg-cream-200 flex-shrink-0">
        <div
          className="h-full bg-coral-500 transition-all duration-500 ease-out"
          style={{ width: `${PROGRESS[step]}%` }}
        />
      </div>

      <div className="flex-1 overflow-y-auto flex items-center justify-center p-8">
        <div className="w-full max-w-lg">

          {/* ── Intro ─────────────────────────────────────────── */}
          {step === "intro" && (
            <div className="animate-fade-slide-up text-center">
              <div className="text-6xl mb-6">👋</div>
              <h2 className="font-serif text-3xl font-bold text-navy-900 mb-4">
                Let&apos;s get your inbox set up
              </h2>
              <p className="text-navy-500 text-base leading-relaxed mb-10 max-w-md mx-auto">
                We&apos;re going to connect your Gmail so you can send outreach emails directly from Collabi — and see when brands reply, right here. Takes about 3 minutes.
              </p>
              <button
                onClick={() => setStep("email")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-2xl transition-colors text-base"
              >
                Let&apos;s go <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* ── Email ─────────────────────────────────────────── */}
          {step === "email" && (
            <div className="animate-fade-slide-up">
              <p className="text-xs font-bold uppercase tracking-widest text-coral-500 mb-5">Step 1 of 3</p>
              <h2 className="font-serif text-2xl font-bold text-navy-900 mb-6">
                First, let&apos;s set up a dedicated Gmail
              </h2>

              {/* Create Gmail CTA — prominent */}
              <div className="bg-white border-2 border-navy-900 rounded-2xl p-5 mb-5 shadow-sm">
                <p className="text-sm font-bold text-navy-900 mb-2">
                  We strongly recommend a brand new Gmail — not your personal one.
                </p>
                <p className="text-sm text-navy-500 leading-relaxed mb-4">
                  High-volume cold email can get accounts flagged as spam. If that ever happens to your main Gmail, it affects every email you send — personal messages, work emails, everything. A separate outreach account (takes 2 minutes to create) keeps the risk completely isolated.
                </p>
                <a
                  href="https://accounts.google.com/signup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold rounded-xl transition-colors"
                >
                  Create a new Gmail account
                  <ExternalLink size={14} />
                </a>
                <p className="text-[11px] text-navy-400 mt-2.5">
                  Something like <span className="font-mono bg-cream-100 px-1 rounded">yourname.brands@gmail.com</span> works great.
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-5">
                <div className="flex-1 h-px bg-cream-200" />
                <span className="text-xs text-navy-400">Done? Enter it below</span>
                <div className="flex-1 h-px bg-cream-200" />
              </div>

              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && email.includes("@") && setStep("app-pass-intro")}
                placeholder="yourname.brands@gmail.com"
                autoFocus
                className="w-full text-xl border-0 border-b-2 border-cream-300 focus:border-coral-400 bg-transparent outline-none py-3 placeholder-cream-300 text-navy-900 transition-colors mb-8"
              />
              <button
                onClick={() => setStep("app-pass-intro")}
                disabled={!email.includes("@")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-coral-500 hover:bg-coral-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors"
              >
                That&apos;s my email <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── App Password Intro ─────────────────────────────── */}
          {step === "app-pass-intro" && (
            <div className="animate-fade-slide-up">
              <p className="text-xs font-bold uppercase tracking-widest text-coral-500 mb-5">Step 2 of 3</p>
              <h2 className="font-serif text-2xl font-bold text-navy-900 mb-2">
                Now, we need your password...
              </h2>
              <h2 className="font-serif text-2xl font-bold text-coral-500 mb-6">
                ...but not <em>that</em> one! 🙅
              </h2>
              <div className="bg-white border border-cream-200 rounded-2xl p-6 shadow-sm space-y-4 text-sm text-navy-700 leading-relaxed mb-8">
                <p>
                  Gmail doesn&apos;t let apps like Collabi use your regular password — and that&apos;s actually a good thing. Instead, it uses something called an <strong>App Password</strong>: a special 16-character code you generate yourself inside Google.
                </p>
                <p>
                  It sounds more technical than it is. We&apos;ll walk you through it one step at a time. Should take about 60 seconds.
                </p>
                <div className="flex items-center gap-2 pt-1 text-navy-500">
                  <div className="w-1.5 h-1.5 rounded-full bg-coral-400 flex-shrink-0" />
                  <p className="text-xs">You only need to do this once</p>
                </div>
              </div>
              <button
                onClick={() => setStep("app-pass-steps")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-2xl transition-colors"
              >
                Show me how <ArrowRight size={16} />
              </button>
            </div>
          )}

          {/* ── App Password Steps ─────────────────────────────── */}
          {step === "app-pass-steps" && (
            <div className="animate-fade-slide-up">
              <p className="text-xs font-bold uppercase tracking-widest text-coral-500 mb-5">
                Step 2 of 3 — Getting your App Password
              </p>
              <h2 className="font-serif text-2xl font-bold text-navy-900 mb-2">
                Here&apos;s what to do:
              </h2>
              <p className="text-sm text-navy-500 mb-5">Open a new tab and work through these — tick each one as you go.</p>

              {/* Quick-start tip */}
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl mb-4 text-xs text-amber-800 leading-relaxed">
                <span className="text-base flex-shrink-0">💡</span>
                <span>
                  <strong>Quickest way:</strong> once you&apos;re signed into your outreach Gmail, just type{" "}
                  <span className="font-mono bg-amber-100 border border-amber-200 px-1.5 py-0.5 rounded">App Passwords</span>{" "}
                  in the <strong>Google search bar</strong> and it&apos;ll take you straight there — no menu-diving needed.
                </span>
              </div>

              <div className="space-y-2 mb-7">
                <CheckItem
                  checked={appPassDone.has(0)}
                  onToggle={() => toggle(setAppPassDone, 0)}
                  link={{ href: "https://gmail.com", label: "Open Gmail" }}
                >
                  Sign into <strong>{email || "your outreach Gmail"}</strong> in a new tab
                </CheckItem>
                <CheckItem
                  checked={appPassDone.has(1)}
                  onToggle={() => toggle(setAppPassDone, 1)}
                  link={{ href: "https://myaccount.google.com/security", label: "Open Security settings" }}
                >
                  Enable <strong>2-Step Verification</strong> — go to Google Account → Security, scroll to &ldquo;How you sign in to Google&rdquo;
                </CheckItem>
                <CheckItem
                  checked={appPassDone.has(2)}
                  onToggle={() => toggle(setAppPassDone, 2)}
                  link={{ href: "https://myaccount.google.com/apppasswords", label: "Open App Passwords directly" }}
                >
                  Type <span className="font-mono bg-cream-200 px-1 py-0.5 rounded text-xs">App Passwords</span> in the Google search bar — or use the link →
                </CheckItem>
                <CheckItem
                  checked={appPassDone.has(3)}
                  onToggle={() => toggle(setAppPassDone, 3)}
                >
                  In the &ldquo;App name&rdquo; box, type{" "}
                  <span className="font-mono bg-cream-200 px-1 py-0.5 rounded text-xs">Collabi</span>{" "}
                  and click <strong>Create</strong>
                </CheckItem>
                <CheckItem
                  checked={appPassDone.has(4)}
                  onToggle={() => toggle(setAppPassDone, 4)}
                >
                  Google shows a <strong>16-character password</strong> — copy it (spaces are fine)
                </CheckItem>
              </div>
              <button
                onClick={() => setStep("app-pass-enter")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-2xl transition-colors"
              >
                I&apos;ve got my password <ArrowRight size={16} />
              </button>
              <p className="text-xs text-navy-400 mt-3">
                You don&apos;t have to tick them all — click when you&apos;re ready to continue.
              </p>
            </div>
          )}

          {/* ── App Password Enter ─────────────────────────────── */}
          {step === "app-pass-enter" && (
            <div className="animate-fade-slide-up">
              <p className="text-xs font-bold uppercase tracking-widest text-coral-500 mb-5">
                Step 2 of 3 — Almost there!
              </p>
              <h2 className="font-serif text-2xl font-bold text-navy-900 mb-3">
                Paste your App Password here:
              </h2>
              <p className="text-sm text-navy-500 mb-8">
                The 16-character code Google just gave you. Spaces are fine — just paste it as-is.
              </p>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === "Enter" && password.trim().replace(/\s/g, "").length >= 10 && handleConnect()}
                placeholder="xxxx xxxx xxxx xxxx"
                autoFocus
                className="w-full text-xl font-mono tracking-[0.25em] border-0 border-b-2 border-cream-300 focus:border-coral-400 bg-transparent outline-none py-3 placeholder-cream-300 text-navy-900 transition-colors"
              />
              {connectError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mt-4">
                  <p>{connectError}</p>
                  {(connectError.toLowerCase().includes("credential") || connectError.toLowerCase().includes("invalid") || connectError.toLowerCase().includes("535")) && (
                    <p className="mt-1 text-navy-500">
                      Double-check the password was copied correctly, and that 2-Step Verification is enabled.
                    </p>
                  )}
                </div>
              )}
              <div className="flex items-center gap-4 mt-8">
                <button
                  onClick={handleConnect}
                  disabled={connecting || password.trim().replace(/\s/g, "").length < 10}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-coral-500 hover:bg-coral-600 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold rounded-2xl transition-colors"
                >
                  {connecting && <Loader2 size={15} className="animate-spin" />}
                  {connecting ? "Connecting…" : "Connect Gmail"}
                </button>
                <button
                  onClick={() => setStep("app-pass-steps")}
                  className="text-sm text-navy-400 hover:text-navy-700 transition-colors"
                >
                  ← Back
                </button>
              </div>
            </div>
          )}

          {/* ── Mode Choice ────────────────────────────────────── */}
          {step === "mode-choice" && (
            <div className="animate-fade-slide-up">
              <div className="text-center mb-8">
                <div className="text-5xl mb-4">🎉</div>
                <h2 className="font-serif text-2xl font-bold text-navy-900 mb-2">Connected!</h2>
                <p className="text-navy-500 text-sm leading-relaxed max-w-sm mx-auto">
                  One last question. When brands reply to your outreach, where would you like to see it?
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={() => setStep("imap-steps")}
                  className="w-full flex items-start gap-4 p-5 bg-coral-50 border-2 border-coral-300 hover:border-coral-400 rounded-2xl transition-all text-left"
                >
                  <div className="w-10 h-10 bg-coral-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Inbox size={20} className="text-coral-500" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-bold text-coral-800 text-sm">See replies right here in Collabi</p>
                      <span className="text-[10px] font-bold text-coral-600 bg-coral-100 px-1.5 py-0.5 rounded-full flex-shrink-0">
                        Recommended
                      </span>
                    </div>
                    <p className="text-xs text-coral-700 leading-relaxed">
                      Replies from brands land in your Collabi inbox — no need to check Gmail separately. Takes 30 seconds to enable.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setStep("done-send")}
                  className="w-full flex items-start gap-4 p-5 bg-white border-2 border-cream-200 hover:border-navy-200 rounded-2xl transition-all text-left"
                >
                  <div className="w-10 h-10 bg-cream-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Send size={20} className="text-navy-400" />
                  </div>
                  <div>
                    <p className="font-bold text-navy-900 text-sm mb-1">Just send emails for now</p>
                    <p className="text-xs text-navy-400 leading-relaxed">
                      I&apos;ll check replies directly in Gmail. I can always enable this later in Settings.
                    </p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* ── IMAP Steps ─────────────────────────────────────── */}
          {step === "imap-steps" && (
            <div className="animate-fade-slide-up">
              <p className="text-xs font-bold uppercase tracking-widest text-coral-500 mb-5">
                Step 3 of 3 — 30 seconds
              </p>
              <h2 className="font-serif text-2xl font-bold text-navy-900 mb-3">
                Enable your inbox
              </h2>
              <p className="text-sm text-navy-500 mb-4 leading-relaxed">
                We need to switch on IMAP inside Gmail settings — it&apos;s one radio button. Same technology Outlook and Apple Mail use. Takes 30 seconds.
              </p>

              {/* Direct link first */}
              <a
                href="https://mail.google.com/mail/u/0/#settings/fwdandpop"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-navy-900 hover:bg-navy-800 text-white text-sm font-bold rounded-xl transition-colors mb-5"
              >
                Open the right Gmail settings page <ExternalLink size={13} />
              </a>

              <div className="space-y-2 mb-5">
                <CheckItem
                  checked={imapDone.has(0)}
                  onToggle={() => toggle(setImapDone, 0)}
                >
                  Click the link above — make sure you&apos;re signed into your <strong>outreach Gmail</strong> first, not your personal one
                </CheckItem>
                <CheckItem
                  checked={imapDone.has(1)}
                  onToggle={() => toggle(setImapDone, 1)}
                >
                  Scroll down to the <strong>&ldquo;IMAP access&rdquo;</strong> section
                </CheckItem>
                <CheckItem
                  checked={imapDone.has(2)}
                  onToggle={() => toggle(setImapDone, 2)}
                >
                  If you see <strong>&ldquo;Enable IMAP&rdquo;</strong> as an option, select it and click <strong>Save Changes</strong>
                </CheckItem>
              </div>

              {/* Already enabled note */}
              <div className="flex items-start gap-3 p-4 bg-emerald-50 border border-emerald-200 rounded-xl mb-7 text-xs text-emerald-800 leading-relaxed">
                <span className="text-base flex-shrink-0">✅</span>
                <span>
                  <strong>If you see settings like &ldquo;Auto-Expunge&rdquo; and folder size limits, IMAP is already on</strong> — you don&apos;t need to do anything. Just click the button below.
                </span>
              </div>
              <button
                onClick={onInboxReady}
                className="inline-flex items-center gap-2 px-8 py-4 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-2xl transition-colors"
              >
                Done! Take me to my inbox <ArrowRight size={16} />
              </button>
              <p className="text-xs text-navy-400 mt-3">
                IMAP can take up to a minute to activate — if the inbox doesn&apos;t load right away, just hit refresh.
              </p>
            </div>
          )}

          {/* ── Done (send only) ───────────────────────────────── */}
          {step === "done-send" && (
            <div className="animate-fade-slide-up text-center">
              <div className="text-5xl mb-5">✅</div>
              <h2 className="font-serif text-2xl font-bold text-navy-900 mb-3">You&apos;re all set!</h2>
              <p className="text-navy-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                Your Gmail is connected. Head to Campaigns to start reaching out to brands — emails will send directly from your own address.
              </p>
              <Link
                href="/campaigns/new"
                className="inline-flex items-center gap-2 px-8 py-4 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-2xl transition-colors"
              >
                Start a campaign <ArrowRight size={16} />
              </Link>
              <p className="text-xs text-navy-400 mt-5">
                Want to see replies here later?{" "}
                <button
                  onClick={() => setStep("imap-steps")}
                  className="text-coral-500 hover:underline font-medium"
                >
                  Enable inbox →
                </button>
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
