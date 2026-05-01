"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Send, CheckCircle, Loader2, Wifi, WifiOff, FileText, ChevronDown } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useDb } from "@/lib/useDb";
import { dbAppendEmailRecord, dbGetTemplates } from "@/lib/db";
import { applyMerge } from "@/lib/storage";
import { getMicrosoftUser, sendEmailViaGraph } from "@/lib/graphClient";
import { getGoogleUser, sendEmailViaGmail } from "@/lib/googleClient";
import type { EmailTemplate } from "@/lib/types";

type ConnectedUser = { name: string; email: string } | null;

function SendEmailForm() {
  const searchParams = useSearchParams();
  const getDb = useDb();
  const { userId } = useAuth();
  const [form, setForm] = useState({
    to: searchParams.get("to") || "",
    toName: searchParams.get("name") || "",
    subject: "",
    body: "",
  });
  const [msUser, setMsUser] = useState<ConnectedUser>(null);
  const [gUser, setGUser] = useState<ConnectedUser>(null);
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);

  useEffect(() => {
    setMsUser(getMicrosoftUser());
    setGUser(getGoogleUser());
    (async () => {
      const db = await getDb();
      const data = await dbGetTemplates(db);
      setTemplates(data);
    })();
  }, [getDb]);

  const loadTemplate = (t: EmailTemplate) => {
    const contact = {
      name: form.toName,
      email: form.to,
      company: "",
    };
    setForm((f) => ({
      ...f,
      subject: applyMerge(t.subject, contact),
      body: applyMerge(t.body, contact),
    }));
    setShowTemplates(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (gUser || msUser) {
      setSending(true);
      try {
        if (gUser) {
          await sendEmailViaGmail({ to: form.to, subject: form.subject, body: form.body });
        } else {
          await sendEmailViaGraph({ to: form.to, subject: form.subject, body: form.body });
        }
        const db = await getDb();
        await dbAppendEmailRecord(db, { contactEmail: form.to, subject: form.subject, body: form.body }, userId ?? undefined);
        setSuccess(true);
        setForm({ to: "", toName: "", subject: "", body: "" });
        setTimeout(() => setSuccess(false), 5000);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to send email.");
      } finally {
        setSending(false);
      }
    } else {
      const mailto =
        `mailto:${encodeURIComponent(form.to)}` +
        `?subject=${encodeURIComponent(form.subject)}` +
        `&body=${encodeURIComponent(form.body)}`;
      window.location.href = mailto;
      const db = await getDb();
      await dbAppendEmailRecord(db, { contactEmail: form.to, subject: form.subject, body: form.body }, userId ?? undefined);
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
              {gUser
                ? `Sending from ${gUser.email} via Gmail.`
                : msUser
                ? `Sending from ${msUser.email} via Microsoft 365.`
                : "Fill in the details — your mail app will open ready to send."}
            </p>
          </div>
          <div className="flex-shrink-0 mt-1">
            {gUser || msUser ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-full">
                <Wifi size={11} />
                {gUser ? "Gmail connected" : "Microsoft connected"}
              </span>
            ) : (
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-400 hover:text-coral-500 bg-cream-100 hover:bg-coral-50 border border-cream-200 hover:border-coral-200 px-2.5 py-1.5 rounded-full transition-all"
              >
                <WifiOff size={11} />
                Connect email
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Template picker */}
      {templates.length > 0 && (
        <div className="mb-5 relative">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-cream-200 hover:border-navy-200 text-navy-700 text-sm font-medium rounded-xl transition-all shadow-sm"
          >
            <FileText size={14} className="text-navy-400" />
            Use a template
            <ChevronDown size={13} className={`text-navy-400 transition-transform ${showTemplates ? "rotate-180" : ""}`} />
          </button>
          {showTemplates && (
            <div className="absolute top-full left-0 mt-1.5 w-72 bg-white border border-cream-200 rounded-xl shadow-lg z-20 overflow-hidden">
              {templates.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => loadTemplate(t)}
                  className="w-full text-left px-4 py-3 hover:bg-coral-50 border-b border-cream-100 last:border-b-0 transition-colors"
                >
                  <p className="text-sm font-semibold text-navy-800">{t.name}</p>
                  <p className="text-xs text-navy-400 truncate mt-0.5">{t.subject}</p>
                </button>
              ))}
              <div className="px-4 py-2.5 bg-cream-50 border-t border-cream-100">
                <Link href="/templates" className="text-xs text-coral-500 hover:underline font-medium">
                  Manage templates →
                </Link>
              </div>
            </div>
          )}
        </div>
      )}

      {templates.length === 0 && (
        <div className="mb-5">
          <Link href="/templates" className="inline-flex items-center gap-1.5 text-xs text-navy-400 hover:text-coral-500 transition-colors">
            <FileText size={12} />
            Create email templates to speed up outreach →
          </Link>
        </div>
      )}

      {success && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
          <CheckCircle size={16} className="text-emerald-500 flex-shrink-0" />
          {gUser
            ? "Email sent successfully via Gmail."
            : msUser
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
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-semibold text-navy-400 uppercase tracking-widest">
              Message <span className="text-coral-400">*</span>
            </label>
            <p className="text-[10px] text-navy-400">
              Use <span className="font-mono text-coral-500">[FirstName]</span> <span className="font-mono text-coral-500">[BusinessName]</span> <span className="font-mono text-coral-500">[Signature]</span>
            </p>
          </div>
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
            {gUser ? "Sends directly via Gmail" : msUser ? "Sends directly via Outlook" : "Opens your default mail app to send"}
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
            {sending ? "Sending…" : gUser ? "Send via Gmail" : msUser ? "Send via Outlook" : "Open in Mail App"}
          </button>
        </div>
      </form>
    </div>
  );
}

export default function SendEmailPage() {
  return (
    <Suspense>
      <SendEmailForm />
    </Suspense>
  );
}
