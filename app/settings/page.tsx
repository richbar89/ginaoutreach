"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle,
  LogIn,
  LogOut,
  ChevronDown,
  ChevronUp,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  FileText,
  X,
  Check,
} from "lucide-react";
import {
  getGoogleUser,
  setGmailCredentials,
  clearGmailCredentials,
} from "@/lib/googleClient";
import { useDb } from "@/lib/useDb";
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
  const [gUser, setGUser] = useState<ConnectedUser>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState<"google" | null>(null);
  const [gmailForm, setGmailForm] = useState({ email: "", password: "" });
  const [gmailError, setGmailError] = useState("");
  const [showGmailInstructions, setShowGmailInstructions] = useState(false);
  const [signature, setSignature] = useState("");
  const [sigSaved, setSigSaved] = useState(false);
  const [brands, setBrands] = useState<Brand[]>(Array.from({ length: 10 }, () => ({ name: "", runningAds: false })));
  const [brandsSaved, setBrandsSaved] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | "new" | null>(null);

  useEffect(() => {
    setGUser(getGoogleUser());
    (async () => {
      const db = await getDb();
      const sig = await dbGetSignature(db);
      setSignature(sig);
      const storedBrands = await dbGetBrands(db);
      setBrands(Array.from({ length: 10 }, (_, i) => storedBrands[i] ?? { name: "", runningAds: false }));
      const storedTemplates = await dbGetTemplates(db);
      setTemplates(storedTemplates);
      setLoading(false);
    })();
  }, [getDb]);

  const handleSaveSignature = async () => {
    const db = await getDb();
    await dbSaveSignature(db, signature);
    setSigSaved(true);
    setTimeout(() => setSigSaved(false), 2500);
  };

  const handleSaveBrands = async () => {
    const db = await getDb();
    await dbSaveBrands(db, brands.filter(b => b.name.trim()));
    setBrandsSaved(true);
    setTimeout(() => setBrandsSaved(false), 2500);
  };

  const updateBrand = (i: number, patch: Partial<Brand>) => {
    setBrands(prev => prev.map((b, idx) => idx === i ? { ...b, ...patch } : b));
  };

  const handleSaveTemplate = async (t: EmailTemplate) => {
    const db = await getDb();
    await dbUpsertTemplate(db, t);
    setTemplates(await dbGetTemplates(db));
    setEditingTemplate(null);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    const db = await getDb();
    await dbDeleteTemplate(db, id);
    setTemplates(await dbGetTemplates(db));
  };

  const handleConnectGoogle = async () => {
    setGmailError("");
    setSigning("google");
    try {
      const res = await fetch("/api/email/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmailEmail: gmailForm.email.trim(), appPassword: gmailForm.password.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed.");
      setGmailCredentials(gmailForm.email.trim(), gmailForm.password.trim());
      setGUser({ email: gmailForm.email.trim(), name: gmailForm.email.trim() });
      setGmailForm({ email: "", password: "" });
    } catch (e: unknown) {
      setGmailError(e instanceof Error ? e.message : "Connection failed.");
    } finally {
      setSigning(null);
    }
  };

  const handleDisconnectGoogle = () => {
    clearGmailCredentials();
    setGUser(null);
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
          <svg width="20" height="20" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          <span className="text-sm font-semibold text-navy-800">Gmail</span>
          <span className="text-xs text-navy-400">— @gmail.com addresses</span>
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
                <p className="text-xs text-navy-400 mt-0.5">Sending via Gmail SMTP</p>
              </div>
              <button
                onClick={handleDisconnectGoogle}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-navy-500 hover:text-red-600 border border-cream-200 hover:border-red-200 bg-white rounded-xl transition-all"
              >
                <LogOut size={12} />
                Disconnect
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800 leading-relaxed space-y-2">
                <p><strong>Use a dedicated Gmail account for outreach — not your main one.</strong></p>
                <p>High-volume cold email can trigger spam filters. If your account gets flagged, it affects <em>every</em> email you send — to clients, collaborators, everyone. A dedicated outreach account (e.g. <span className="font-mono bg-amber-100 px-1 rounded">yourname.outreach@gmail.com</span>) takes 2 minutes to create and completely separates the risk. Think of it as a business phone vs. your personal number.</p>
                <p>It also keeps things tidy — replies from brands land in one place, separate from your personal inbox.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-400 mb-1.5 uppercase tracking-widest">Gmail Address</label>
                <input
                  type="email"
                  value={gmailForm.email}
                  onChange={e => setGmailForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="yourname.outreach@gmail.com"
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-navy-400 mb-1.5 uppercase tracking-widest">App Password</label>
                <input
                  type="password"
                  value={gmailForm.password}
                  onChange={e => setGmailForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="xxxx xxxx xxxx xxxx"
                  className="input-base font-mono tracking-widest"
                />
                <p className="mt-1.5 text-xs text-navy-400">
                  Not your regular Gmail password — see the instructions below.
                </p>
              </div>
              {gmailError && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{gmailError}</p>
              )}
              <button
                onClick={handleConnectGoogle}
                disabled={signing === "google" || !gmailForm.email.trim() || !gmailForm.password.trim()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
              >
                {signing === "google" ? <Loader2 size={15} className="animate-spin" /> : <LogIn size={15} />}
                {signing === "google" ? "Verifying…" : "Connect Gmail"}
              </button>

              {/* Step-by-step instructions */}
              <button
                onClick={() => setShowGmailInstructions(v => !v)}
                className="w-full flex items-center justify-between text-xs font-semibold text-navy-500 hover:text-navy-800 transition-colors pt-1"
              >
                <span>How to get an App Password</span>
                {showGmailInstructions ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
              </button>

              {showGmailInstructions && (
                <ol className="space-y-3 text-xs text-navy-700 bg-cream-50 border border-cream-200 rounded-xl p-4">
                  {[
                    <>Create a dedicated Gmail account at <a href="https://accounts.google.com/signup" target="_blank" rel="noopener noreferrer" className="text-coral-500 hover:underline">gmail.com</a> — e.g. <span className="font-mono bg-cream-200 px-1 rounded">yourname.outreach@gmail.com</span>. <strong>Do not use your main Gmail.</strong> If this account gets flagged for spam, your outreach stops — but your personal email is completely unaffected.</>,
                    <>Sign into that account, go to <a href="https://myaccount.google.com/security" target="_blank" rel="noopener noreferrer" className="text-coral-500 hover:underline">myaccount.google.com/security</a>, and enable <strong>2-Step Verification</strong> (required for App Passwords).</>,
                    <>Once 2-Step Verification is on, go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-coral-500 hover:underline">myaccount.google.com/apppasswords</a>.</>,
                    <>In the <strong>App name</strong> field type <span className="font-mono bg-cream-200 px-1 rounded">Collabi</span> and click <strong>Create</strong>.</>,
                    <>Google shows a <strong>16-character password</strong>. Copy it (spaces are fine).</>,
                    <>Paste the Gmail address and that password above, then click <strong>Connect Gmail</strong>.</>,
                  ].map((step, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="flex-shrink-0 w-5 h-5 bg-coral-100 text-coral-600 text-[10px] font-bold rounded-full flex items-center justify-center mt-0.5">{i + 1}</span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              )}
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
