"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Users, ArrowRight, Zap, TrendingUp, Clock, Bell, ChevronRight } from "lucide-react";
import { getEmailLog, getContacts, getDeals } from "@/lib/storage";
import type { Deal } from "@/lib/types";

const DEAL_STAGE_LABELS: Record<string, string> = {
  pitched: "Pitched", replied: "Replied", negotiating: "Negotiating",
  contracted: "Contracted", delivered: "Delivered", paid: "Paid",
};
const DEAL_STAGE_COLOURS: Record<string, string> = {
  pitched: "bg-navy-100 text-navy-600",
  replied: "bg-blue-100 text-blue-600",
  negotiating: "bg-amber-100 text-amber-700",
  contracted: "bg-violet-100 text-violet-700",
  delivered: "bg-teal-100 text-teal-700",
  paid: "bg-emerald-100 text-emerald-700",
};

type FollowUp = {
  email: string;
  name: string;
  subject: string;
  daysAgo: number;
};

export default function DashboardPage() {
  const [contactCount, setContactCount] = useState(0);
  const [emailsSent, setEmailsSent] = useState(0);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);

  useEffect(() => {
    const contactList = getContacts();
    setContactCount(contactList.length);

    const log = getEmailLog();
    setEmailsSent(log.length);

    // Group by email, keep most recent send per contact
    const latestPerContact = new Map<string, { sentAt: string; subject: string; name: string }>();
    for (const r of log) {
      const existing = latestPerContact.get(r.contactEmail);
      if (!existing || r.sentAt > existing.sentAt) {
        const contact = contactList.find(c => c.email.toLowerCase() === r.contactEmail);
        latestPerContact.set(r.contactEmail, {
          sentAt: r.sentAt,
          subject: r.subject,
          name: contact?.name || r.contactEmail,
        });
      }
    }

    const now = Date.now();
    const chaseUps: FollowUp[] = [];
    for (const [email, { sentAt, subject, name }] of latestPerContact.entries()) {
      const daysAgo = Math.floor((now - new Date(sentAt).getTime()) / 86400000);
      if (daysAgo >= 5) {
        chaseUps.push({ email, name, subject, daysAgo });
      }
    }
    chaseUps.sort((a, b) => b.daysAgo - a.daysAgo);
    setFollowUps(chaseUps.slice(0, 5));

    setDeals(getDeals());
  }, []);

  const activeDeals = deals.filter(d => d.status !== "paid");
  const recentDeals = deals.slice(0, 4);

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
              <span className="font-semibold text-navy-800">{contactCount} contacts</span>{" "}
              ready to reach.{" "}
              {followUps.length > 0 && (
                <><span className="font-semibold text-coral-600">{followUps.length} follow-up{followUps.length !== 1 ? "s" : ""}</span> overdue.</>
              )}
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
          {[
            { label: "Contacts", value: contactCount.toString(), note: "in your database" },
            { label: "Emails Sent", value: emailsSent.toString(), note: "logged outreach" },
            { label: "Active Deals", value: activeDeals.length.toString(), note: "in pipeline" },
            { label: "Follow-ups Due", value: followUps.length.toString(), note: followUps.length > 0 ? "need chasing" : "all up to date" },
          ].map((s) => (
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

          {/* Follow-up Reminders */}
          <div className="bg-white border border-cream-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-100">
              <div className="flex items-center gap-2.5">
                <Bell size={15} className="text-coral-500" />
                <span className="text-sm font-semibold text-navy-900">Follow-up Reminders</span>
              </div>
              <Link href="/contacts" className="text-[11px] text-navy-400 hover:text-coral-500 transition-colors font-medium">
                View contacts →
              </Link>
            </div>
            {followUps.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <Clock size={28} className="text-cream-200 mx-auto mb-3" />
                <p className="text-sm text-navy-400">No follow-ups due.</p>
                <p className="text-xs text-navy-300 mt-1">Contacts emailed 5+ days ago appear here.</p>
              </div>
            ) : (
              <div className="divide-y divide-cream-100">
                {followUps.map((f) => (
                  <div key={f.email} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 truncate">{f.name}</p>
                      <p className="text-xs text-navy-400 truncate">{f.subject}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${f.daysAgo >= 14 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}`}>
                        {f.daysAgo}d ago
                      </span>
                      <Link
                        href={`/send?to=${encodeURIComponent(f.email)}&name=${encodeURIComponent(f.name)}`}
                        className="p-1.5 hover:bg-coral-50 rounded-lg transition-colors"
                        title="Send follow-up"
                      >
                        <ChevronRight size={13} className="text-navy-400 hover:text-coral-500" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Deal Pipeline Summary */}
          <div className="bg-white border border-cream-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-cream-100">
              <div className="flex items-center gap-2.5">
                <TrendingUp size={15} className="text-coral-500" />
                <span className="text-sm font-semibold text-navy-900">Deal Pipeline</span>
              </div>
              <Link href="/pipeline" className="text-[11px] text-navy-400 hover:text-coral-500 transition-colors font-medium">
                View all →
              </Link>
            </div>
            {deals.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <TrendingUp size={28} className="text-cream-200 mx-auto mb-3" />
                <p className="text-sm text-navy-400">No deals yet.</p>
                <p className="text-xs text-navy-300 mt-1">Positive replies in your inbox get flagged automatically.</p>
              </div>
            ) : (
              <div className="divide-y divide-cream-100">
                {recentDeals.map((deal) => (
                  <div key={deal.id} className="flex items-center gap-3 px-5 py-3.5">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-navy-900 truncate">{deal.company || deal.contactName}</p>
                      <p className="text-xs text-navy-400 truncate">{deal.contactName}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {deal.value && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg">
                          {deal.value}
                        </span>
                      )}
                      <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${DEAL_STAGE_COLOURS[deal.status] || "bg-navy-100 text-navy-600"}`}>
                        {DEAL_STAGE_LABELS[deal.status] || deal.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
              <h2 className="font-serif text-2xl font-bold text-white mb-2">Send an Email</h2>
              <p className="text-coral-100 text-sm leading-relaxed mb-6">
                Compose a personalised email using your saved templates.
              </p>
              <div className="inline-flex items-center gap-2 text-white text-sm font-bold">
                Compose now
                <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform duration-200" />
              </div>
            </div>
          </Link>

          <Link
            href="/pipeline"
            className="group relative overflow-hidden rounded-2xl p-9 transition-all hover:shadow-2xl hover:shadow-navy-200 hover:-translate-y-0.5"
            style={{ background: "#0d1829" }}
          >
            <div className="absolute -top-8 -right-8 w-40 h-40 bg-navy-700 rounded-full opacity-40" />
            <div className="absolute -bottom-10 -left-6 w-32 h-32 bg-navy-800 rounded-full opacity-60" />
            <div className="relative">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-6">
                <Zap size={22} className="text-white" />
              </div>
              <h2 className="font-serif text-2xl font-bold text-white mb-2">Deal Pipeline</h2>
              <p className="text-navy-300 text-sm leading-relaxed mb-6">
                Track brand deals from first pitch to payment.
              </p>
              <div className="inline-flex items-center gap-2 text-white text-sm font-bold">
                View pipeline
                <ArrowRight size={15} className="group-hover:translate-x-1.5 transition-transform duration-200" />
              </div>
            </div>
          </Link>
        </div>

      </div>
    </div>
  );
}
