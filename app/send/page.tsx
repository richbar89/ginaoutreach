"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";

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
    setLaunched(true);
    setTimeout(() => setLaunched(false), 4000);
  };

  const isReady = form.to && form.subject && form.body;

  return (
    <div className="p-8 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Send Email</h1>
        <p className="mt-1 text-slate-500 text-sm">
          Fill in the details below — your mail app will open ready to send.
        </p>
      </div>

      {launched && (
        <div className="mb-6 flex items-center gap-3 px-4 py-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0" />
          Your mail app should have opened. If not, check your browser&apos;s pop-up settings.
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white border border-slate-200 rounded-2xl divide-y divide-slate-100"
      >
        {/* To */}
        <div className="px-6 py-4 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
              To <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              required
              value={form.to}
              onChange={(e) => setForm((f) => ({ ...f, to: e.target.value }))}
              placeholder="recipient@example.com"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
              Recipient Name
            </label>
            <input
              type="text"
              value={form.toName}
              onChange={(e) => setForm((f) => ({ ...f, toName: e.target.value }))}
              placeholder="Jane Smith (optional)"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
            />
          </div>
        </div>

        {/* Subject */}
        <div className="px-6 py-4">
          <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
            Subject <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            required
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            placeholder="Your email subject line"
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
          />
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <label className="block text-xs font-medium text-slate-500 mb-1.5 uppercase tracking-wide">
            Message <span className="text-red-400">*</span>
          </label>
          <textarea
            required
            rows={14}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            placeholder="Write your message here..."
            className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition resize-y font-mono leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="px-6 py-4 flex items-center justify-between bg-slate-50 rounded-b-2xl">
          <p className="text-xs text-slate-400">Opens your default mail app to send</p>
          <button
            type="submit"
            disabled={!isReady}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Send size={15} />
            Open in Mail App
          </button>
        </div>
      </form>
    </div>
  );
}
