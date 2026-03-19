"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MailOpen, Trash2, ChevronRight, Users } from "lucide-react";
import type { Campaign } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("mailflow_campaigns");
    if (stored) setCampaigns(JSON.parse(stored));
  }, []);

  const deleteCampaign = (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    const updated = campaigns.filter((c) => c.id !== id);
    setCampaigns(updated);
    localStorage.setItem("mailflow_campaigns", JSON.stringify(updated));
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Campaigns</h1>
          <p className="text-slate-500 text-sm mt-1">
            {campaigns.length > 0
              ? `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""} saved`
              : "Bulk email campaigns with personalisation"}
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          <Plus size={15} />
          New Campaign
        </Link>
      </div>

      {campaigns.length === 0 ? (
        /* Empty state */
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <MailOpen size={24} className="text-slate-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-800 mb-1">No campaigns yet</h2>
          <p className="text-sm text-slate-400 mb-6 max-w-xs mx-auto">
            Create a campaign to send personalised bulk emails from your contact list.
          </p>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus size={15} />
            Create your first campaign
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className="group bg-white border border-slate-200 hover:border-slate-300 rounded-2xl px-6 py-5 flex items-center gap-4 transition-all hover:shadow-sm"
            >
              <div className="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <MailOpen size={18} className="text-violet-600" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-slate-900 truncate">{c.name}</h2>
                </div>
                <p className="text-xs text-slate-500 truncate mt-0.5">{c.subject}</p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 flex-shrink-0">
                <Users size={12} />
                {c.contacts.length} contact{c.contacts.length !== 1 ? "s" : ""}
              </div>

              <div className="text-xs text-slate-400 flex-shrink-0 hidden sm:block">
                {formatDate(c.createdAt)}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Link
                  href={`/campaigns/${c.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  View & Send
                  <ChevronRight size={12} />
                </Link>
                <button
                  onClick={() => deleteCampaign(c.id)}
                  className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
