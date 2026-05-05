"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Loader2, MailOpen, Reply, Trash2, Send, CheckCircle } from "lucide-react";
import { getGmailCredentials } from "@/lib/googleClient";
import { EmailSetupWizard } from "@/components/EmailSetupWizard";

type InboxMsg = {
  uid: number;
  subject: string;
  from: { name: string; address: string };
  date: string;
  isRead: boolean;
};

type InboxMsgDetail = InboxMsg & { body: string };

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

function ImapPendingCard({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex items-center justify-center h-full p-8">
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-5">⏳</div>
        <h3 className="font-serif text-xl font-bold text-navy-900 mb-2">Almost there!</h3>
        <p className="text-sm text-navy-500 leading-relaxed mb-6">
          Gmail can take up to a minute to activate IMAP after you save the setting. Hit the button below to try loading your inbox.
        </p>
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-6 py-3 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-xl transition-colors"
        >
          <RefreshCw size={14} /> Try loading inbox
        </button>
      </div>
    </div>
  );
}

export default function InboxPage() {
  const [creds, setCreds] = useState<{ email: string; appPassword: string } | null>(null);
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

  const imapAttempted = useRef(false);

  const fetchInbox = useCallback(async (c: { email: string; appPassword: string }, isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/email/inbox", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmailEmail: c.email, appPassword: c.appPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to load inbox.");
      } else {
        setMessages(data.messages);
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const c = getGmailCredentials();
    setCreds(c);
    if (c) fetchInbox(c);
    else setLoading(false);
  }, [fetchInbox]);

  const handleInboxReady = useCallback(() => {
    imapAttempted.current = true;
    const c = getGmailCredentials();
    if (c) {
      setCreds(c);
      setError(null);
      fetchInbox(c);
    }
  }, [fetchInbox]);

  const openMessage = async (msg: InboxMsg) => {
    if (!creds) return;
    setReplying(false);
    setReplyBody("");
    setReplySent(false);
    setLoadingDetail(true);
    setSelected({ ...msg, body: "" });
    try {
      const res = await fetch("/api/email/inbox/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmailEmail: creds.email, appPassword: creds.appPassword, uid: msg.uid }),
      });
      const data = await res.json();
      if (res.ok) {
        setSelected(data);
        setMessages(prev => prev.map(m => m.uid === msg.uid ? { ...m, isRead: true } : m));
      }
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSendReply = async () => {
    if (!creds || !selected || !replyBody.trim()) return;
    setSendingReply(true);
    try {
      const subject = selected.subject.toLowerCase().startsWith("re:")
        ? selected.subject
        : `Re: ${selected.subject}`;
      const res = await fetch("/api/email/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gmailEmail: creds.email,
          appPassword: creds.appPassword,
          to: selected.from.address,
          subject,
          body: replyBody,
        }),
      });
      if (res.ok) {
        setReplySent(true);
        setReplying(false);
        setReplyBody("");
        setTimeout(() => setReplySent(false), 4000);
      }
    } finally {
      setSendingReply(false);
    }
  };

  const handleDelete = async () => {
    if (!creds || !selected) return;
    setDeleting(true);
    try {
      await fetch("/api/email/inbox/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gmailEmail: creds.email, appPassword: creds.appPassword, uid: selected.uid }),
      });
      setMessages(prev => prev.filter(m => m.uid !== selected.uid));
      setSelected(null);
      setReplying(false);
    } finally {
      setDeleting(false);
    }
  };

  // ── States ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-navy-400 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }

  if (!creds) {
    return <EmailSetupWizard onInboxReady={handleInboxReady} />;
  }

  if (error === "IMAP_DISABLED") {
    if (imapAttempted.current) {
      return <ImapPendingCard onRetry={() => creds && fetchInbox(creds, true)} />;
    }
    return (
      <EmailSetupWizard
        initialStep="imap-steps"
        initialEmail={creds.email}
        onInboxReady={handleInboxReady}
      />
    );
  }

  // ── Inbox layout ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-cream-200 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-px w-8 bg-coral-400" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">Inbox</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">{creds.email}</h1>
        </div>
        <button
          onClick={() => fetchInbox(creds, true)}
          disabled={refreshing}
          className="p-2.5 hover:bg-cream-100 rounded-xl transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw size={15} className={`text-navy-400 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-1 min-h-0">

        {/* Message list */}
        <div className="w-80 flex-shrink-0 border-r border-cream-200 overflow-y-auto">
          {error ? (
            <div className="p-6 text-center">
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <MailOpen size={28} className="text-cream-300 mb-3" />
              <p className="text-sm font-semibold text-navy-600 mb-1">No messages yet</p>
              <p className="text-xs text-navy-400">Replies from brands will appear here.</p>
            </div>
          ) : (
            <div>
              {messages.map(msg => (
                <button
                  key={msg.uid}
                  onClick={() => openMessage(msg)}
                  className={`w-full text-left px-5 py-4 border-b border-cream-100 hover:bg-cream-50 transition-colors ${
                    selected?.uid === msg.uid ? "bg-coral-50 border-l-2 border-l-coral-400" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-0.5">
                    <p className={`text-sm truncate ${msg.isRead ? "text-navy-600 font-normal" : "text-navy-900 font-bold"}`}>
                      {msg.from.name || msg.from.address}
                    </p>
                    <span className="text-[11px] text-navy-400 flex-shrink-0">{formatDate(msg.date)}</span>
                  </div>
                  <p className={`text-xs truncate ${msg.isRead ? "text-navy-400" : "text-navy-700 font-medium"}`}>
                    {msg.subject}
                  </p>
                  {!msg.isRead && (
                    <span className="mt-1.5 inline-block w-1.5 h-1.5 rounded-full bg-coral-500" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Message detail */}
        <div className="flex-1 flex flex-col min-h-0">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-navy-400">
              <MailOpen size={32} className="mb-3 text-cream-300" />
              <p className="text-sm">Select a message to read it</p>
            </div>
          ) : (
            <>
              {/* Scrollable message body */}
              <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-2xl">
                  {/* Subject + actions */}
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <h2 className="font-serif text-xl font-bold text-navy-900 leading-snug">
                      {selected.subject}
                    </h2>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => { setReplying(v => !v); setReplySent(false); }}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl border transition-all ${
                          replying
                            ? "bg-coral-500 text-white border-coral-500"
                            : "bg-white text-navy-600 border-cream-200 hover:border-coral-300 hover:text-coral-600"
                        }`}
                      >
                        <Reply size={13} />
                        Reply
                      </button>
                      <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="p-2 text-navy-400 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-xl transition-all disabled:opacity-40"
                        title="Move to trash"
                      >
                        {deleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                      </button>
                    </div>
                  </div>

                  {/* From / date */}
                  <div className="flex items-center gap-4 pb-4 mb-6 border-b border-cream-200">
                    <div className="w-9 h-9 rounded-full bg-coral-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-coral-600 text-sm font-bold">
                        {(selected.from.name || selected.from.address || "?")[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-navy-900">{selected.from.name || selected.from.address}</p>
                      {selected.from.name && <p className="text-xs text-navy-400">{selected.from.address}</p>}
                    </div>
                    <p className="ml-auto text-xs text-navy-400 flex-shrink-0">
                      {selected.date ? new Date(selected.date).toLocaleString() : ""}
                    </p>
                  </div>

                  {/* Body */}
                  {loadingDetail ? (
                    <div className="flex items-center gap-2 text-navy-400 text-sm">
                      <Loader2 size={14} className="animate-spin" /> Loading message…
                    </div>
                  ) : (
                    <pre className="text-sm text-navy-700 whitespace-pre-wrap font-sans leading-relaxed">
                      {selected.body || "(No text content)"}
                    </pre>
                  )}
                </div>
              </div>

              {/* Reply sent confirmation */}
              {replySent && (
                <div className="flex-shrink-0 px-8 py-3 bg-emerald-50 border-t border-emerald-100 flex items-center gap-2 text-sm text-emerald-700 font-medium">
                  <CheckCircle size={15} />
                  Reply sent to {selected.from.name || selected.from.address}
                </div>
              )}

              {/* Reply compose area */}
              {replying && (
                <div className="flex-shrink-0 border-t border-cream-200 bg-cream-50 p-5">
                  <p className="text-xs font-bold text-navy-400 uppercase tracking-widest mb-3">
                    Replying to {selected.from.name || selected.from.address}
                  </p>
                  <textarea
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    placeholder="Write your reply…"
                    rows={5}
                    autoFocus
                    className="w-full text-sm border border-cream-200 bg-white rounded-xl px-4 py-3 outline-none focus:border-coral-300 focus:ring-2 focus:ring-coral-100 resize-none leading-relaxed"
                  />
                  <div className="flex items-center gap-3 mt-3">
                    <button
                      onClick={handleSendReply}
                      disabled={sendingReply || !replyBody.trim()}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
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

              {/* Collapsed reply bar (when not replying) */}
              {!replying && !replySent && (
                <div className="flex-shrink-0 border-t border-cream-100 px-8 py-3">
                  <button
                    onClick={() => setReplying(true)}
                    className="inline-flex items-center gap-2 text-xs text-navy-400 hover:text-coral-500 transition-colors"
                  >
                    <Reply size={13} />
                    Click to reply
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
