import Link from "next/link";
import { Send, Users, ArrowRight, Zap, Shield, Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          Welcome to Mailflow
        </h1>
        <p className="mt-2 text-slate-500 text-base">
          Send one-off emails or run personalised campaigns — all from your own
          mail client.
        </p>
      </div>

      {/* Primary actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
        <Link
          href="/send"
          className="group bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-6 transition-all hover:shadow-md"
        >
          <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-100 transition-colors">
            <Send size={20} className="text-blue-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            Send an Email
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Compose and send a one-off email instantly using your default mail
            app.
          </p>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-blue-600">
            Compose now
            <ArrowRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </div>
        </Link>

        <Link
          href="/campaigns/new"
          className="group bg-white border border-slate-200 hover:border-violet-300 rounded-2xl p-6 transition-all hover:shadow-md"
        >
          <div className="w-11 h-11 bg-violet-50 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-100 transition-colors">
            <Users size={20} className="text-violet-600" />
          </div>
          <h2 className="text-lg font-semibold text-slate-900 mb-1">
            New Campaign
          </h2>
          <p className="text-sm text-slate-500 leading-relaxed">
            Upload a CSV of contacts, write your email, and send personalised
            messages in bulk.
          </p>
          <div className="mt-4 flex items-center gap-1 text-sm font-medium text-violet-600">
            Get started
            <ArrowRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </div>
        </Link>
      </div>

      {/* How it works */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-5">
          How it works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Zap size={15} className="text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">
                No setup required
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Uses your existing email client — no API keys or passwords
                needed.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Shield size={15} className="text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">
                Your data stays local
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Contacts and drafts are stored in your browser, never sent to a
                server.
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles size={15} className="text-slate-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-800">
                Personalisation built in
              </p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Use merge tags like{" "}
                <code className="text-xs bg-slate-100 px-1 py-0.5 rounded font-mono">
                  {"{{name}}"}
                </code>{" "}
                to personalise every message.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
