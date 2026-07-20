"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  LogOut,
  Mail,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  FileText,
  X,
  Check,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";
import { getEmailAccount, disconnectEmail, connectEmailUrl } from "@/lib/emailClient";
import { useDb } from "@/lib/useDb";
import { useAuth } from "@clerk/nextjs";
import {
  dbGetSignature,
  dbSaveSignature,
  dbGetBrands,
  dbSaveBrands,
  dbGetTemplates,
  dbUpsertTemplate,
  dbDeleteTemplate,
} from "@/lib/db";
import type { Brand, EmailTemplate } from "@/lib/types";

const MERGE_TAGS = [
  { tag: "[FirstName]", desc: "Recipient's first name" },
  { tag: "[BusinessName]", desc: "Brand / company name" },
  { tag: "[Signature]", desc: "Your saved signature" },
];

function TemplateModal({ initial, onSave, onClose }: {
  initial?: EmailTemplate;
  onSave: (t: EmailTemplate) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    subject: initial?.subject || "",
    body: initial?.body || "",
  });

  const insertTag = (tag: string) => setForm(f => ({ ...f, body: f.body + tag }));

  const handleSave = () => {
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) return;
    onSave({
      id: initial?.id || crypto.randomUUID(),
      ...form,
      createdAt: initial?.createdAt || new Date().toISOString(),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-7 py-5 border-b border-cream-200">
          <h2 className="font-serif text-xl font-bold text-navy-900">{initial ? "Edit Template" : "New Template"}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-cream-100 rounded-lg transition-colors">
            <X size={16} className="text-navy-400" />
          </button>
        </div>
        <div className="px-7 py-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">Template Name</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Initial Pitch, Follow-up #1" className="input-base" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">Subject Line</label>
            <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Partnership opportunity — [BusinessName] × you" className="input-base" />
          </div>
          <div>
            <p className="text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">Insert Merge Tag</p>
            <div className="flex flex-wrap gap-2">
              {MERGE_TAGS.map(({ tag, desc }) => (
                <button key={tag} onClick={() => insertTag(tag)} title={desc} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-coral-50 hover:bg-coral-100 border border-coral-200 text-coral-700 text-xs font-semibold rounded-lg transition-colors">
                  {tag}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">Message Body</label>
            <textarea rows={10} value={form.body} onChange={e => setForm(f => ({ ...f, body: e.target.value }))} placeholder={`Hi [FirstName],\n\nI'd love to explore a partnership…\n\n[Signature]`} className="input-base resize-y font-mono leading-relaxed text-sm" />
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-cream-200 bg-cream-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy-500 hover:text-navy-800 transition-colors">Cancel</button>
          <button onClick={handleSave} disabled={!form.name.trim() || !form.subject.trim() || !form.body.trim()} className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50">
            <Check size={14} />
            {initial ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

type ConnectedUser = { name: string; email: string } | null;

export default function SettingsPage() {
  const getDb = useDb();
  const { userId } = useAuth();
  const [gUser, setGUser] = useState<ConnectedUser>(null);
  const [loading, setLoading] = useState(true);
  const [emailError, setEmailError] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);
  const [signature, setSignature] = useState("");
  const [sigSaved, setSigSaved] = useState(false);
  const [brands, setBrands] = useState<Brand[]>(Array.from({ length: 10 }, () => ({ name: "", runningAds: false })));
  const [brandsSaved, setBrandsSaved] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | "new" | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("email_error");
    if (err) setEmailError(err);
    getEmailAccount().then(acc => setGUser(acc ? { name: acc.email, email: acc.email } : null));
    (async () => {
      const db = await getDb();
      const sig = await dbGetSignature(db);
      setSignature(sig);
      const storedBrands = userId ? await dbGetBrands(db, userId) : [];
      setBrands(Array.from({ length: 10 }, (_, i) => storedBrands[i] ?? { name: "", runningAds: false }));
      const storedTemplates = await dbGetTemplates(db);
      setTemplates(storedTemplates);
      setLoading(false);
    })();
  }, [getDb]);

  const handleSaveSignature = async () => {
    const db = await getDb();
    await dbSaveSignature(db, signature, userId ?? undefined);
    setSigSaved(true);
    setTimeout(() => setSigSaved(false), 2500);
  };

  const handleSaveBrands = async () => {
    if (!userId) return;
    const db = await getDb();
    await dbSaveBrands(db, brands.filter(b => b.name.trim()), userId);
    setBrandsSaved(true);
    setTimeout(() => setBrandsSaved(false), 2500);
  };

  const updateBrand = (i: number, patch: Partial<Brand>) => {
    setBrands(prev => prev.map((b, idx) => idx === i ? { ...b, ...patch } : b));
  };

  const handleSaveTemplate = async (t: EmailTemplate) => {
    const db = await getDb();
    await dbUpsertTemplate(db, t, userId ?? undefined);
    setTemplates(await dbGetTemplates(db));
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    const db = await getDb();
    await dbDeleteTemplate(db, id);
    setTemplates(await dbGetTemplates(db));
  };

  const handleDisconnectEmail = async () => {
    setDisconnecting(true);
    try {
      await disconnectEmail();
      setGUser(null);
    } finally {
      setDisconnecting(false);
    }
  };

  return (
    <div className="p-10 max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-10 bg-coral-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">
            Settings
          </span>
        </div>
        <h1 className="font-serif text-4xl font-bold text-navy-900 leading-tight">
          Account
        </h1>
        <p className="mt-2 text-navy-500 text-base">
          Connect your email account to send outreach directly from your own address.
        </p>
      </div>

      {/* Gmail Connection Card */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm mb-6">
        <div className="px-7 py-5 border-b border-cream-100 flex items-center gap-3">
          <Mail size={18} className="text-coral-500" />
          <span className="text-sm font-semibold text-navy-800">Email account</span>
          <span className="text-xs text-navy-400">— Gmail, Outlook and more</span>
          {gUser && (
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-full">
              <CheckCircle size={11} />
              Connected
            </span>
          )}
        </div>
        <div className="px-7 py-6">
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-navy-400">
              <Loader2 size={14} className="animate-spin" />
              Checking connection…
            </div>
          ) : gUser ? (
            <div className="flex items-center justify-between p-4 bg-emerald-50 border border-emerald-100 rounded-xl">
              <div>
                <p className="text-sm font-semibold text-navy-900">{gUser.email}</p>
                <p className="text-xs text-navy-400 mt-0.5">Connected — sending and inbox enabled</p>
              </div>
              <button
                onClick={handleDisconnectEmail}
                disabled={disconnecting}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-navy-500 hover:text-red-600 border border-cream-200 hover:border-red-200 bg-white rounded-xl transition-all disabled:opacity-50"
              >
                {disconnecting ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Guided setup CTA */}
              <Link
                href="/inbox"
                className="flex items-start gap-4 p-5 bg-coral-50 border-2 border-coral-200 hover:border-coral-300 rounded-xl transition-all group"
              >
                <div className="w-9 h-9 bg-coral-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xl">👋</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-coral-800 mb-0.5">First time? Use our step-by-step guide</p>
                  <p className="text-xs text-coral-700 leading-relaxed">We&apos;ll walk you through setting up a dedicated outreach address and connecting it — takes about a minute.</p>
                </div>
                <ArrowRight size={15} className="text-coral-400 flex-shrink-0 mt-1 group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-cream-200" />
                <span className="text-xs text-navy-400">or connect right here</span>
                <div className="flex-1 h-px bg-cream-200" />
              </div>

              {emailError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{emailError}</p>
              )}

              <a
                href={connectEmailUrl("/settings")}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                <Mail size={15} />
                Connect email
              </a>
              <p className="text-xs text-navy-400">
                You&apos;ll sign in securely with your provider (Google, Microsoft and more) and come straight back — Collabi never sees your password.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Signature */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm mb-6">
        <div className="px-7 py-5 border-b border-cream-100">
          <p className="text-sm font-semibold text-navy-800">Email Signature</p>
          <p className="text-xs text-navy-400 mt-1">
            Saved once and inserted wherever you use the <span className="font-mono text-coral-600">[Signature]</span> merge tag in templates.
          </p>
        </div>
        <div className="px-7 py-6 space-y-4">
          <textarea
            rows={5}
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            placeholder={`Best,\nGina\n\nFood & Drinks Content Creator\ngina@example.com | @ginanutrition`}
            className="input-base resize-y text-sm font-mono leading-relaxed"
          />
          <button
            onClick={handleSaveSignature}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {sigSaved ? <CheckCircle size={14} /> : null}
            {sigSaved ? "Saved!" : "Save Signature"}
          </button>
        </div>
      </div>

      {/* Brand Monitor */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm mb-6">
        <div className="px-7 py-5 border-b border-cream-100">
          <p className="text-sm font-bold text-navy-800">Brand Monitor</p>
          <p className="text-xs text-navy-400 mt-1">
            Track up to 10 brands and flag whether they&apos;re running ads. These appear on your dashboard.
          </p>
        </div>
        <div className="px-7 py-6">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
            {brands.map((brand, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-navy-400 w-4 flex-shrink-0">{i + 1}</span>
                <input
                  type="text"
                  value={brand.name}
                  onChange={(e) => updateBrand(i, { name: e.target.value })}
                  placeholder={`Brand ${i + 1}`}
                  className="input-base flex-1 text-sm"
                />
                <button
                  onClick={() => updateBrand(i, { runningAds: !brand.runningAds })}
                  className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-[11px] font-bold border transition-all ${
                    brand.runningAds
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      : "bg-red-50 text-red-500 border-red-200 hover:bg-red-100"
                  }`}
                  title="Toggle ads status"
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${brand.runningAds ? "bg-emerald-500" : "bg-red-400"}`} />
                  {brand.runningAds ? "Ads on" : "No ads"}
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={handleSaveBrands}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            {brandsSaved ? <CheckCircle size={14} /> : null}
            {brandsSaved ? "Saved!" : "Save Brands"}
          </button>
        </div>
      </div>

      {/* Email Templates */}
      <div className="bg-white border border-cream-200 rounded-2xl overflow-hidden shadow-sm mb-6">
        <div className="px-7 py-5 border-b border-cream-100 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-navy-800">Email Templates</p>
            <p className="text-xs text-navy-400 mt-1">
              Use <span className="font-mono text-coral-600">[FirstName]</span>, <span className="font-mono text-coral-600">[BusinessName]</span> and <span className="font-mono text-coral-600">[Signature]</span> to personalise automatically.
            </p>
          </div>
          <button
            onClick={() => setEditingTemplate("new")}
            className="inline-flex items-center gap-2 px-4 py-2 bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold rounded-xl transition-colors flex-shrink-0"
          >
            <Plus size={13} /> New Template
          </button>
        </div>
        <div className="px-7 py-5">
          {templates.length === 0 ? (
            <div className="text-center py-8">
              <FileText size={28} className="text-cream-300 mx-auto mb-3" />
              <p className="text-sm font-semibold text-navy-600 mb-1">No templates yet</p>
              <p className="text-xs text-navy-400">Create your first template to speed up outreach.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {templates.map(t => (
                <div key={t.id} className="flex items-center gap-4 p-4 bg-cream-50 border border-cream-200 rounded-xl">
                  <FileText size={15} className="text-coral-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-navy-900 truncate">{t.name}</p>
                    <p className="text-xs text-navy-400 truncate">{t.subject}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button onClick={() => setEditingTemplate(t)} className="p-1.5 hover:bg-cream-200 rounded-lg transition-colors" title="Edit">
                      <Pencil size={13} className="text-navy-400" />
                    </button>
                    <button onClick={() => handleDeleteTemplate(t.id)} className="p-1.5 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={13} className="text-navy-400 hover:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingTemplate !== null && (
        <TemplateModal
          initial={editingTemplate === "new" ? undefined : editingTemplate}
          onSave={handleSaveTemplate}
          onClose={() => setEditingTemplate(null)}
        />
      )}
    </div>
  );
}
