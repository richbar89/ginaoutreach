"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  CheckCircle,
  Users,
  Send,
  Loader2,
  Wifi,
  WifiOff,
  SendHorizonal,
} from "lucide-react";
import InitialsAvatar from "@/components/InitialsAvatar";
import { getCampaigns, appendEmailRecord, getEmailLog } from "@/lib/storage";
import { applyMerge } from "@/lib/storage";
import { getMicrosoftUser, sendEmailViaGraph } from "@/lib/graphClient";
import type { Campaign, Contact } from "@/lib/types";

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
  const [msUser, setMsUser] = useState<{ name: string; email: string } | null>(null);
  // Per-contact sending state: email → "sending" | "error"
  const [contactState, setContactState] = useState<Record<string, "sending" | "error">>({});
  const [sendingAll, setSendingAll] = useState(false);

  useEffect(() => {
    const campaigns = getCampaigns();
    const found = campaigns.find((c) => c.id === id);
    if (!found) { router.push("/campaigns"); return; }
    setCampaign(found);
    const log = getEmailLog();
    const alreadySent = new Set(
      log.filter((r) => r.campaignId === id).map((r) => r.contactEmail)
    );
    setSent(alreadySent);
    setMsUser(getMicrosoftUser());
  }, [id, router]);

  if (!campaign) return null;

  const markSent = (contact: Contact) => {
    setSent((prev) => new Set([...prev, contact.email.toLowerCase()]));
    appendEmailRecord({
      contactEmail: contact.email,
      subject: applyMerge(campaign.subject, contact),
      body: applyMerge(campaign.body, contact),
      campaignId: campaign.id,
      campaignName: campaign.name,
    });
  };

  const sendViaGraph = async (contact: Contact) => {
    setContactState((s) => ({ ...s, [contact.email]: "sending" }));
    try {
      await sendEmailViaGraph({
        to: contact.email,
        subject: applyMerge(campaign.subject, contact),
        body: applyMerge(campaign.body, contact),
      });
      markSent(contact);
      setContactState((s) => { const n = { ...s }; delete n[contact.email]; return n; });
    } catch {
      setContactState((s) => ({ ...s, [contact.email]: "error" }));
      setTimeout(() => {
        setContactState((s) => { const n = { ...s }; delete n[contact.email]; return n; });
      }, 3000);
    }
  };

  const sendAll = async () => {
    if (!campaign) return;
    setSendingAll(true);
    const remaining = campaign.contacts.filter(
      (c) => !sent.has(c.email.toLowerCase())
    );
    for (const contact of remaining) {
      await sendViaGraph(contact);
      // Small delay between sends to avoid rate limiting
      await new Promise((r) => setTimeout(r, 400));
    }
    setSendingAll(false);
  };

  const remaining = campaign.contacts.filter((c) => !sent.has(c.email.toLowerCase()));
  const allSent = remaining.length === 0;

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1.5 text-sm text-navy-400 hover:text-navy-800 mb-5 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to campaigns
        </Link>

        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-px w-8 bg-coral-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">
                Campaign
              </span>
            </div>
            <h1 className="font-serif text-3xl font-bold text-navy-900">{campaign.name}</h1>
            <p className="text-navy-400 text-sm mt-1">
              {campaign.contacts.length} recipient{campaign.contacts.length !== 1 ? "s" : ""} ·{" "}
              <span className="font-mono text-xs bg-cream-100 px-1.5 py-0.5 rounded">
                {campaign.subject}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            {/* Connection badge */}
            {msUser ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-full">
                <Wifi size={11} />
                Microsoft connected
              </span>
            ) : (
              <Link
                href="/settings"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-navy-400 hover:text-coral-500 bg-cream-100 hover:bg-coral-50 border border-cream-200 hover:border-coral-200 px-2.5 py-1.5 rounded-full transition-all"
              >
                <WifiOff size={11} />
                Connect Microsoft
              </Link>
            )}

            {/* Send All button — only when MS connected and emails remain */}
            {msUser && !allSent && (
              <button
                onClick={sendAll}
                disabled={sendingAll}
                className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {sendingAll ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <SendHorizonal size={14} />
                )}
                {sendingAll ? "Sending…" : `Send All (${remaining.length})`}
              </button>
            )}

            {allSent && (
              <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
                <CheckCircle size={15} />
                All sent!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      {sent.size > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between text-xs text-navy-400 mb-1.5">
            <span>{sent.size} of {campaign.contacts.length} sent</span>
            <span>{Math.round((sent.size / campaign.contacts.length) * 100)}%</span>
          </div>
          <div className="h-1.5 bg-cream-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-coral-500 rounded-full transition-all duration-500"
              style={{ width: `${(sent.size / campaign.contacts.length) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Recipients */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden mb-6 shadow-sm">
        <div className="px-6 py-4 border-b border-cream-100 flex items-center gap-2">
          <Users size={15} className="text-navy-400" />
          <span className="text-sm font-semibold text-navy-700">Recipients</span>
          <span className="ml-auto text-xs text-navy-400">
            {msUser ? "Sends directly via your Outlook" : "Opens your mail app for each email"}
          </span>
        </div>

        <div className="divide-y divide-cream-100">
          {campaign.contacts.map((contact) => {
            const isSent = sent.has(contact.email.toLowerCase());
            const state = contactState[contact.email];

            return (
              <div
                key={contact.email}
                className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                  isSent ? "bg-emerald-50/40" : "hover:bg-cream-50"
                }`}
              >
                <InitialsAvatar name={contact.name} email={contact.email} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-900">
                    {contact.name || contact.email}
                  </p>
                  {contact.name && (
                    <p className="text-xs text-navy-400">{contact.email}</p>
                  )}
                  {(contact.position || contact.company) && (
                    <p className="text-xs text-navy-400 mt-0.5">
                      {[contact.position, contact.company].filter(Boolean).join(" · ")}
                    </p>
                  )}
                </div>

                {isSent ? (
                  <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <CheckCircle size={13} />
                    Sent
                  </span>
                ) : state === "error" ? (
                  <span className="text-xs text-red-500 font-medium">Failed — retry</span>
                ) : msUser ? (
                  <button
                    onClick={() => sendViaGraph(contact)}
                    disabled={state === "sending" || sendingAll}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-60 text-white text-xs font-semibold rounded-lg transition-colors flex-shrink-0"
                  >
                    {state === "sending" ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Send size={12} />
                    )}
                    {state === "sending" ? "Sending…" : "Send"}
                  </button>
                ) : (
                  <a
                    href={buildMailto(campaign.subject, campaign.body, contact)}
                    onClick={() => markSent(contact)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-navy-800 hover:bg-navy-900 text-white text-xs font-medium rounded-lg transition-colors flex-shrink-0"
                  >
                    <Send size={12} />
                    Open in Mail
                  </a>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-cream-100">
          <h3 className="text-sm font-semibold text-navy-700">Email Preview</h3>
          <p className="text-xs text-navy-400 mt-0.5">
            Personalised for {campaign.contacts[0]?.name || campaign.contacts[0]?.email}
          </p>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <span className="text-xs font-semibold text-navy-400 uppercase tracking-widest">Subject</span>
            <p className="text-sm font-medium text-navy-800 mt-1">
              {applyMerge(campaign.subject, campaign.contacts[0])}
            </p>
          </div>
          <div>
            <span className="text-xs font-semibold text-navy-400 uppercase tracking-widest">Body</span>
            <pre className="text-sm text-navy-700 mt-1 whitespace-pre-wrap font-sans leading-relaxed">
              {applyMerge(campaign.body, campaign.contacts[0])}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
