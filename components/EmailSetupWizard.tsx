"use client";

import { useEffect, useState } from "react";
import { ArrowRight, ExternalLink, Inbox, Lock, Send } from "lucide-react";
import { connectEmailUrl } from "@/lib/emailClient";

type Step = "intro" | "connect";

const PROGRESS: Record<Step, number> = {
  intro: 30,
  connect: 70,
};

interface Props {
  initialStep?: Step;
  returnTo?: string;
}

export function EmailSetupWizard({ initialStep = "intro", returnTo = "/inbox" }: Props) {
  const [step, setStep] = useState<Step>(initialStep);
  const [connectError, setConnectError] = useState("");

  // Surface an error handed back by the OAuth callback (?email_error=…)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("email_error");
    if (err) {
      setConnectError(err);
      setStep("connect");
    }
  }, []);

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
                Connect your email so you can send outreach directly from Collabi — and see when brands reply, right here. One click, about 30 seconds.
              </p>
              <button
                onClick={() => setStep("connect")}
                className="inline-flex items-center gap-2 px-8 py-4 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-2xl transition-colors text-base"
              >
                Let&apos;s go <ArrowRight size={18} />
              </button>
            </div>
          )}

          {/* ── Connect ───────────────────────────────────────── */}
          {step === "connect" && (
            <div className="animate-fade-slide-up">
              <p className="text-xs font-bold uppercase tracking-widest text-coral-500 mb-5">One last step</p>
              <h2 className="font-serif text-2xl font-bold text-navy-900 mb-6">
                Connect your outreach email
              </h2>

              {/* Dedicated-account recommendation */}
              <div className="bg-white border-2 border-navy-900 rounded-2xl p-5 mb-5 shadow-sm">
                <p className="text-sm font-bold text-navy-900 mb-2">
                  We strongly recommend a dedicated address — not your personal one.
                </p>
                <p className="text-sm text-navy-500 leading-relaxed mb-4">
                  High-volume cold email can get accounts flagged as spam. A separate outreach account (takes 2 minutes to create) keeps the risk completely isolated from your personal email.
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

              {/* What you get */}
              <div className="space-y-2.5 mb-6">
                <div className="flex items-center gap-3 text-sm text-navy-700">
                  <Send size={15} className="text-coral-500 flex-shrink-0" />
                  Send outreach and follow-ups from your own address
                </div>
                <div className="flex items-center gap-3 text-sm text-navy-700">
                  <Inbox size={15} className="text-coral-500 flex-shrink-0" />
                  See brand replies right here in your Collabi inbox
                </div>
                <div className="flex items-center gap-3 text-sm text-navy-700">
                  <Lock size={15} className="text-coral-500 flex-shrink-0" />
                  Secure sign-in with Google or Microsoft — we never see your password
                </div>
              </div>

              {connectError && (
                <div className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-5">
                  {connectError}
                </div>
              )}

              <a
                href={connectEmailUrl(returnTo)}
                className="inline-flex items-center gap-2 px-8 py-4 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-2xl transition-colors"
              >
                Connect your email <ArrowRight size={16} />
              </a>
              <p className="text-xs text-navy-400 mt-3">
                Works with Gmail, Outlook and most other providers. You&apos;ll be sent to your provider&apos;s own sign-in page and brought straight back.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
