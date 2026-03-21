"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import { appendEmailRecord } from "@/lib/storage";

export default function SendEmailPage() {
  const [form, setForm] = useState({ to: "", toName: "", subject: "", body: "" });
  const [launched, setLaunched] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailto =
      `mailto:${encodeURIComponent(form.to)}` +
      `?subject=${encodeURIComponent(form.subject)}` +
      `&body=${encodeURIComponent(form.body)}`;
    window.location.href = mailto;

    appendEmailRecord({
      contactEmail: form.to,
      subject: form.subject,
      body: form.body,
    });

    setLaunched(true);
    setTimeout(() => setLaunched(false), 4000);
  };

  const isReady = form.to && form.subject && form.body;

  return (
    <div className="p-10 max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="font-serif text-4xl font-bold text-navy-900 tracking-tight">
          Send an Email
        </h1>
        <p className="mt-2 text-navy-500 text-base">
          Fill in the details below — your mail app will open ready to send.
        </p>
      </div>

      {launched && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-coral-50 border border-coral-200 rounded-xl text-coral-700 text-sm font-medium">
          <CheckCircle size={16} className="text-coral-500 flex-shrink-0" />
          Your mail app should have opened. If not, check your browser&apos;s pop-up settings.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-cream-200 rounded-2xl divide-y divide-cream-100 shadow-sm shadow-cream-200"
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
            placeholder="Write your message here..."
            className="input-base resize-y font-mono leading-relaxed"
          />
        </div>

        <div className="px-7 py-5 flex items-center justify-between bg-cream-50 rounded-b-2xl">
          <p className="text-xs text-navy-400">Opens your default mail app to send</p>
          <button
            type="submit"
            disabled={!isReady}
            className="btn-primary"
          >
            <Send size={15} />
            Open in Mail App
          </button>
        </div>
      </form>
    </div>
  );
}
