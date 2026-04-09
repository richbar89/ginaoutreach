"use client";

import { useState } from "react";

export default function DataRemovalPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState<"idle" | "saving" | "done" | "error">("idle");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setStatus("saving");
    try {
      const res = await fetch("/api/data-removal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, reason }),
      });
      setStatus(res.ok ? "done" : "error");
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-start justify-center px-6 py-16">
      <div className="w-full max-w-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Data Removal Request</h1>
        <p className="text-gray-500 mb-8 leading-relaxed">
          If you are a brand contact and would like your details removed from the Collabi database, please complete this form. We will process your request within 5 business days.
        </p>

        {status === "done" ? (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-6 py-8 text-center">
            <p className="text-green-800 font-semibold mb-1">Request received</p>
            <p className="text-green-600 text-sm">
              We&apos;ll remove your details from our database within 5 business days and confirm by email.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Jane Smith"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address to remove <span className="text-red-500">*</span></label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="jane@brand.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">Reason (optional)</label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                rows={3}
                placeholder="e.g. I no longer work at this company, or I prefer not to receive outreach."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100 resize-none"
              />
            </div>
            {status === "error" && (
              <p className="text-red-500 text-sm">Something went wrong. Please email us directly at <a href="mailto:hello@collabi.io" className="underline">hello@collabi.io</a>.</p>
            )}
            <button
              type="submit"
              disabled={status === "saving" || !email.trim()}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors"
            >
              {status === "saving" ? "Submitting…" : "Submit removal request"}
            </button>
            <p className="text-xs text-gray-400 text-center">
              Your request will be processed within 5 business days. You&apos;ll receive a confirmation email.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
