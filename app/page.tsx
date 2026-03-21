import Link from "next/link";
import { Send, Users, ArrowRight, Zap, Shield, Sparkles } from "lucide-react";

const stats = [
  { label: "Total Contacts", value: "247", note: "+12 this week" },
  { label: "Campaigns Created", value: "12", note: "3 active" },
  { label: "Emails Sent", value: "1,840", note: "+340 this month" },
  { label: "Avg. Open Rate", value: "34%", note: "Above average" },
];

export default function DashboardPage() {
  return (
    <div className="min-h-full">

      {/* Hero Banner */}
      <div
        className="border-b border-cream-200 px-10 py-14"
        style={{ background: "linear-gradient(135deg, #fef4f2 0%, #fdf8f4 60%, #f9f0e8 100%)" }}
      >
        <div className="max-w-5xl mx-auto flex items-end justify-between gap-8">
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-10 bg-coral-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">
                Dashboard
              </span>
            </div>
            <h1 className="font-serif text-5xl font-bold text-navy-900 leading-[1.1] mb-4">
              Good morning,<br />Gina.
            </h1>
            <p className="text-navy-500 text-base leading-relaxed max-w-md">
              You have{" "}
              <span className="font-semibold text-navy-800">247 contacts</span>{" "}
              ready to reach. Your last campaign had a{" "}
              <span className="font-semibold text-coral-600">34% open rate</span>.
            </p>
          </div>
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0 pb-1">
            <Link
              href="/campaigns/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-cream-200 hover:border-navy-200 text-navy-800 text-sm font-semibold rounded-xl transition-all hover:shadow-md"
            >
              <Users size={15} />
              New Campaign
            </Link>
            <Link
              href="/send"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-coral-200"
            >
              <Send size={15} />
              Quick Send
            </Link>
          </div>
        </div>
      </div>

      <div className="px-10 py-10 max-w-5xl mx-auto">

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {stats.map((s) => (
            <div
              key={s.label}
              className="bg-white border border-cream-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-cream-300 transition-all"
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-navy-400 mb-3">
                {s.label}
              </p>
              <p className="font-serif text-4xl font-bold text-navy-900 leading-none mb-2">
                {s.value}
              </p>
              <p className="text-xs text-navy-400">{s.note}</p>
            </div>
          ))}
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10">
          <Link
            href="/send"
            className="group relative overflow-hidden bg-coral-500 hover:bg-coral-600 rounded-2xl p-9 transition-all hover:shadow-2xl hover:shadow-coral-200 hover:-translate-y-0.5"
          >
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-coral-400 rounded-full opacity-25" />
            <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-coral-600 rounded-full opacity-20" />
            <div className="relative">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mb-6">
                <Send size={22} className="text-white" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-white mb-2">
                Send an Email
              </h2>
              <p className="text-coral-100 text-sm leading-relaxed mb-6">
                Compose a personalised email that opens instantly in your mail client.
              </p>
              <div className="inline-flex items-center gap-2 text-white text-sm font-bold">
                Compose now
                <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform duration-200" />
              </div>
            </div>
          </Link>

          <Link
            href="/campaigns/new"
            className="group relative overflow-hidden rounded-2xl p-9 transition-all hover:shadow-2xl hover:shadow-navy-200 hover:-translate-y-0.5"
            style={{ background: "#0d1829" }}
          >
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-navy-700 rounded-full opacity-40" />
            <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-navy-800 rounded-full opacity-60" />
            <div className="relative">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <Users size={22} className="text-white" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-white mb-2">
                New Campaign
              </h2>
              <p className="text-navy-300 text-sm leading-relaxed mb-6">
                Upload contacts, write once, and send personalised messages to hundreds.
              </p>
              <div className="inline-flex items-center gap-2 text-white text-sm font-bold">
                Get started
                <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform duration-200" />
              </div>
            </div>
          </Link>
        </div>

        {/* How it works */}
        <div className="bg-white border border-cream-200 rounded-2xl p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px w-8 bg-coral-300" />
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-navy-400">
              How it works
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                icon: Zap,
                title: "No setup required",
                desc: "Uses your existing email client — no API keys or passwords needed.",
              },
              {
                icon: Shield,
                title: "Your data stays local",
                desc: "Contacts and drafts are stored in your browser, never sent to a server.",
              },
              {
                icon: Sparkles,
                title: "Personalisation built in",
                desc: "Use merge tags like {{name}} to personalise every message automatically.",
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 bg-coral-50 border border-coral-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={17} className="text-coral-500" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-navy-900 mb-1.5">{title}</p>
                  <p className="text-xs text-navy-400 leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
