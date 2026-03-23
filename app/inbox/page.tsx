"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { RefreshCw, Loader2, MailOpen, WifiOff } from "lucide-react";
import {
  getMicrosoftUser,
  getInboxMessages,
  getMessageDetail,
  markMessageAsRead,
} from "@/lib/graphClient";
import type { InboxMessage, MessageDetail } from "@/lib/graphClient";
import InitialsAvatar from "@/components/InitialsAvatar";

function timeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default function InboxPage() {
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selected, setSelected] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [msUser] = useState(() => getMicrosoftUser());

  const fetchMessages = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const msgs = await getInboxMessages();
      setMessages(msgs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load inbox.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (msUser) fetchMessages();
    else setLoading(false);
  }, [msUser, fetchMessages]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!msUser) return;
    const interval = setInterval(() => fetchMessages(true), 60000);
    return () => clearInterval(interval);
  }, [msUser, fetchMessages]);

  const handleSelect = async (msg: InboxMessage) => {
    setLoadingDetail(true);
    setSelected(null);
    try {
      const detail = await getMessageDetail(msg.id);
      setSelected(detail);
      if (!msg.isRead) {
        markMessageAsRead(msg.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        );
      }
    } catch {
      // silently fail on detail load
    } finally {
      setLoadingDetail(false);
    }
  };

  const unreadCount = messages.filter((m) => !m.isRead).length;

  if (!msUser) {
    return (
      <div className="p-10 max-w-lg mx-auto mt-10 text-center">
        <WifiOff size={32} className="text-cream-200 mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-bold text-navy-900 mb-2">Not connected</h2>
        <p className="text-navy-400 text-sm mb-6">
          Connect your Microsoft account to view your inbox.
        </p>
        <Link
          href="/settings"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Go to Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="flex" style={{ height: "100%" }}>
      {/* ── Left panel: message list ── */}
      <div
        className="flex flex-col border-r border-cream-200 flex-shrink-0"
        style={{ width: 340, minHeight: 0 }}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-cream-200 bg-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-3 mb-0">
              <div className="h-px w-6 bg-coral-400" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-coral-500">
                Inbox
              </span>
            </div>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 bg-coral-500 text-white text-[10px] font-bold rounded-full leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          <button
            onClick={() => fetchMessages(true)}
            disabled={refreshing}
            title="Refresh"
            className="p-1.5 hover:bg-cream-100 rounded-lg transition-colors"
          >
            <RefreshCw
              size={13}
              className={`text-navy-400 ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="text-navy-300 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-500 text-center">{error}</div>
          ) : messages.length === 0 ? (
            <div className="p-8 text-sm text-navy-400 text-center">
              No messages yet.
            </div>
          ) : (
            messages.map((msg) => {
              const isActive = selected?.id === msg.id;
              return (
                <button
                  key={msg.id}
                  onClick={() => handleSelect(msg)}
                  className={`w-full text-left px-4 py-3.5 border-b border-cream-100 transition-colors relative ${
                    isActive
                      ? "bg-coral-50"
                      : msg.isRead
                      ? "bg-cream-50/60 hover:bg-cream-50"
                      : "bg-white hover:bg-cream-50"
                  }`}
                >
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-coral-400" />
                  )}
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <InitialsAvatar
                        name={msg.from.emailAddress.name || msg.from.emailAddress.address}
                        email={msg.from.emailAddress.address}
                        size="sm"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span
                          className={`text-sm truncate ${
                            !msg.isRead
                              ? "font-semibold text-navy-900"
                              : "font-medium text-navy-500"
                          }`}
                        >
                          {msg.from.emailAddress.name || msg.from.emailAddress.address}
                        </span>
                        <span className="text-[10px] text-navy-400 flex-shrink-0 ml-1">
                          {timeAgo(msg.receivedDateTime)}
                        </span>
                      </div>
                      <p
                        className={`text-xs truncate mb-0.5 ${
                          !msg.isRead ? "text-navy-800 font-medium" : "text-navy-500"
                        }`}
                      >
                        {msg.subject || "(no subject)"}
                      </p>
                      <p className="text-[11px] text-navy-400 truncate leading-relaxed">
                        {msg.bodyPreview}
                      </p>
                    </div>
                    {!msg.isRead && (
                      <div className="w-1.5 h-1.5 bg-coral-500 rounded-full flex-shrink-0 mt-1.5" />
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── Right panel: message detail ── */}
      <div className="flex-1 overflow-y-auto bg-white">
        {loadingDetail ? (
          <div className="flex items-center justify-center h-full min-h-[400px]">
            <Loader2 size={24} className="text-navy-300 animate-spin" />
          </div>
        ) : selected ? (
          <div className="p-8 max-w-3xl">
            {/* Message header */}
            <div className="mb-6 pb-6 border-b border-cream-200">
              <h2 className="font-serif text-2xl font-bold text-navy-900 mb-5 leading-snug">
                {selected.subject || "(no subject)"}
              </h2>
              <div className="flex items-center gap-3">
                <InitialsAvatar
                  name={selected.from.emailAddress.name || selected.from.emailAddress.address}
                  email={selected.from.emailAddress.address}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-navy-900">
                    {selected.from.emailAddress.name || selected.from.emailAddress.address}
                  </p>
                  <p className="text-xs text-navy-400">{selected.from.emailAddress.address}</p>
                </div>
                <span className="text-xs text-navy-400 flex-shrink-0">
                  {new Date(selected.receivedDateTime).toLocaleString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>

            {/* Body */}
            <pre className="text-sm text-navy-800 whitespace-pre-wrap font-sans leading-relaxed">
              {selected.body.content}
            </pre>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center">
            <MailOpen size={40} className="text-cream-200 mb-3" />
            <p className="text-sm font-medium text-navy-400">Select a message to read it</p>
            <p className="text-xs text-navy-300 mt-1">Refreshes automatically every minute</p>
          </div>
        )}
      </div>
    </div>
  );
}
