"use client";

import { useState, useEffect, useCallback } from "react";
import DOMPurify from "dompurify";
import { RefreshCw, Loader2, MailOpen, Reply, Trash2, Send, CheckCircle, CheckSquare, Square } from "lucide-react";
import { getEmailAccount, sendEmail, type ConnectedEmailAccount } from "@/lib/emailClient";
import { EmailSetupWizard } from "@/components/EmailSetupWizard";

/** Sanitise an email's HTML for inline display; links open in new tabs. */
function sanitizeEmailHtml(html: string): string {
  const clean = DOMPurify.sanitize(html, { USE_PROFILES: { html: true } });
  return clean.replace(/<a\s/gi, '<a target="_blank" rel="noopener noreferrer" ');
}

type InboxMsg = {
  id: string;
  subject: string;
  from: { name: string; address: string };
  date: string;
  isRead: boolean;
  snippet?: string;
};

type InboxMsgDetail = InboxMsg & { body: string; bodyHtml?: string };

const AVATAR_TINTS = [
  { bg: "#FDE7D9", fg: "#B03F14" },
  { bg: "#DCE8FF", fg: "#3A6BC4" },
  { bg: "#DCF0EE", fg: "#2A8F80" },
  { bg: "#F0DCF0", fg: "#8A3AC4" },
  { bg: "#E4F0DC", fg: "#4A8A30" },
  { bg: "#FFE8F0", fg: "#C43A6B" },
];

function senderTint(key: string) {
  let h = 0;
  for (const c of key) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_TINTS[h % AVATAR_TINTS.length];
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 24 * 60 * 60 * 1000 && d.getDate() === now.getDate()) {
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }
  if (diff < 7 * 24 * 60 * 60 * 1000) {
    return d.toLocaleDateString([], { weekday: "short" });
  }
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

function SenderAvatar({ name, address, size = 34 }: { name: string; address: string; size?: number }) {
  const tint = senderTint(address || name);
  const letter = (name || address || "?")[0].toUpperCase();
  return (
    <div
      className="rounded-full flex items-center justify-center flex-shrink-0"
      style={{ width: size, height: size, background: tint.bg }}
    >
      <span style={{ color: tint.fg, fontSize: size * 0.4, fontWeight: 700 }}>{letter}</span>
    </div>
  );
}

