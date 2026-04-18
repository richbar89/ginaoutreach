"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Send, Users, Mail, RefreshCw } from "lucide-react";
import { useUser } from "@clerk/nextjs";
import { useDb } from "@/lib/useDb";
import { dbGetEmailLog, dbGetDeals, dbGetBrands } from "@/lib/db";
import { getGoogleUser, isGoogleTokenExpired } from "@/lib/googleClient";
import { getMicrosoftUser } from "@/lib/graphClient";
import type { Deal, Brand } from "@/lib/types";

const DEAL_STAGE_LABELS: Record<string, string> = {
  pitched: "Pitched", replied: "Replied", negotiating: "Negotiating",
  contracted: "Contracted", delivered: "Delivered", paid: "Paid",
};

type FollowUp = { email: string; name: string; subject: string; daysAgo: number };

function StatusTag({ status }: { status: string }) {
  const hot = ["negotiating"];
  const warm = ["replied", "contracted", "delivered", "paid"];
  const label = DEAL_STAGE_LABELS[status] || status;

  const base: React.CSSProperties = {
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: "0.2em",
    textTransform: "uppercase",
    padding: "4px 10px",
    border: "1px solid",
    display: "inline-block",
    fontFamily: "'Inter', sans-serif",
  };

  if (hot.includes(status)) {
    return <span style={{ ...base, background: "var(--accent)", color: "var(--bg)", borderColor: "var(--accent)" }}>{label}</span>;
  }
  if (warm.includes(status)) {
    return <span style={{ ...base, background: "var(--ink)", color: "var(--bg)", borderColor: "var(--ink)" }}>{label}</span>;
  }
  return <span style={{ ...base, background: "transparent", color: "var(--text)", borderColor: "var(--text)" }}>{label}</span>;
}

function PipelineRow({ deal }: { deal: Deal }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 180px 160px",
        padding: "0 40px",
        height: 64,
        alignItems: "center",
        borderBottom: "1px solid var(--border-soft)",
        background: "var(--bg)",
        transition: "background 100ms",
        cursor: "default",
      }}
      onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface)"}
      onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--bg)"}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <div style={{
          width: 40, height: 40, background: "var(--ink)", color: "var(--bg)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 15, fontWeight: 900, flexShrink: 0, borderRadius: 2,
          fontFamily: "'Inter', sans-serif",
        }}>
          {(deal.company || deal.contactName)[0]?.toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{
            fontSize: 13, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.03em",
            color: "var(--text)", overflow: "hidden", textOverflow: "ellipsis",
            whiteSpace: "nowrap", margin: 0, fontFamily: "'Inter', sans-serif",
          }}>
            {deal.company || deal.contactName}
          </p>
          {deal.company && (
            <p style={{
              fontSize: 11, color: "var(--text-muted)", margin: "2px 0 0",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              fontFamily: "'Inter', sans-serif",
            }}>
              {deal.contactName}
            </p>
          )}
        </div>
      </div>
      <span style={{
        fontSize: 20, fontWeight: 900, letterSpacing: "-0.03em",
        fontVariantNumeric: "tabular-nums", color: "var(--text)",
        fontFamily: "'Inter', sans-serif",
      }}>
        {deal.value || "—"}
      </span>
      <StatusTag status={deal.status} />
    </div>
  );
}

