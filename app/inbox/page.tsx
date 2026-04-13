"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { RefreshCw, Loader2, MailOpen, WifiOff, Sparkles, TrendingUp, Check } from "lucide-react";
import {
  getMicrosoftUser,
  getInboxMessages,
  getMessageDetail,
  markMessageAsRead,
} from "@/lib/graphClient";
import type { InboxMessage, MessageDetail } from "@/lib/graphClient";
import {
  getGoogleUser,
  getGmailMessages,
  getGmailMessageDetail,
  markGmailAsRead,
} from "@/lib/googleClient";
import { useDb } from "@/lib/useDb";
import { useUser } from "@clerk/nextjs";
import { dbGetEmailLog, dbGetDeals, dbUpsertDeal } from "@/lib/db";
import type { Deal } from "@/lib/types";
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
  const getDb = useDb();
  const { user } = useUser();
  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [selected, setSelected] = useState<MessageDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [msUser] = useState(() => getMicrosoftUser());
  const [gmailUser] = useState(() => getGoogleUser());
  const connectedUser = msUser || gmailUser;
  const [classifying, setClassifying] = useState(false);
  const [classification, setClassification] = useState<{ positive: boolean; confidence: number; reason: string } | null>(null);
  const [pipelineAdded, setPipelineAdded] = useState<string | null>(null); // deal id just added

  // Build set of addresses we've emailed — used to filter replies
  const [contactedAddresses, setContactedAddresses] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const db = await getDb();
      const log = await dbGetEmailLog(db);
      setContactedAddresses(new Set(log.map((r) => r.contactEmail.toLowerCase())));
    })();
  }, [getDb]);

  const visibleMessages = useMemo(() => {
    if (showAll) return messages;
    return messages.filter((m) =>
      contactedAddresses.has(m.from.emailAddress.address.toLowerCase())
    );
  }, [messages, showAll, contactedAddresses]);

  const fetchMessages = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const msgs = msUser ? await getInboxMessages() : await getGmailMessages();
      setMessages(msgs);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load inbox.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [msUser]);

  useEffect(() => {
    if (connectedUser) fetchMessages();
    else setLoading(false);
  }, [connectedUser, fetchMessages]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    if (!connectedUser) return;
    const interval = setInterval(() => fetchMessages(true), 60000);
    return () => clearInterval(interval);
  }, [connectedUser, fetchMessages]);

  const handleSelect = async (msg: InboxMessage) => {
    setLoadingDetail(true);
    setSelected(null);
    setClassification(null);
    setPipelineAdded(null);
    try {
      const detail = msUser
        ? await getMessageDetail(msg.id)
        : await getGmailMessageDetail(msg.id);
      setSelected(detail);
      if (!msg.isRead) {
        msUser ? markMessageAsRead(msg.id) : markGmailAsRead(msg.id);
        setMessages((prev) =>
          prev.map((m) => (m.id === msg.id ? { ...m, isRead: true } : m))
        );
      }
      // Only classify replies from contacts we've emailed
      if (contactedAddresses.has(msg.from.emailAddress.address.toLowerCase())) {
        setClassifying(true);
        fetch("/api/classify-reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subject: detail.subject, body: detail.body.content?.slice(0, 1000) }),
        })
          .then((r) => r.json())
          .then((data) => setClassification(data))
          .catch(() => {})
          .finally(() => setClassifying(false));
      }
    } catch {
      // silently fail on detail load
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleAddToPipeline = async (msg: InboxMessage) => {
    const db = await getDb();
    const emailLog = await dbGetEmailLog(db);
    const logEntry = emailLog.find(r => r.contactEmail === msg.from.emailAddress.address.toLowerCase());
    const existingDeals = await dbGetDeals(db);
    const alreadyExists = existingDeals.some(d => d.contactEmail === msg.from.emailAddress.address.toLowerCase());
    if (alreadyExists) {
      setPipelineAdded("exists");
      return;
    }
    const now = new Date().toISOString();
    const deal: Deal = {
      id: crypto.randomUUID(),
      contactEmail: msg.from.emailAddress.address.toLowerCase(),
      contactName: msg.from.emailAddress.name || msg.from.emailAddress.address,
      company: msg.from.emailAddress.name || "",
      status: "replied",
      notes: logEntry ? `Re: ${logEntry.subject}` : "",
      createdAt: now,
      updatedAt: now,
    };
    await dbUpsertDeal(db, deal, user?.id);
    setPipelineAdded(deal.id);
  };

  const unreadCount = visibleMessages.filter((m) => !m.isRead).length;

  if (!connectedUser) {
    return (
      <div className="p-10 max-w-lg mx-auto mt-10 text-center">
        <WifiOff size={32} className="text-cream-200 mx-auto mb-4" />
        <h2 className="font-serif text-2xl font-bold text-navy-900 mb-2">No email connected</h2>
        <p className="text-navy-400 text-sm mb-6">
          Connect your Gmail or Outlook account to view replies from brands.
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
        <div className="px-5 py-4 border-b border-cream-200 bg-white flex-shrink-0">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2">
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
          {/* Filter toggle */}
          <div className="flex gap-1 p-0.5 bg-cream-100 rounded-lg">
            <button
              onClick={() => setShowAll(false)}
              className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-all ${
                !showAll
                  ? "bg-white text-navy-800 shadow-sm"
                  : "text-navy-400 hover:text-navy-600"
              }`}
            >
              Replies
            </button>
            <button
              onClick={() => setShowAll(true)}
              className={`flex-1 text-[11px] font-semibold py-1.5 rounded-md transition-all ${
                showAll
                  ? "bg-white text-navy-800 shadow-sm"
                  : "text-navy-400 hover:text-navy-600"
              }`}
            >
              All Mail
            </button>
          </div>
        </div>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={22} className="text-navy-300 animate-spin" />
            </div>
          ) : error ? (
            <div className="p-6 text-sm text-red-500 text-center">{error}</div>
          ) : visibleMessages.length === 0 ? (
            <div className="p-8 text-sm text-navy-400 text-center">
              {showAll
                ? "No messages in inbox."
                : "No replies from contacted leads yet."}
            </div>
          ) : (
            visibleMessages.map((msg) => {
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

            {/* AI classification banner */}
            {classifying && (
              <div className="mb-5 flex items-center gap-2.5 px-4 py-3 bg-cream-50 border border-cream-200 rounded-xl text-xs text-navy-400">
                <Loader2 size={13} className="animate-spin text-coral-400 flex-shrink-0" />
                Analysing reply sentiment…
              </div>
            )}
            {!classifying && classification?.positive && (
              <div className="mb-5 flex items-center justify-between gap-4 px-4 py-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Sparkles size={15} className="text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-800">Positive reply detected</p>
                    <p className="text-xs text-emerald-600 mt-0.5">{classification.reason}</p>
                  </div>
                </div>
                {pipelineAdded === "exists" ? (
                  <span className="flex-shrink-0 text-xs text-emerald-600 font-medium">Already in pipeline</span>
                ) : pipelineAdded ? (
                  <span className="flex-shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg">
                    <Check size={12} /> Added to pipeline
                  </span>
                ) : (
                  <button
                    onClick={() => {
                      const msgObj = messages.find(m => m.id === selected.id);
                      if (msgObj) handleAddToPipeline(msgObj);
                    }}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition-colors"
                  >
                    <TrendingUp size={12} /> Add to Pipeline
                  </button>
                )}
              </div>
            )}

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
