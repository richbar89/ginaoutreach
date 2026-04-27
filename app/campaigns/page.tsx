"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, MailOpen, Trash2, ChevronRight, Users } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { dbGetCampaigns, dbDeleteCampaign } from "@/lib/db";
import type { Campaign } from "@/lib/types";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CampaignsPage() {
  const getDb = useDb();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const data = await dbGetCampaigns(db);
      setCampaigns(data);
      setLoading(false);
    })();
  }, [getDb]);

  const deleteCampaign = async (id: string) => {
    if (!confirm("Delete this campaign?")) return;
    const updated = campaigns.filter((c) => c.id !== id);
    setCampaigns(updated);
    const db = await getDb();
    await dbDeleteCampaign(db, id);
  };

  return (
    <div className="p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-serif text-4xl font-bold text-navy-900 tracking-tight">
            Campaigns
          </h1>
          <p className="text-navy-500 text-base mt-2">
            {campaigns.length > 0
              ? `${campaigns.length} campaign${campaigns.length !== 1 ? "s" : ""} saved`
              : "Bulk email campaigns with personalisation"}
          </p>
        </div>
        <Link
          href="/campaigns/new"
          className="btn-primary"
        >
          <Plus size={15} />
          New Campaign
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3 animate-pulse">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white border border-cream-200 rounded-2xl px-7 py-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-cream-200 rounded-xl flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-cream-200 rounded w-48" />
                <div className="h-3 bg-cream-100 rounded w-72" />
              </div>
              <div className="h-3 bg-cream-100 rounded w-20" />
              <div className="h-3 bg-cream-100 rounded w-16" />
              <div className="h-8 bg-cream-200 rounded-xl w-24" />
            </div>
          ))}
        </div>
      ) : campaigns.length === 0 ? (
        <div className="bg-white border border-cream-200 rounded-2xl p-16 text-center shadow-sm shadow-cream-200">
          <div className="w-14 h-14 bg-coral-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <MailOpen size={24} className="text-coral-400" />
          </div>
          <h2 className="font-serif text-xl font-semibold text-navy-900 mb-2">No campaigns yet</h2>
          <p className="text-sm text-navy-400 mb-7 max-w-xs mx-auto leading-relaxed">
            Create a campaign to send personalised bulk emails from your contact list.
          </p>
          <Link
            href="/campaigns/new"
            className="btn-primary"
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
              className="group bg-white border border-cream-200 hover:border-coral-200 rounded-2xl px-7 py-5 flex items-center gap-4 transition-all hover:shadow-md hover:shadow-coral-50"
            >
              <div className="w-10 h-10 bg-coral-50 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-coral-100 transition-colors">
                <MailOpen size={18} className="text-coral-500" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-sm font-semibold text-navy-900 truncate">{c.name}</h2>
                <p className="text-xs text-navy-400 truncate mt-0.5">{c.subject}</p>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-navy-400 flex-shrink-0">
                <Users size={12} />
                {c.contacts.length} contact{c.contacts.length !== 1 ? "s" : ""}
              </div>

              <div className="text-xs text-navy-300 flex-shrink-0 hidden sm:block">
                {formatDate(c.createdAt)}
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Link
                  href={`/campaigns/${c.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-navy-600 hover:text-coral-600 hover:bg-coral-50 rounded-lg transition-colors"
                >
                  View & Send
                  <ChevronRight size={12} />
                </Link>
                <button
                  onClick={() => deleteCampaign(c.id)}
                  className="p-1.5 text-navy-200 hover:text-coral-500 hover:bg-coral-50 rounded-lg transition-colors"
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
