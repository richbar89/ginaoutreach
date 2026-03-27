"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Users, TrendingUp, Bell, ChevronRight, Clock } from "lucide-react";
import { getEmailLog, getContacts, getDeals } from "@/lib/storage";
import type { Deal } from "@/lib/types";

const DEAL_STAGE_LABELS: Record<string, string> = {
  pitched: "Pitched", replied: "Replied", negotiating: "Negotiating",
  contracted: "Contracted", delivered: "Delivered", paid: "Paid",
};
const DEAL_STAGE_COLOURS: Record<string, string> = {
  pitched:     "bg-blue-50 text-blue-600",
  replied:     "bg-indigo-50 text-indigo-600",
  negotiating: "bg-amber-50 text-amber-700",
  contracted:  "bg-violet-50 text-violet-700",
  delivered:   "bg-teal-50 text-teal-700",
  paid:        "bg-emerald-50 text-emerald-700",
};

type FollowUp = { email: string; name: string; subject: string; daysAgo: number };

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

    const latestPerContact = new Map<string, { sentAt: string; subject: string; name: string }>();
    for (const r of log) {
      const existing = latestPerContact.get(r.contactEmail);
      if (!existing || r.sentAt > existing.sentAt) {
        const contact = contactList.find(c => c.email.toLowerCase() === r.contactEmail);
        latestPerContact.set(r.contactEmail, {
          sentAt: r.sentAt, subject: r.subject,
          name: contact?.name || r.contactEmail,
        });
      }
    }

    const now = Date.now();
    const chaseUps: FollowUp[] = [];
    for (const [email, { sentAt, subject, name }] of latestPerContact.entries()) {
      const daysAgo = Math.floor((now - new Date(sentAt).getTime()) / 86400000);
      if (daysAgo >= 5) chaseUps.push({ email, name, subject, daysAgo });
    }
    chaseUps.sort((a, b) => b.daysAgo - a.daysAgo);
    setFollowUps(chaseUps.slice(0, 6));
    setDeals(getDeals());
  }, []);

  const activeDeals = deals.filter(d => d.status !== "paid");
  const recentDeals = deals.slice(0, 6);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ background: "var(--blush)" }}>

      {/* Header */}
      <div
        className="flex items-center justify-between px-8 pt-7 pb-5 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <p className="text-[11px] font-medium uppercase tracking-widest text-navy-400 mb-1.5">
            {today}
          </p>
          <h1 className="font-serif text-[28px] font-bold text-navy-900 leading-none">
            Good morning, Gina.
          </h1>
        </div>
        <div className="flex items-center gap-2.5">
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border text-navy-700 text-sm font-medium rounded-xl transition-all hover:border-coral-300 hover:shadow-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <Users size={14} />
            New Campaign
          </Link>
          <Link
            href="/send"
            className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-all shadow-sm"
          >
            <Send size={14} />
            Quick Send
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 px-8 py-5 flex-shrink-0">
        {[
          { label: "Contacts", value: contactCount, sub: "in database" },
          { label: "Emails Sent", value: emailsSent, sub: "logged" },
          { label: "Active Deals", value: activeDeals.length, sub: "in pipeline" },
          {
            label: "Follow-ups Due",
            value: followUps.length,
            sub: followUps.length > 0 ? "need chasing" : "all clear",
            highlight: followUps.length > 0,
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-2xl px-5 py-4 border transition-shadow hover:shadow-sm"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-[10px] font-semibold uppercase tracking-widest text-navy-400 mb-2">
              {s.label}
            </p>
            <p
              className="font-serif text-[32px] font-bold leading-none"
              style={{ color: s.highlight ? "#2563EB" : "#0F172A" }}
            >
              {s.value}
            </p>
            <p className="text-[11px] text-navy-400 mt-1.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Widgets */}
      <div className="flex-1 min-h-0 grid grid-cols-2 gap-4 px-8 pb-7">

        {/* Follow-up Reminders */}
        <div
          className="bg-white rounded-2xl border flex flex-col overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-coral-500" />
              <span className="text-sm font-semibold text-navy-900">Follow-up Reminders</span>
            </div>
            <Link href="/contacts" className="text-[11px] text-navy-400 hover:text-coral-500 transition-colors font-medium">
              View contacts →
            </Link>
          </div>

          {followUps.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <Clock size={24} className="text-navy-200 mb-3" />
              <p className="text-sm text-navy-400">No follow-ups due.</p>
              <p className="text-xs text-navy-300 mt-1">Contacts emailed 5+ days ago appear here.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin divide-y" style={{ borderColor: "var(--border)" }}>
              {followUps.map((f) => (
                <div
                  key={f.email}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-navy-50/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-900 truncate">{f.name}</p>
                    <p className="text-xs text-navy-400 truncate">{f.subject}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-full ${
                        f.daysAgo >= 14 ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {f.daysAgo}d ago
                    </span>
                    <Link
                      href={`/send?to=${encodeURIComponent(f.email)}&name=${encodeURIComponent(f.name)}`}
                      className="p-1.5 hover:bg-coral-50 rounded-lg transition-colors"
                    >
                      <ChevronRight size={13} className="text-navy-400" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Deal Pipeline */}
        <div
          className="bg-white rounded-2xl border flex flex-col overflow-hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <div
            className="flex items-center justify-between px-5 py-3.5 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <div className="flex items-center gap-2">
              <TrendingUp size={14} className="text-coral-500" />
              <span className="text-sm font-semibold text-navy-900">Deal Pipeline</span>
            </div>
            <Link href="/pipeline" className="text-[11px] text-navy-400 hover:text-coral-500 transition-colors font-medium">
              View all →
            </Link>
          </div>

          {deals.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
              <TrendingUp size={24} className="text-navy-200 mb-3" />
              <p className="text-sm text-navy-400">No deals yet.</p>
              <p className="text-xs text-navy-300 mt-1">Positive replies in your inbox get flagged automatically.</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto scrollbar-thin divide-y" style={{ borderColor: "var(--border)" }}>
              {recentDeals.map((deal) => (
                <div
                  key={deal.id}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-navy-50/40 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-900 truncate">
                      {deal.company || deal.contactName}
                    </p>
                    <p className="text-xs text-navy-400 truncate">{deal.contactName}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {deal.value && (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg">
                        {deal.value}
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full ${
                        DEAL_STAGE_COLOURS[deal.status] || "bg-navy-100 text-navy-600"
                      }`}
                    >
                      {DEAL_STAGE_LABELS[deal.status] || deal.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
