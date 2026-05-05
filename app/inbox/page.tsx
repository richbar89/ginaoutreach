"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RefreshCw, Loader2, MailOpen } from "lucide-react";
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

  // ── State: loading ───────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full gap-2 text-navy-400 text-sm">
        <Loader2 size={16} className="animate-spin" /> Loading…
      </div>
    );
  }

  // ── State: no email connected → full wizard ──────────────────
  if (!creds) {
    return <EmailSetupWizard onInboxReady={handleInboxReady} />;
  }

  // ── State: IMAP not enabled ──────────────────────────────────
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

  // ── State: inbox ─────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-8 py-5 border-b border-cream-200 flex items-center justify-between flex-shrink-0">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-px w-8 bg-coral-400" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">Inbox</span>
          </div>
          <h1 className="font-serif text-2xl font-bold text-navy-900">
            {creds.email}
          </h1>
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
                  className={`w-full text-left px-5 py-4 border-b border-cream-100 hover:bg-cream-50 transition-colors ${selected?.uid === msg.uid ? "bg-coral-50 border-l-2 border-l-coral-400" : ""}`}
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
        <div className="flex-1 overflow-y-auto">
          {!selected ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-navy-400">
              <MailOpen size={32} className="mb-3 text-cream-300" />
              <p className="text-sm">Select a message to read it</p>
            </div>
          ) : (
            <div className="p-8 max-w-2xl">
              <h2 className="font-serif text-xl font-bold text-navy-900 mb-4">{selected.subject}</h2>
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
          )}
        </div>
      </div>
    </div>
  );
}
