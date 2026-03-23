"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Send,
  Linkedin,
  Building2,
  Briefcase,
  Mail,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { leads } from "@/lib/leads-data";
import { getContactEmailLog } from "@/lib/storage";
import type { EmailRecord } from "@/lib/types";

function weeksAgo(dateStr: string): number {
  return (Date.now() - new Date(dateStr).getTime()) / (1000 * 60 * 60 * 24 * 7);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function timeLabel(dateStr: string): string {
  const weeks = weeksAgo(dateStr);
  if (weeks < 1) {
    const days = Math.floor(weeks * 7);
    return days <= 0 ? "today" : `${days} day${days !== 1 ? "s" : ""} ago`;
  }
  const w = Math.floor(weeks);
  return `${w} week${w !== 1 ? "s" : ""} ago`;
}

export default function ProspectProfilePage() {
  const { email: encodedEmail } = useParams<{ email: string }>();
  const router = useRouter();
  const email = decodeURIComponent(encodedEmail);

  const lead = leads.find((l) => l.email.toLowerCase() === email.toLowerCase());
  if (!lead) {
    return (
      <div className="p-10 text-center">
        <p className="text-navy-400 text-sm mb-4">Contact not found.</p>
        <button onClick={() => router.back()} className="text-coral-500 text-sm hover:underline">
          Go back
        </button>
      </div>
    );
  }

  const emailLog: EmailRecord[] = getContactEmailLog(email);
  const lastEmail = emailLog[0] ?? null; // log is newest-first
  const lastWeeks = lastEmail ? weeksAgo(lastEmail.sentAt) : null;
  const recentlyContacted = lastWeeks !== null && lastWeeks < 4;
  const firstName = lead.name.split(" ")[0];

  return (
    <div className="p-8 max-w-3xl mx-auto">
      {/* Back */}
      <Link
        href="/contacts"
        className="inline-flex items-center gap-1.5 text-sm text-navy-400 hover:text-navy-800 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        Back to contacts
      </Link>

      {/* Recent contact alert */}
      {recentlyContacted && lastEmail && (
        <div className="mb-6 flex items-start gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-2xl">
          <AlertTriangle size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">
              {firstName} was contacted {timeLabel(lastEmail.sentAt)}
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              Do you need to reach out again, or give them more time?
            </p>
          </div>
        </div>
      )}

      {/* Profile header */}
      <div className="bg-white border border-cream-200 rounded-2xl p-7 mb-5 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          {/* Avatar */}
          <div className="flex items-center gap-5">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 text-white font-serif text-xl font-bold"
              style={{ background: "linear-gradient(135deg, #e8715a, #d4533a)" }}
            >
              {lead.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="font-serif text-2xl font-bold text-navy-900 leading-tight">
                {lead.name}
              </h1>
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                {lead.position && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-navy-500">
                    <Briefcase size={12} className="text-navy-300" />
                    {lead.position}
                  </span>
                )}
                {lead.company && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-navy-500">
                    <Building2 size={12} className="text-navy-300" />
                    {lead.company}
                  </span>
                )}
                {lead.email && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-navy-500">
                    <Mail size={12} className="text-navy-300" />
                    {lead.email}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {lead.linkedin && (
              <a
                href={lead.linkedin.startsWith("http") ? lead.linkedin : `https://${lead.linkedin}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 border border-cream-200 hover:border-navy-200 bg-white text-navy-600 hover:text-navy-900 text-xs font-medium rounded-xl transition-all"
              >
                <Linkedin size={13} />
                LinkedIn
              </a>
            )}
            <Link
              href={`/send?to=${encodeURIComponent(lead.email)}&name=${encodeURIComponent(lead.name)}`}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold rounded-xl transition-colors"
            >
              <Send size={13} />
              Send Email
            </Link>
          </div>
        </div>
      </div>

      {/* Email history */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-cream-100 flex items-center gap-2">
          <Clock size={14} className="text-navy-400" />
          <span className="text-sm font-semibold text-navy-700">Email History</span>
          {emailLog.length > 0 && (
            <span className="ml-auto text-xs text-navy-400">
              {emailLog.length} email{emailLog.length !== 1 ? "s" : ""} sent
            </span>
          )}
        </div>

        {emailLog.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <Mail size={28} className="text-cream-200 mx-auto mb-3" />
            <p className="text-sm text-navy-400">No emails sent to {firstName} yet.</p>
            <Link
              href={`/send?to=${encodeURIComponent(lead.email)}&name=${encodeURIComponent(lead.name)}`}
              className="inline-flex items-center gap-1.5 mt-4 text-xs text-coral-500 hover:text-coral-700 font-medium"
            >
              <Send size={12} />
              Send your first email
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-cream-100">
            {emailLog.map((record) => (
              <div key={record.id} className="px-6 py-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                    <p className="text-sm font-semibold text-navy-900">{record.subject}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs text-navy-400">{formatDate(record.sentAt)}</p>
                    {record.campaignName && (
                      <p className="text-[10px] text-navy-300 mt-0.5">
                        via {record.campaignName}
                      </p>
                    )}
                  </div>
                </div>
                <pre className="text-xs text-navy-500 whitespace-pre-wrap font-sans leading-relaxed bg-cream-50 rounded-xl px-4 py-3 border border-cream-100">
                  {record.body}
                </pre>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
