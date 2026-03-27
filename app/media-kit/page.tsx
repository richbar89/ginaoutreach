"use client";

import { useState, useEffect } from "react";
import {
  RefreshCw, Link2, Plus, Trash2, Loader2, CheckCircle,
  Instagram, Eye, Copy, ExternalLink,
} from "lucide-react";
import { getMediaKit, saveMediaKit } from "@/lib/storage";
import type { MediaKit } from "@/lib/types";

export default function MediaKitPage() {
  const [kit, setKit] = useState<MediaKit | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshMsg, setRefreshMsg] = useState("");
  const [generating, setGenerating] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState(false);
  const [sqlError, setSqlError] = useState("");

  useEffect(() => {
    setKit(getMediaKit());
  }, []);

  const update = (patch: Partial<MediaKit>) => {
    setKit((k) => k ? { ...k, ...patch } : k);
  };

  const handleSave = () => {
    if (!kit) return;
    saveMediaKit(kit);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const refreshInstagram = async () => {
    setRefreshing(true);
    setRefreshMsg("");
    try {
      const res = await fetch("/api/meta/analytics");
      if (!res.ok) {
        setRefreshMsg("Instagram not connected — go to My Analytics to connect.");
        return;
      }
      const data = await res.json();
      if (data.error === "not_connected") {
        setRefreshMsg("Instagram not connected — go to My Analytics to connect.");
        return;
      }
      const { profile, posts, engagementRate } = data;
      const avgLikes = posts?.length
        ? Math.round(posts.reduce((s: number, p: { like_count?: number }) => s + (p.like_count ?? 0), 0) / posts.length)
        : undefined;
      update({
        igFollowers: profile?.followers_count,
        igEngagementRate: engagementRate,
        igAvgLikes: avgLikes,
        igPostCount: profile?.media_count,
        igLastRefreshed: new Date().toISOString(),
        name: kit?.name || profile?.name || "",
        handle: kit?.handle || (profile?.username ? `@${profile.username}` : ""),
        bio: kit?.bio || profile?.biography || "",
        profileImageUrl: profile?.profile_picture_url || kit?.profileImageUrl,
      });
      setRefreshMsg("Instagram stats updated.");
      setTimeout(() => setRefreshMsg(""), 3000);
    } catch {
      setRefreshMsg("Failed to refresh. Try again.");
    } finally {
      setRefreshing(false);
    }
  };

  const generateLink = async () => {
    if (!kit) return;
    saveMediaKit(kit);
    setGenerating(true);
    setSqlError("");
    try {
      const res = await fetch("/api/media-kit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(kit),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error?.includes("CREATE TABLE")) setSqlError(data.error);
        else setSqlError(data.error || "Failed to generate link.");
        return;
      }
      const url = `${window.location.origin}/kit/${data.token}`;
      setShareUrl(url);
    } catch {
      setSqlError("Failed to generate link.");
    } finally {
      setGenerating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!kit) return null;

  const rateRow = (idx: number) => (
    <div key={idx} className="flex gap-3 items-center">
      <input
        value={kit.rates[idx]?.label || ""}
        onChange={(e) => {
          const rates = [...kit.rates];
          rates[idx] = { ...rates[idx], label: e.target.value };
          update({ rates });
        }}
        placeholder="e.g. Instagram Reel"
        className="input-base flex-1"
      />
      <input
        value={kit.rates[idx]?.price || ""}
        onChange={(e) => {
          const rates = [...kit.rates];
          rates[idx] = { ...rates[idx], price: e.target.value };
          update({ rates });
        }}
        placeholder="£500"
        className="input-base w-28"
      />
      <button
        onClick={() => update({ rates: kit.rates.filter((_, i) => i !== idx) })}
        className="p-2 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
      >
        <Trash2 size={13} className="text-navy-400 hover:text-red-500" />
      </button>
    </div>
  );

  return (
    <div className="p-10 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-10 bg-coral-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">Media Kit</span>
        </div>
        <div className="flex items-start justify-between gap-6">
          <div>
            <h1 className="font-serif text-4xl font-bold text-navy-900 leading-tight">Your Media Kit</h1>
            <p className="mt-2 text-navy-500 text-base max-w-md">
              Fill this in once. Share a live link with brands — no PDF needed.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setPreview(!preview)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-cream-200 hover:border-navy-200 text-navy-700 text-sm font-medium rounded-xl transition-all"
            >
              <Eye size={14} /> {preview ? "Edit" : "Preview"}
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-cream-200 hover:border-navy-200 text-navy-700 text-sm font-medium rounded-xl transition-all"
            >
              {saved ? <CheckCircle size={14} className="text-emerald-500" /> : null}
              {saved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>

      {/* Instagram refresh */}
      <div className="mb-8 flex items-center justify-between px-5 py-4 bg-white border border-cream-200 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
            <Instagram size={14} className="text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-navy-900">Instagram Stats</p>
            <p className="text-xs text-navy-400">
              {kit.igLastRefreshed
                ? `Last updated ${new Date(kit.igLastRefreshed).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}`
                : "Not yet pulled"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {kit.igFollowers && (
            <div className="text-right">
              <p className="text-lg font-serif font-bold text-navy-900">{kit.igFollowers.toLocaleString()}</p>
              <p className="text-[10px] text-navy-400 uppercase tracking-wide">Followers</p>
            </div>
          )}
          {kit.igEngagementRate && (
            <div className="text-right">
              <p className="text-lg font-serif font-bold text-coral-500">{kit.igEngagementRate}%</p>
              <p className="text-[10px] text-navy-400 uppercase tracking-wide">Engagement</p>
            </div>
          )}
          <button
            onClick={refreshInstagram}
            disabled={refreshing}
            className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white text-xs font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            <RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>
      {refreshMsg && (
        <p className={`-mt-5 mb-6 text-xs px-1 ${refreshMsg.includes("updated") ? "text-emerald-600" : "text-amber-600"}`}>
          {refreshMsg}
        </p>
      )}

      <div className="space-y-6">
        {/* About */}
        <Section title="About You">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name">
              <input value={kit.name} onChange={(e) => update({ name: e.target.value })} placeholder="Gina Burgess" className="input-base" />
            </Field>
            <Field label="Handle">
              <input value={kit.handle} onChange={(e) => update({ handle: e.target.value })} placeholder="@ginanutrition" className="input-base" />
            </Field>
          </div>
          <Field label="Tagline">
            <input value={kit.tagline} onChange={(e) => update({ tagline: e.target.value })} placeholder="Food & drinks content creator based in the UK" className="input-base" />
          </Field>
          <Field label="Bio">
            <textarea rows={3} value={kit.bio} onChange={(e) => update({ bio: e.target.value })} placeholder="A short paragraph about you and your audience…" className="input-base resize-none text-sm" />
          </Field>
          <Field label="Contact Email">
            <input type="email" value={kit.email} onChange={(e) => update({ email: e.target.value })} placeholder="gina@example.com" className="input-base" />
          </Field>
          <Field label="Profile Photo URL" hint="Paste a direct image URL, or use your Instagram profile pic URL above">
            <input value={kit.profileImageUrl || ""} onChange={(e) => update({ profileImageUrl: e.target.value })} placeholder="https://…" className="input-base text-sm" />
          </Field>
        </Section>

        {/* TikTok */}
        <Section title="TikTok">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Followers">
              <input value={kit.ttFollowers || ""} onChange={(e) => update({ ttFollowers: e.target.value })} placeholder="e.g. 45,000" className="input-base" />
            </Field>
            <Field label="Average Video Views">
              <input value={kit.ttAvgViews || ""} onChange={(e) => update({ ttAvgViews: e.target.value })} placeholder="e.g. 12,000" className="input-base" />
            </Field>
          </div>
        </Section>

        {/* Audience */}
        <Section title="Audience">
          <div className="grid grid-cols-3 gap-4">
            <Field label="Age Range">
              <input value={kit.audienceAge || ""} onChange={(e) => update({ audienceAge: e.target.value })} placeholder="e.g. 25–34" className="input-base" />
            </Field>
            <Field label="Gender Split">
              <input value={kit.audienceGender || ""} onChange={(e) => update({ audienceGender: e.target.value })} placeholder="e.g. 78% Female" className="input-base" />
            </Field>
            <Field label="Top Location">
              <input value={kit.audienceTopLocation || ""} onChange={(e) => update({ audienceTopLocation: e.target.value })} placeholder="e.g. United Kingdom" className="input-base" />
            </Field>
          </div>
        </Section>

        {/* Rates */}
        <Section title="Rates">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-navy-400">Add a row for each content type you offer.</p>
            <button
              onClick={() => update({ rates: [...kit.rates, { label: "", price: "" }] })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-coral-600 hover:text-coral-700"
            >
              <Plus size={12} /> Add row
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex gap-3 mb-1">
              <p className="flex-1 text-[10px] font-bold uppercase tracking-widest text-navy-400">Content Type</p>
              <p className="w-28 text-[10px] font-bold uppercase tracking-widest text-navy-400">Price</p>
              <div className="w-8" />
            </div>
            {kit.rates.map((_, idx) => rateRow(idx))}
          </div>
        </Section>

        {/* Past brands */}
        <Section title="Past Brand Work">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-navy-400">Brands you've worked with.</p>
            <button
              onClick={() => update({ pastBrands: [...kit.pastBrands, { name: "" }] })}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-coral-600 hover:text-coral-700"
            >
              <Plus size={12} /> Add brand
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {kit.pastBrands.map((b, idx) => (
              <div key={idx} className="flex items-center gap-1 bg-cream-100 border border-cream-200 rounded-lg pl-3 pr-1.5 py-1.5">
                <input
                  value={b.name}
                  onChange={(e) => {
                    const pastBrands = [...kit.pastBrands];
                    pastBrands[idx] = { name: e.target.value };
                    update({ pastBrands });
                  }}
                  placeholder="Brand name"
                  className="bg-transparent text-sm font-medium text-navy-700 outline-none w-28"
                />
                <button onClick={() => update({ pastBrands: kit.pastBrands.filter((_, i) => i !== idx) })}>
                  <Trash2 size={11} className="text-navy-400 hover:text-red-500" />
                </button>
              </div>
            ))}
            {kit.pastBrands.length === 0 && (
              <p className="text-sm text-navy-400">None added yet.</p>
            )}
          </div>
        </Section>
      </div>

      {/* Share section */}
      <div className="mt-10 bg-white border border-cream-200 rounded-2xl p-7 shadow-sm">
        <h3 className="font-serif text-lg font-bold text-navy-900 mb-1">Share your Media Kit</h3>
        <p className="text-sm text-navy-500 mb-5">
          Generates a public link with a snapshot of your current kit. Safe to share with any brand.
        </p>

        {sqlError && (
          <div className="mb-4 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
            <p className="text-xs font-semibold text-amber-700 mb-2">One-time Supabase setup needed:</p>
            <pre className="text-xs text-amber-800 whitespace-pre-wrap font-mono">{sqlError}</pre>
          </div>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={generateLink}
            disabled={generating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : <Link2 size={14} />}
            {generating ? "Generating…" : shareUrl ? "Generate New Link" : "Generate Shareable Link"}
          </button>

          {shareUrl && (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex-1 min-w-0 px-3 py-2.5 bg-cream-50 border border-cream-200 rounded-xl">
                <p className="text-xs font-mono text-navy-600 truncate">{shareUrl}</p>
              </div>
              <button
                onClick={copyLink}
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 bg-navy-800 hover:bg-navy-900 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                {copied ? <CheckCircle size={12} /> : <Copy size={12} />}
                {copied ? "Copied!" : "Copy"}
              </button>
              <a
                href={shareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 p-2.5 bg-white border border-cream-200 hover:border-navy-200 rounded-xl transition-colors"
                title="Open"
              >
                <ExternalLink size={13} className="text-navy-400" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-cream-100">
        <p className="text-sm font-semibold text-navy-800">{title}</p>
      </div>
      <div className="px-6 py-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-navy-400 mt-1">{hint}</p>}
    </div>
  );
}
