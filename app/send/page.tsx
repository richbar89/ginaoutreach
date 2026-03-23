"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle, Loader2, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";
import { appendEmailRecord } from "@/lib/storage";
import { getMicrosoftUser, sendEmailViaGraph } from "@/lib/graphClient";

type MsUser = { name: string; email: string } | null;

export default function SendEmailPage() {
  const [form, setForm] = useState({ to: "", toName: "", subject: "", body: "" });
  const [msUser, setMsUser] = useState<MsUser>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getMicrosoftUser().then(setMsUser);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (msUser) {
      // Send via Microsoft Graph
      setSending(true);
      try {
        await sendEmailViaGraph({
          to: form.to,
          subject: form.subject,
          body: form.body,
        });
        appendEmailRecord({ contactEmail: form.to, subject: form.subject, body: form.body });
        setSuccess(true);
        setForm({ to: "", toName: "", subject: "", body: "" });
        setTimeout(() => setSuccess(false), 5000);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to send email.");
      } finally {
        setSending(false);
      }
    } else {
      // Fallback: open mail client
      const mailto =
        `mailto:${encodeURIComponent(form.to)}` +
        `?subject=${encodeURIComponent(form.subject)}` +
        `&body=${encodeURIComponent(form.body)}`;
      window.location.href = mailto;
      appendEmailRecord({ contactEmail: form.to, subject: form.subject, body: form.body });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 4000);
    }
  };

  const isReady = form.to && form.subject && form.body;

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-10 bg-coral-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">
            Compose
          </span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-4xl font-bold text-navy-900 leading-tight">
              Send an Email
            </h1>
            <p className="mt-2 text-navy-500 text-base">
              {msUser
                ? `Sending from ${msUser.email} via Microsoft 365.`
                : "Fill in the details — your mail app will open ready to send."}
            </p>
          </div>
          {/* Connection indicator */}
          <div className="flex-shrink-0 mt-1">
            {msUser ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-full">
                <Wifi size={11} />
                Microsoft connected
              </span>
            ) : (
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-400 hover:text-coral-500 bg-cream-100 hover:bg-coral-50 border border-cream-200 hover:border-coral-200 px-2.5 py-1.5 rounded-full transition-all"
              >
                <WifiOff size={11} />
                Connect Microsoft
              </Link>
            )}
          </div>
        </div>
      </div>

      {success && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
          <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
          {msUser
            ? "Email sent successfully via Microsoft 365."
            : "Your mail app should have opened. Check your browser's pop-up settings if not."}
        </div>
      )}

      {error && (
        <div className="mb-6 px-4 py-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-cream-200 rounded-2xl divide-y divide-cream-100 shadow-sm"
      >
        <div className="px-7 py-5 grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">
              To <span className="text-coral-400">*</span>
            </label>
            <input
              type="email"
              required
              value={form.to}
              onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
              placeholder="recipient@example.com"
              className="input-base"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">
              Recipient Name
            </label>
            <input
              type="text"
              value={form.toName}
              onChange={(e) => setForm((f) => ({ ...f, toName: e.target.value }))}
              placeholder="Jane Smith (optional)"
              className="input-base"
            />
          </div>
        </div>

        <div className="px-7 py-5">
          <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">
            Subject <span className="text-coral-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="Your email subject line"
            className="input-base"
          />
        </div>

        <div className="px-7 py-5">
          <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">
            Message <span className="text-coral-400">*</span>
          </label>
          <textarea
            required
            rows={14}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Write your message here…"
            className="input-base resize-y font-mono leading-relaxed"
          />
        </div>

        <div className="px-7 py-5 flex items-center justify-between bg-cream-50 rounded-b-2xl">
          <p className="text-xs text-navy-400">
            {msUser ? "Sends directly via Outlook" : "Opens your default mail app to send"}
          </p>
          <button
            type="submit"
            disabled={!isReady || sending}
            className="btn-primary"
          >
            {sending ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Send size={15} />
            )}
            {msUser
              ? sending ? "Sending…" : "Send via Outlook"
              : "Open in Mail App"}
          </button>
        </div>
      </form>
    </div>
  );
}