export default function DashboardPage() {
  const { user } = useUser();
  const firstName = user?.firstName || user?.fullName?.split(" ")[0] || "there";
  const getDb = useDb();

  const [emailsSent, setEmailsSent] = useState(0);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [emailConnected, setEmailConnected] = useState<"gmail" | "microsoft" | "expired" | null>(null);

  useEffect(() => {
    const gUser = getGoogleUser();
    const mUser = getMicrosoftUser();
    if (gUser) setEmailConnected(isGoogleTokenExpired() ? "expired" : "gmail");
    else if (mUser) setEmailConnected("microsoft");
    else setEmailConnected(null);
  }, []);

  useEffect(() => {
    (async () => {
      const [db, contactsRes] = await Promise.all([getDb(), fetch("/api/contacts")]);
      const contactsList: { email: string; name: string; company?: string }[] =
        contactsRes.ok ? await contactsRes.json() : [];

      const log = await dbGetEmailLog(db);
      setEmailsSent(log.length);

      const latestPerContact = new Map<string, { sentAt: string; subject: string; name: string }>();
      for (const r of log) {
        const existing = latestPerContact.get(r.contactEmail);
        if (!existing || r.sentAt > existing.sentAt) {
          const contact = contactsList.find(c => c.email.toLowerCase() === r.contactEmail);
          latestPerContact.set(r.contactEmail, { sentAt: r.sentAt, subject: r.subject, name: contact?.name || r.contactEmail });
        }
      }
      const now = Date.now();
      const chaseUps: FollowUp[] = [];
      for (const [email, { sentAt, subject, name }] of latestPerContact.entries()) {
        const daysAgo = Math.floor((now - new Date(sentAt).getTime()) / 86400000);
        if (daysAgo >= 5) chaseUps.push({ email, name, subject, daysAgo });
      }
      chaseUps.sort((a, b) => b.daysAgo - a.daysAgo);
      setFollowUps(chaseUps);

      const dealsData = await dbGetDeals(db);
      setDeals(dealsData);

      const brandsData = await dbGetBrands(db);
      setBrands(brandsData);
    })();
  }, [getDb]);

  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long", day: "numeric", month: "long",
  }).toUpperCase();

  const activeDeals = deals.filter(d => d.status !== "paid");
  const emailReady = emailConnected === "gmail" || emailConnected === "microsoft";

  const STATS = [
    { label: "Emails Sent",     value: emailsSent },
    { label: "Active Deals",    value: activeDeals.length },
    { label: "Follow-ups Due",  value: followUps.length },
    { label: "Brands Tracked",  value: brands.length },
  ];

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── TOPBAR ── */}
      <div style={{
        height: 52,
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 40px",
        borderBottom: "1px solid var(--border)",
        background: "var(--bg)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {!emailReady ? (
            <>
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--accent)", fontFamily: "'Inter', sans-serif" }}>
                {emailConnected === "expired" ? "Gmail session expired" : "Email not connected"}
              </span>
              <Link
                href="/settings"
                style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text)", textDecoration: "none", padding: "4px 10px", border: "1px solid var(--border)", fontFamily: "'Inter', sans-serif" }}
              >
                {emailConnected === "expired" ? <><RefreshCw size={10} /> Reconnect</> : <><Mail size={10} /> Connect email</>}
              </Link>
            </>
          ) : (
            <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-dim)", fontFamily: "'Inter', sans-serif" }}>
              {today}
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Link href="/contacts" className="btn-ghost">
            <Users size={11} /> New Campaign
          </Link>
          <Link href="/send" className="btn-primary">
            <Send size={11} /> Quick Send
          </Link>
        </div>
      </div>

      {/* ── HERO ROW ── */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>

        {/* Hero title */}
        <div style={{ flex: 1, padding: "32px 40px 28px", borderRight: "1px solid var(--border)" }}>
          <h1 style={{
            fontSize: 80,
            fontWeight: 900,
            letterSpacing: "-0.05em",
            lineHeight: 0.9,
            textTransform: "uppercase",
            color: "var(--ink)",
            margin: 0,
            fontFamily: "'Inter', sans-serif",
          }}>
            HEY,<br />
            <span style={{
              fontFamily: "'Instrument Serif', serif",
              fontWeight: 400,
              fontStyle: "italic",
              textTransform: "lowercase",
              color: "var(--accent)",
              letterSpacing: "-0.02em",
            }}>
              {firstName}.
            </span>
          </h1>
        </div>

        {/* Focus card */}
        <div style={{
          width: 300,
          padding: "32px",
          background: "var(--ink)",
          color: "var(--bg)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flexShrink: 0,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "rgba(251,247,239,0.4)", fontFamily: "'Inter', sans-serif" }}>
            Needs Attention
          </span>
          <div>
            <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: "-0.05em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: "var(--bg)", fontFamily: "'Inter', sans-serif" }}>
              {followUps.length}
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "rgba(251,247,239,0.45)", marginTop: 4, fontFamily: "'Inter', sans-serif" }}>
              follow-ups due
            </div>
          </div>
          <Link
            href="/contacts"
            style={{ display: "inline-flex", alignItems: "center", padding: "10px 20px", background: "var(--accent)", color: "var(--bg)", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", textDecoration: "none", border: "1px solid var(--accent)", transition: "background 150ms", fontFamily: "'Inter', sans-serif" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--accent-hover)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "var(--accent)"}
          >
            Chase up →
          </Link>
        </div>

      </div>

      {/* ── PIPELINE TABLE ── */}
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Section label */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 40px", height: 44, background: "var(--surface)", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text)", fontFamily: "'Inter', sans-serif" }}>Pipeline</span>
            {activeDeals.length > 0 && (
              <span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontSize: 13, color: "var(--text-dim)" }}>
                {activeDeals.length} deals active
              </span>
            )}
          </div>
          <Link
            href="/pipeline"
            style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--text-dim)", textDecoration: "none", fontFamily: "'Inter', sans-serif", transition: "color 120ms" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "var(--accent)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "var(--text-dim)"}
          >
            View all →
          </Link>
        </div>

        {/* Column headers */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 160px", padding: "0 40px", height: 36, alignItems: "center", background: "var(--surface)", borderBottom: "1px solid var(--border-soft)", flexShrink: 0 }}>
          {["Brand", "Value", "Status"].map(h => (
            <span key={h} style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-dim)", fontFamily: "'Inter', sans-serif" }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        <div className="scrollbar-thin" style={{ flex: 1, overflowY: "auto" }}>
          {deals.length === 0 ? (
            <div style={{ padding: "48px 40px" }}>
              <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-dim)", margin: "0 0 8px", fontFamily: "'Inter', sans-serif" }}>No deals yet</p>
              <p style={{ fontSize: 13, color: "var(--text-muted)", margin: 0, fontFamily: "'Inter', sans-serif" }}>Positive replies get flagged automatically.</p>
            </div>
          ) : deals.map(deal => (
            <PipelineRow key={deal.id} deal={deal} />
          ))}
        </div>

      </div>

      {/* ── STAT STRIP ── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", flexShrink: 0, borderTop: "1px solid var(--border)" }}>
        {STATS.map(({ label, value }, i) => (
          <div key={label} style={{ padding: "18px 40px", borderRight: i < 3 ? "1px solid var(--border)" : "none" }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.2em", color: "var(--text-dim)", margin: "0 0 4px", fontFamily: "'Inter', sans-serif" }}>
              {label}
            </p>
            <p style={{ fontSize: 40, fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1, fontVariantNumeric: "tabular-nums", color: "var(--text)", margin: 0, fontFamily: "'Inter', sans-serif" }}>
              {value}
            </p>
          </div>
        ))}
      </div>

    </div>
  );
}
