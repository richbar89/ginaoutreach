"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, Mail } from "lucide-react";
import { signInWithGoogle, getGoogleUser } from "@/lib/googleClient";
import { signInWithMicrosoft, getMicrosoftUser } from "@/lib/graphClient";

export default function OnboardingPage() {
  const router = useRouter();
  const [connecting, setConnecting] = useState<"gmail" | "microsoft" | null>(null);
  const [error, setError] = useState("");

  // Skip onboarding if already connected
  useEffect(() => {
    if (getGoogleUser() || getMicrosoftUser()) {
      router.replace("/");
    }
  }, [router]);

  const handleGmail = async () => {
    setError("");
    setConnecting("gmail");
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Connection failed.";
      if (!msg.toLowerCase().includes("cancelled")) setError(msg);
      setConnecting(null);
    }
  };

  const handleMicrosoft = async () => {
    setError("");
    setConnecting("microsoft");
    try {
      const account = await signInWithMicrosoft();
      if (account) router.replace("/");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Connection failed.";
      if (
        !msg.toLowerCase().includes("cancelled") &&
        !msg.toLowerCase().includes("user_cancelled")
      ) {
        setError(msg);
      }
      setConnecting(null);
    }
  };

  return (
    <div className="min-h-screen bg-cream-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Logo / brand mark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-coral-500 rounded-2xl mb-5">
            <Mail size={26} className="text-white" />
          </div>
          <h1 className="font-serif text-3xl font-bold text-navy-900">
            One last step
          </h1>
          <p className="mt-3 text-navy-500 text-base leading-relaxed">
            Connect your email account so you can send outreach directly from your own address.
          </p>
        </div>

        <div className="space-y-3">
          {/* Gmail */}
          <button
            onClick={handleGmail}
            disabled={!!connecting}
            className="w-full flex items-center gap-4 p-5 bg-white border-2 border-cream-200 hover:border-coral-300 hover:shadow-md rounded-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed text-left"
          >
            <div className="flex-shrink-0">
              <svg width="32" height="32" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-navy-900">Connect Gmail</p>
              <p className="text-xs text-navy-400 mt-0.5">Use if your email ends in @gmail.com</p>
            </div>
            {connecting === "gmail" ? (
              <Loader2 size={18} className="flex-shrink-0 text-coral-500 animate-spin" />
            ) : (
              <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-cream-300" />
            )}
          </button>

          {/* Microsoft */}
          <button
            onClick={handleMicrosoft}
            disabled={!!connecting}
            className="w-full flex items-center gap-4 p-5 bg-white border-2 border-cream-200 hover:border-coral-300 hover:shadow-md rounded-2xl transition-all disabled:opacity-60 disabled:cursor-not-allowed text-left"
          >
            <div className="flex-shrink-0">
              <svg width="32" height="32" viewBox="0 0 21 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="1" y="1" width="9" height="9" fill="#F25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7FBA00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00A4EF"/>
                <rect x="11" y="11" width="9" height="9" fill="#FFB900"/>
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-navy-900">Connect Microsoft / Outlook</p>
              <p className="text-xs text-navy-400 mt-0.5">Use if your email ends in @outlook.com, @hotmail.com, or your company uses Microsoft 365</p>
            </div>
            {connecting === "microsoft" ? (
              <Loader2 size={18} className="flex-shrink-0 text-coral-500 animate-spin" />
            ) : (
              <div className="flex-shrink-0 w-5 h-5 rounded-full border-2 border-cream-300" />
            )}
          </button>
        </div>

        {error && (
          <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
            {error}
          </p>
        )}

        <p className="mt-6 text-center text-xs text-navy-400">
          Not sure?{" "}
          <button
            onClick={() => router.replace("/")}
            className="text-coral-500 hover:underline"
          >
            Skip for now
          </button>{" "}
          — you can connect later in Settings.
        </p>
      </div>
    </div>
  );
}
