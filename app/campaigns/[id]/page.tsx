"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, CheckCircle, Users, Mail } from "lucide-react";
import type { Campaign, Contact } from "@/lib/types";

function applyMerge(template: string, contact: Contact) {
  return template
    .replace(/\{\{name\}\}/g, contact.name || "")
    .replace(/\{\{email\}\}/g, contact.email || "")
    .replace(/\{\{position\}\}/g, contact.position || "")
    .replace(/\{\{company\}\}/g, contact.company || "");
}

function buildMailto(subject: string, body: string, contact: Contact) {
  return (
    `mailto:${encodeURIComponent(contact.email)}` +
    `?subject=${encodeURIComponent(applyMerge(subject, contact))}` +
    `&body=${encodeURIComponent(applyMerge(body, contact))}`
  );
}

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => {
    const stored = localStorage.getItem("mailflow_campaigns");
    if (!stored) return;
    const campaigns: Campaign[] = JSON.parse(stored);
    const found = campaigns.find((c) => c.id === id);
    if (!found) router.push("/campaigns");
    else setCampaign(found);
  }, [id, router]);

  if (!campaign) return null;

  const markSent = (email: string) => {
    setSent((prev) => new Set([...prev, email]));
  };

  const allSent = sent.size === campaign.contacts.length;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to campaigns
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">{campaign.name}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {campaign.contacts.length} recipient{campaign.contacts.length !== 1 ? "s" : ""} ·{" "}
              <span className="font-mono text-xs bg-slate-100 px-1.5 py-0.5 rounded">
                {campaign.subject}
              </span>
            </p>
          </div>
          {allSent && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm font-medium">
              <CheckCircle size={15} />
              All sent!
            </div>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {sent.size > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
            <span>{sent.size} of {campaign.contacts.length} opened</span>
            <span>{Math.round((sent.size / campaign.contacts.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-500"
              style={{ width: `${(sent.size / campaign.contacts.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Contact list */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
          <Users size={15} className="text-slate-400" />
          <span className="text-sm font-medium text-slate-700">Recipients</span>
          <span className="ml-auto text-xs text-slate-400">
            Click &ldquo;Open in Mail&rdquo; to send each email
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {campaign.contacts.map((contact) => {
            const isSent = sent.has(contact.email);
            const href = buildMailto(campaign.subject, campaign.body, contact);
            return (
              <div
                key={contact.email}
                className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                  isSent ? "bg-green-50/50" : "hover:bg-slate-50"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-slate-900">
                      {contact.name || contact.email}
                    </p>
                    {contact.name && (
                      <span className="text-xs text-slate-400">{contact.email}</span>
                    )}
                  </div>
                  {(contact.position || contact.company) && (
                    <p className="text-xs text-slate-400 mt-0.5">
                      {[contact.position, contact.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                  {isSent ? (
                    <span className="inline-flex items-center gap-1.5 text-xs text-green-600 font-medium">
                      <CheckCircle size={13} />
                      Opened
                    </span>
                  ) : (
                    <a
                      href={href}
                      onClick={() => markSent(contact.email)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                    >
                      <Mail size={12} />
                      Open in Mail
                      <ExternalLink size={10} className="opacity-70" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview panel */}
      <div className="mt-6 bg-white border border-slate-200 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-medium text-slate-700">Email Preview</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Showing personalised for first contact
          </p>
        </div>
        <div className="px-6 py-5">
          <div className="mb-3">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Subject</span>
            <p className="text-sm text-slate-800 mt-1 font-medium">
              {applyMerge(campaign.subject, campaign.contacts[0])}
            </p>
          </div>
          <div>
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Body</span>
            <pre className="text-sm text-slate-700 mt-1 whitespace-pre-wrap font-sans leading-relaxed">
              {applyMerge(campaign.body, campaign.contacts[0])}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