export default function InboxPage() {
  const [account, setAccount] = useState<ConnectedEmailAccount | null>(null);
  const [messages, setMessages] = useState<InboxMsg[]>([]);
  const [selected, setSelected] = useState<InboxMsgDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reply state
  const [replying, setReplying] = useState(false);
  const [replyBody, setReplyBody] = useState("");
  const [sendingReply, setSendingReply] = useState(false);
  const [replySent, setReplySent] = useState(false);

  // Delete state
  const [deleting, setDeleting] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchInbox = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/email/inbox");
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to load inbox.");
      else setMessages(data.messages);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    getEmailAccount().then(acc => {
      if (acc) {
        setAccount(acc);
        fetchInbox();
      } else {
        setLoading(false);
      }
    });
  }, [fetchInbox]);

  const openMessage = async (msg: InboxMsg) => {
    setReplying(false);
    setReplyBody("");
    setReplySent(false);
    setLoadingDetail(true);
    setSelected({ ...msg, body: "" });
    try {
      const res = await fetch("/api/email/inbox/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: msg.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelected(data);
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, isRead: true } : m));
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSendReply = async () => {
    if (!selected || !replyBody.trim()) return;
    setSendingReply(true);
    try {
      const subject = selected.subject.toLowerCase().startsWith("re:")
        ? selected.subject
        : `Re: ${selected.subject}`;
      await sendEmail({
        to: selected.from.address,
        subject,
        body: replyBody,
        replyToMessageId: selected.id,
      });
      setReplySent(true);
      setReplying(false);
      setReplyBody("");
      setTimeout(() => setReplySent(false), 4000);
    } catch {
      // keep the compose box open so the reply isn't lost
    } finally {
      setSendingReply(false);
    }
  };

  const deleteIds = async (ids: string[]) => {
    if (ids.length === 0) return;
    await fetch("/api/email/inbox/delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    });
    setMessages(prev => prev.filter(m => !ids.includes(m.id)));
    if (selected && ids.includes(selected.id)) { setSelected(null); setReplying(false); }
  };

  const handleDelete = async () => {
    if (!selected) return;
    setDeleting(true);
    try { await deleteIds([selected.id]); }
    finally { setDeleting(false); }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    setBulkDeleting(true);
    try {
      await deleteIds(Array.from(selectedIds));
      setSelectedIds(new Set());
    } finally {
      setBulkDeleting(false);
    }
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allSelected = messages.length > 0 && selectedIds.size === messages.length;
  const toggleSelectAll = () =>
    allSelected ? setSelectedIds(new Set()) : setSelectedIds(new Set(messages.map(m => m.id)));

  const unreadCount = messages.filter(m => !m.isRead).length;

  // ── States ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-navy-400 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }
  if (!account) return <EmailSetupWizard returnTo="/inbox" />;

  const hasSelection = selectedIds.size > 0;

  // ── Inbox layout ─────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col gap-4 p-6 pt-5">

      {/* Header on canvas */}
      <div className="flex items-end justify-between flex-shrink-0">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-navy-300 mb-1.5">
            {account.email}
          </p>
          <div className="flex items-baseline gap-3">
            <h1 className="text-[28px] font-bold tracking-[-0.03em] text-navy-900 leading-none">Inbox</h1>
            {unreadCount > 0 && (
              <span className="text-xs font-semibold text-coral-600 bg-coral-50 px-2.5 py-0.5 rounded-full">
                {unreadCount} unread
              </span>
            )}
          </div>
        </div>
        <button
          onClick={() => fetchInbox(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-black/[0.08] rounded-full text-[13px] font-semibold text-navy-600 hover:text-navy-900 hover:border-black/[0.14] transition-all duration-200 disabled:opacity-40"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {/* Mail surface */}
      <div className="card flex-1 min-h-0 flex overflow-hidden">

        {/* Message list */}
        <div className="w-[340px] flex-shrink-0 border-r border-black/[0.05] flex flex-col min-h-0 bg-[#FBFBFD]">

          {/* Bulk action bar */}
          {messages.length > 0 && (
            <div className="flex items-center gap-3 px-4 py-2.5 border-b border-black/[0.04] flex-shrink-0">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-xs text-navy-500 hover:text-navy-800 transition-colors"
                title={allSelected ? "Deselect all" : "Select all"}
              >
                {allSelected
                  ? <CheckSquare size={14} className="text-coral-500" />
                  : <Square size={14} className="text-navy-300" />}
                <span className="font-medium">{allSelected ? "Deselect all" : "Select all"}</span>
              </button>

              {hasSelection && (
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleting}
                  className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-full transition-colors disabled:opacity-50"
                >
                  {bulkDeleting
                    ? <Loader2 size={12} className="animate-spin" />
                    : <Trash2 size={12} />}
                  Delete {selectedIds.size}
                </button>
              )}
            </div>
          )}

          {/* Message rows */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {error ? (
              <div className="p-6 text-center">
                <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center px-6">
                <MailOpen size={26} className="text-navy-200 mb-3" />
                <p className="text-sm font-semibold text-navy-700 mb-1">No messages yet</p>
                <p className="text-xs text-navy-400">Replies from brands will appear here.</p>
              </div>
            ) : (
              messages.map(msg => {
                const isSelected = selectedIds.has(msg.id);
                const isOpen = selected?.id === msg.id;
                return (
                  <div
                    key={msg.id}
                    className={`group relative flex items-start gap-3 pl-4 pr-4 py-3 border-b border-black/[0.04] cursor-pointer transition-colors duration-150 ${
                      isOpen ? "bg-white" : isSelected ? "bg-coral-50/40" : "hover:bg-white/70"
                    }`}
                    onClick={() => openMessage(msg)}
                  >
                    {isOpen && <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full bg-coral-500" />}

                    {/* Avatar doubles as select checkbox on hover */}
                    <div className="relative flex-shrink-0 mt-0.5" onClick={e => toggleSelect(msg.id, e)}>
                      <div className={`transition-opacity duration-150 ${isSelected ? "opacity-0" : "group-hover:opacity-0"}`}>
                        <SenderAvatar name={msg.from.name} address={msg.from.address} />
                      </div>
                      <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-150 ${isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                        {isSelected
                          ? <CheckSquare size={18} className="text-coral-500" />
                          : <Square size={18} className="text-navy-300" />}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className={`text-[13px] truncate ${msg.isRead ? "text-navy-600 font-medium" : "text-navy-900 font-semibold"}`}>
                          {msg.from.name || msg.from.address}
                        </p>
                        <span className="text-[11px] text-navy-400 flex-shrink-0">{formatDate(msg.date)}</span>
                      </div>
                      <p className={`text-[12.5px] truncate mt-0.5 ${msg.isRead ? "text-navy-500" : "text-navy-800 font-medium"}`}>
                        {msg.subject}
                      </p>
                      {msg.snippet && (
                        <p className="text-[11.5px] text-navy-400 truncate mt-0.5">{msg.snippet}</p>
                      )}
                    </div>

                    {!msg.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-coral-500 flex-shrink-0 mt-2" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Message detail */}
        <div className="flex-1 flex flex-col min-h-0 bg-white">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-navy-400">
              <MailOpen size={30} className="mb-3 text-navy-200" />
              <p className="text-sm font-medium text-navy-500">Select a message to read it</p>
            </div>
          ) : (
            <>
              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto scrollbar-thin px-10 py-8">
                <div className="max-w-[640px]">
                  {/* Subject + actions */}
                  <div className="flex items-start justify-between gap-4 mb-5">
                    <h2 className="text-[22px] font-bold tracking-[-0.02em] text-navy-900 leading-snug">{selected.subject}</h2>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => { setReplying(v => !v); setReplySent(false); }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-full border transition-all duration-200 ${
                          replying
                            ? "bg-coral-500 text-white border-coral-500"
                            : "bg-white text-navy-600 border-black/[0.08] hover:border-coral-300 hover:text-coral-600"
                        }`}
                      >
                        <Reply size={13} /> Reply
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="p-2 text-navy-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all duration-200 disabled:opacity-40"
                        title="Move to trash"
                      >
                        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* From / date */}
                  <div className="flex items-center gap-3 pb-5 mb-6 border-b border-black/[0.05]">
                    <SenderAvatar name={selected.from.name} address={selected.from.address} size={38} />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-900">{selected.from.name || selected.from.address}</p>
                      {selected.from.name && <p className="text-xs text-navy-400 mt-0.5">{selected.from.address}</p>}
                    </div>
                    <p className="ml-auto text-xs text-navy-400 flex-shrink-0">
                      {selected.date ? new Date(selected.date).toLocaleString([], { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                  </div>

                  {/* Body — render real (sanitised) email HTML; plain text as fallback */}
                  {loadingDetail ? (
                    <div className="flex items-center gap-2 text-navy-400 text-sm">
                      <Loader2 size={14} className="animate-spin" /> Loading message…
                    </div>
                  ) : selected.bodyHtml ? (
                    <div
                      className="email-body"
                      dangerouslySetInnerHTML={{ __html: sanitizeEmailHtml(selected.bodyHtml) }}
                    />
                  ) : (
                    <pre className="text-[15px] text-navy-800 whitespace-pre-wrap font-sans leading-[1.75]">
                      {selected.body || "(No text content)"}
                    </pre>
                  )}
                </div>
              </div>

              {/* Reply sent confirmation */}
              {replySent && (
                <div className="flex-shrink-0 px-10 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2 text-sm text-emerald-700 font-medium">
                  <CheckCircle size={15} />
                  Reply sent to {selected.from.name || selected.from.address}
                </div>
              )}

              {/* Reply compose */}
              {replying && (
                <div className="flex-shrink-0 border-t border-black/[0.05] bg-[#FBFBFD] px-10 py-5">
                  <p className="text-[11px] font-semibold text-navy-400 uppercase tracking-[0.08em] mb-3">
                    Replying to {selected.from.name || selected.from.address}
                  </p>
                  <textarea
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    placeholder="Write your reply…"
                    rows={5}
                    autoFocus
                    className="input-base resize-none leading-relaxed !rounded-2xl"
                  />
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyBody.trim()}
                      className="btn-primary !px-5 !py-2.5 disabled:cursor-not-allowed"
                    >
                      {sendingReply ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                      {sendingReply ? "Sending…" : "Send Reply"}
                    </button>
                    <button
                      onClick={() => { setReplying(false); setReplyBody(""); }}
                      className="px-4 py-2.5 text-sm text-navy-500 hover:text-navy-800 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* Click-to-reply hint */}
              {!replying && !replySent && (
                <div className="flex-shrink-0 border-t border-black/[0.04] px-10 py-3">
                  <button
                    onClick={() => setReplying(true)}
                    className="inline-flex items-center gap-2 text-xs font-medium text-navy-400 hover:text-coral-500 transition-colors"
                  >
                    <Reply size={13} /> Click to reply
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
