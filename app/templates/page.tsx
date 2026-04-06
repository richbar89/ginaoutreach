"use client";

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2, FileText, X, Check } from "lucide-react";
import { useDb } from "@/lib/useDb";
import { dbGetTemplates, dbUpsertTemplate, dbDeleteTemplate } from "@/lib/db";
import type { EmailTemplate } from "@/lib/types";

const MERGE_TAGS = [
  { tag: "[FirstName]", desc: "Recipient's first name" },
  { tag: "[BusinessName]", desc: "Brand / company name" },
  { tag: "[Signature]", desc: "Your saved signature" },
];

function TemplateModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: EmailTemplate;
  onSave: (t: EmailTemplate) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    name: initial?.name || "",
    subject: initial?.subject || "",
    body: initial?.body || "",
  });

  const insertTag = (tag: string) => {
    setForm((f) => ({ ...f, body: f.body + tag }));
  };

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
          <h2 className="font-serif text-xl font-bold text-navy-900">
            {initial ? "Edit Template" : "New Template"}
          </h2>
          <button onClick={onClose} className="p-1.5 hover:bg-cream-100 rounded-lg transition-colors">
            <X size={16} className="text-navy-400" />
          </button>
        </div>

        <div className="px-7 py-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">
              Template Name
            </label>
            <input
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              placeholder="e.g. Initial Pitch, Follow-up #1"
              className="input-base"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">
              Subject Line
            </label>
            <input
              value={form.subject}
              onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
              placeholder="e.g. Partnership opportunity — [BusinessName] × Gina"
              className="input-base"
            />
          </div>

          {/* Merge tag chips */}
          <div>
            <p className="text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">
              Insert Merge Tag
            </p>
            <div className="flex flex-wrap gap-2">
              {MERGE_TAGS.map(({ tag, desc }) => (
                <button
                  key={tag}
                  onClick={() => insertTag(tag)}
                  title={desc}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-coral-50 hover:bg-coral-100 border border-coral-200 text-coral-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  {tag}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-navy-400 mt-2">
              Click a tag to insert it at the end of your message body.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-navy-400 mb-2 uppercase tracking-widest">
              Message Body
            </label>
            <textarea
              rows={12}
              value={form.body}
              onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
              placeholder={`Hi [FirstName],\n\nI'd love to explore a partnership between your brand and my food content…\n\n[Signature]`}
              className="input-base resize-y font-mono leading-relaxed text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-7 py-5 border-t border-cream-200 bg-cream-50 rounded-b-2xl">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-navy-500 hover:text-navy-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name.trim() || !form.subject.trim() || !form.body.trim()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors disabled:opacity-50"
          >
            <Check size={14} />
            {initial ? "Save Changes" : "Create Template"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function TemplatesPage() {
  const getDb = useDb();
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [editing, setEditing] = useState<EmailTemplate | "new" | null>(null);

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const data = await dbGetTemplates(db);
      setTemplates(data);
    })();
  }, [getDb]);

  const handleSave = async (t: EmailTemplate) => {
    const db = await getDb();
    await dbUpsertTemplate(db, t);
    const updated = await dbGetTemplates(db);
    setTemplates(updated);
    setEditing(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this template?")) return;
    const db = await getDb();
    await dbDeleteTemplate(db, id);
    const updated = await dbGetTemplates(db);
    setTemplates(updated);
  };

  return (
    <div className="p-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="h-px w-10 bg-coral-400" />
          <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">
            Templates
          </span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-serif text-4xl font-bold text-navy-900 leading-tight">
              Email Templates
            </h1>
            <p className="mt-2 text-navy-500 text-base max-w-md">
              Write once, use everywhere. Use <span className="font-mono text-coral-600 text-sm">[FirstName]</span>, <span className="font-mono text-coral-600 text-sm">[BusinessName]</span> and <span className="font-mono text-coral-600 text-sm">[Signature]</span> to personalise automatically.
            </p>
          </div>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-all hover:shadow-lg hover:shadow-coral-200 flex-shrink-0"
          >
            <Plus size={15} />
            New Template
          </button>
        </div>
      </div>

      {/* Merge tag reference */}
      <div className="mb-8 bg-white border border-cream-200 rounded-2xl p-6 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-navy-400 mb-4">Merge Tags Reference</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {MERGE_TAGS.map(({ tag, desc }) => (
            <div key={tag} className="flex items-center gap-3">
              <span className="font-mono text-sm font-semibold text-coral-600 bg-coral-50 border border-coral-100 px-2.5 py-1 rounded-lg">
                {tag}
              </span>
              <span className="text-xs text-navy-500">{desc}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-navy-400 mt-4">
          Set your signature once in <a href="/settings" className="text-coral-500 hover:underline font-medium">Settings</a> and it will be inserted wherever <span className="font-mono text-xs">[Signature]</span> appears.
        </p>
      </div>

      {/* Template list */}
      {templates.length === 0 ? (
        <div className="text-center py-20 bg-white border border-cream-200 rounded-2xl">
          <FileText size={36} className="text-cream-300 mx-auto mb-4" />
          <p className="font-serif text-xl font-bold text-navy-900 mb-2">No templates yet</p>
          <p className="text-navy-400 text-sm mb-6">Create your first template to speed up outreach.</p>
          <button
            onClick={() => setEditing("new")}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors"
          >
            <Plus size={14} /> Create Template
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {templates.map((t) => (
            <div
              key={t.id}
              className="bg-white border border-cream-200 hover:border-cream-300 rounded-2xl px-6 py-5 shadow-sm hover:shadow-md transition-all flex items-start gap-5"
            >
              <div className="w-10 h-10 bg-coral-50 border border-coral-100 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
                <FileText size={16} className="text-coral-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-navy-900 mb-0.5">{t.name}</p>
                <p className="text-sm text-navy-500 mb-2">{t.subject}</p>
                <p className="text-xs text-navy-400 leading-relaxed line-clamp-2">
                  {t.body.replace(/\[.*?\]/g, (m) => m)}
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => setEditing(t)}
                  className="p-2 hover:bg-cream-100 rounded-lg transition-colors"
                  title="Edit"
                >
                  <Pencil size={14} className="text-navy-400" />
                </button>
                <button
                  onClick={() => handleDelete(t.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete"
                >
                  <Trash2 size={14} className="text-navy-400 hover:text-red-500" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing !== null && (
        <TemplateModal
          initial={editing === "new" ? undefined : editing}
          onSave={handleSave}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}
