"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";

type Announcement = { id: string; message: string; type: "info" | "warning" | "success" };

const TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  info:    { bg: "var(--surface)",   text: "var(--text)",       border: "var(--border)" },
  warning: { bg: "var(--surface-2)", text: "var(--accent)",     border: "var(--border)" },
  success: { bg: "var(--ink)",       text: "var(--bg)",         border: "var(--border)" },
};

export default function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/announcements")
      .then(r => r.json())
      .then(d => { if (d) setAnnouncement(d); })
      .catch(() => {});
  }, []);

  if (!announcement || dismissed === announcement.id) return null;

  const s = TYPE_STYLES[announcement.type] || TYPE_STYLES.info;

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold flex-shrink-0"
      style={{ background: s.bg, color: s.text, borderBottom: `1px solid ${s.border}` }}
    >
      <span className="flex-1">{announcement.message}</span>
      <button onClick={() => setDismissed(announcement.id)} className="opacity-60 hover:opacity-100 transition-opacity">
        <X size={14} />
      </button>
    </div>
  );
}
