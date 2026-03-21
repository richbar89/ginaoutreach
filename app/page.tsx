import Link from "next/link";
import { Send, Users, ArrowRight, Zap, Shield, Sparkles } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-12">
        <h1 className="font-serif text-4xl font-bold text-navy-900 tracking-tight leading-tight">
          Welcome back, Gina.
        </h1>
        <p className="mt-3 text-navy-600 text-base leading-relaxed">
          Send one-off emails or run personalised campaigns — all from your own mail client.
        </p>
      </div>

      {/* Primary actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-12">
        <Link
          href="/send"
          className="group bg-white border border-cream-200 hover:border-coral-300 rounded-2xl p-7 transition-all hover:shadow-lg hover:shadow-coral-100"
        >
          <div className="w-12 h-12 bg-coral-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-coral-100 transition-colors">
            <Send size={20} className="text-coral-500" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-navy-900 mb-2">
            Send an Email
          </h2>
          <p className="text-sm text-navy-500 leading-relaxed">
            Compose and send a one-off email instantly using your default mail app.
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-coral-500">
            Compose now
            <ArrowRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </div>
        </Link>

        <Link
          href="/campaigns/new"
          className="group bg-white border border-cream-200 hover:border-navy-300 rounded-2xl p-7 transition-all hover:shadow-lg hover:shadow-navy-100"
        >
          <div className="w-12 h-12 bg-navy-50 rounded-xl flex items-center justify-center mb-5 group-hover:bg-navy-100 transition-colors">
            <Users size={20} className="text-navy-600" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-navy-900 mb-2">
            New Campaign
          </h2>
          <p className="text-sm text-navy-500 leading-relaxed">
            Upload a CSV of contacts, write your email, and send personalised messages in bulk.
          </p>
          <div className="mt-5 flex items-center gap-1.5 text-sm font-semibold text-navy-600">
            Get started
            <ArrowRight
              size={14}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </div>
        </Link>
      </div>

      {/* How it works */}
      <div className="bg-white border border-cream-200 rounded-2xl p-8">
        <h3 className="text-xs font-semibold text-navy-400 uppercase tracking-widest mb-7">
          How it works
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div className="flex gap-4">
            <div className="w-9 h-9 bg-coral-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Zap size={16} className="text-coral-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">
                No setup required
              </p>
              <p className="text-xs text-navy-500 mt-1 leading-relaxed">
                Uses your existing email client — no API keys or passwords needed.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-9 h-9 bg-coral-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Shield size={16} className="text-coral-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">
                Your data stays local
              </p>
              <p className="text-xs text-navy-500 mt-1 leading-relaxed">
                Contacts and drafts are stored in your browser, never sent to a server.
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="w-9 h-9 bg-coral-50 rounded-xl flex items-center justify-center flex-shrink-0">
              <Sparkles size={16} className="text-coral-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-navy-900">
                Personalisation built in
              </p>
              <p className="text-xs text-navy-500 mt-1 leading-relaxed">
                Use merge tags like{" "}
                <code className="text-xs bg-cream-100 px-1 py-0.5 rounded font-mono text-coral-600">
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
