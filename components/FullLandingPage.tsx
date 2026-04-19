"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

// ── Typing animation ──────────────────────────────────────────
const NICHES = ["food creator", "lifestyle influencer", "tech youtuber", "parenting guru"];

// ── Capacity accent colours per category ─────────────────────
const CAPACITY_ACCENTS: Record<string, { accent: string; bg: string }> = {
  foodie:    { accent: "#E8622A", bg: "#FFF4EF" },
  lifestyle: { accent: "#7C3AED", bg: "#F5F0FF" },
  beauty:    { accent: "#DB2777", bg: "#FFF0F7" },
  fitness:   { accent: "#059669", bg: "#EFFFFA" },
};

function useTyping(words: string[], speed = 78, del = 42, pause = 2400) {
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const word = words[idx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting) {
      if (text === word) t = setTimeout(() => setDeleting(true), pause);
      else t = setTimeout(() => setText(word.slice(0, text.length + 1)), speed);
    } else {
      if (!text) { setDeleting(false); setIdx(n => (n + 1) % words.length); }
      else t = setTimeout(() => setText(prev => prev.slice(0, -1)), del);
    }
    return () => clearTimeout(t);
  }, [text, deleting, idx, words, speed, del, pause]);
  return text;
}

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVis(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, vis };
}

// ── Mockup components ─────────────────────────────────────────

function HeroDashboard() {
  const deals = [
    { b: "Innocent Drinks", v: "£2,400", s: "Negotiating", c: "#F59E0B" },
    { b: "M&S Food", v: "£3,200", s: "Contracted", c: "#8B5CF6" },
    { b: "Graze", v: "£900", s: "Replied", c: "#6366F1" },
    { b: "Oatly", v: "£1,800", s: "Pitched", c: "#3B82F6" },
  ];
  return (
    <div style={{ background: "#0F1E30", borderRadius: 18, border: "1px solid rgba(255,255,255,0.09)", boxShadow: "0 40px 80px -10px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.04)", overflow: "hidden" }}>
      <div style={{ background: "rgba(255,255,255,0.03)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "11px 16px", display: "flex", alignItems: "center", gap: 7 }}>
        {["#FF5F57","#FEBC2E","#28C840"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
        <div style={{ flex: 1, textAlign: "center" }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.18)", background: "rgba(255,255,255,0.04)", padding: "2px 14px", borderRadius: 5, letterSpacing: "0.01em" }}>collabi.io/dashboard</span>
        </div>
      </div>
      <div style={{ padding: "14px 16px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 14 }}>
          {[{ l: "Contacts", v: "10k+" }, { l: "Emails Sent", v: "47" }, { l: "Active Deals", v: "8" }].map(s => (
            <div key={s.l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 5 }}>{s.l}</p>
              <p style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1, fontFamily: "'Inter',sans-serif" }}>{s.v}</p>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <p style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.09em" }}>Deal Pipeline</p>
          <span style={{ fontSize: 10, color: "#E8622A", fontWeight: 700 }}>4 active</span>
        </div>
      </div>
      <div style={{ padding: "0 16px 16px", display: "flex", flexDirection: "column", gap: 5 }}>
        {deals.map(d => (
          <div key={d.b} style={{ display: "flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.03)", borderRadius: 9, padding: "8px 10px", border: "1px solid rgba(255,255,255,0.055)" }}>
            <div style={{ width: 26, height: 26, borderRadius: 7, background: `${d.c}20`, border: `1px solid ${d.c}40`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 10, fontWeight: 800, color: d.c }}>{d.b[0]}</span>
            </div>
            <span style={{ flex: 1, fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.78)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{d.b}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#10B981", flexShrink: 0 }}>{d.v}</span>
            <div style={{ padding: "2px 8px", borderRadius: 20, background: `${d.c}18`, border: `1px solid ${d.c}38`, flexShrink: 0 }}>
              <span style={{ fontSize: 9, fontWeight: 700, color: d.c }}>{d.s}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactsMockup() {
  const rows = [
    { name: "Beth Griffiths", co: "Innocent Drinks", role: "Brand Manager", tag: "Drinks", hue: 200 },
    { name: "James Cooper", co: "M&S Food", role: "Marketing Lead", tag: "Grocery", hue: 140 },
    { name: "Sarah Mills", co: "Graze", role: "Partnerships", tag: "Snacks", hue: 30 },
    { name: "Tom Walsh", co: "Oatly", role: "Brand Director", tag: "Dairy", hue: 260 },
    { name: "Emma Clarke", co: "Clipper Teas", role: "Marketing Mgr", tag: "Coffee & Tea", hue: 48 },
  ];
  return (
    <div style={{ background: "#0F1E30", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Inter',sans-serif" }}>Contacts</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>10,000+ brand contacts</p>
        </div>
        <div style={{ background: "#E8622A", borderRadius: 7, padding: "5px 11px", fontSize: 10, color: "#fff", fontWeight: 700 }}>+ Add Contact</div>
      </div>
      <div style={{ padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ background: "rgba(255,255,255,0.05)", borderRadius: 8, padding: "6px 10px", display: "flex", alignItems: "center", gap: 7 }}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>Search contacts...</span>
        </div>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 18px", borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `hsl(${r.hue},55%,30%)`, border: `1px solid hsl(${r.hue},55%,42%)`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>{r.name[0]}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{r.name}</p>
            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{r.co} · {r.role}</p>
          </div>
          <div style={{ padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.06)", flexShrink: 0 }}>
            <span style={{ fontSize: 9, color: "rgba(255,255,255,0.38)", fontWeight: 600 }}>{r.tag}</span>
          </div>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(232,98,42,0.12)", border: "1px solid rgba(232,98,42,0.22)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#E8622A" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmailMockup() {
  return (
    <div style={{ background: "#0F1E30", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Inter',sans-serif" }}>New Campaign</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>24 contacts selected</p>
        </div>
        <div style={{ display: "flex", gap: 5 }}>
          {["Pitched","Replied","All"].map((t,i) => (
            <div key={t} style={{ padding: "3px 9px", borderRadius: 20, background: i === 2 ? "#E8622A" : "rgba(255,255,255,0.06)", fontSize: 9, color: i === 2 ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: 600 }}>{t}</div>
          ))}
        </div>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: "9px 13px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.07em" }}>To</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {["Innocent Drinks", "M&S Food", "Graze", "+21 more"].map((t, i) => (
              <span key={i} style={{ fontSize: 10, background: i < 3 ? "rgba(232,98,42,0.15)" : "rgba(255,255,255,0.06)", color: i < 3 ? "#E8622A" : "rgba(255,255,255,0.38)", padding: "2px 8px", borderRadius: 20, fontWeight: 600 }}>{t}</span>
            ))}
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: "9px 13px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ fontSize: 9, color: "rgba(255,255,255,0.3)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.07em" }}>Subject</p>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>Collab opportunity — <span style={{ color: "#E8622A", fontWeight: 600 }}>{"{{name}}"}</span></p>
        </div>
        <div style={{ background: "rgba(255,255,255,0.04)", borderRadius: 9, padding: "11px 13px", border: "1px solid rgba(255,255,255,0.07)" }}>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", lineHeight: 1.8 }}>Hi <span style={{ color: "#E8622A", fontWeight: 600 }}>{"{{name}}"}</span>,</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.38)", lineHeight: 1.8, marginTop: 2 }}>I&apos;ve been following <span style={{ color: "#E8622A", fontWeight: 600 }}>{"{{company}}"}</span> for a while and would love to explore a collaboration...</p>
          <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 5 }}>
            {[3,2,3.5,1.5].map((w,i) => <div key={i} style={{ height: 2, width: `${w * 22}%`, background: "rgba(255,255,255,0.07)", borderRadius: 2 }} />)}
          </div>
        </div>
        <div style={{ background: "#E8622A", borderRadius: 9, padding: "10px", display: "flex", alignItems: "center", justifyContent: "center", gap: 7 }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#fff" }}>Send Campaign</span>
        </div>
      </div>
    </div>
  );
}

function PipelineMockup() {
  const cols = [
    { label: "Pitched", color: "#3B82F6", deals: [{ b: "Innocent", v: "£2,400" }, { b: "Clipper", v: "£1,100" }] },
    { label: "Replied", color: "#6366F1", deals: [{ b: "Graze", v: "£900" }] },
    { label: "Contracted", color: "#8B5CF6", deals: [{ b: "M&S Food", v: "£3,200" }] },
    { label: "Paid", color: "#10B981", deals: [{ b: "Oatly", v: "£1,800" }] },
  ];
  return (
    <div style={{ background: "#0F1E30", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Inter',sans-serif" }}>Deal Pipeline</p>
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8622A", animation: "cl-pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: "#E8622A", fontWeight: 600 }}>6 active deals · £10,400</span>
        </div>
      </div>
      <div style={{ padding: 14, display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
        {cols.map(col => (
          <div key={col.label}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 9 }}>
              <div style={{ width: 6, height: 6, borderRadius: 2, background: col.color }} />
              <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.38)", textTransform: "uppercase", letterSpacing: "0.07em" }}>{col.label}</span>
            </div>
            {col.deals.map((d, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: "9px 10px", marginBottom: 6, border: `1px solid ${col.color}28` }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#fff", marginBottom: 4 }}>{d.b}</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#10B981" }}>{d.v}</p>
              </div>
            ))}
            <div style={{ border: `1px dashed rgba(255,255,255,0.07)`, borderRadius: 8, padding: "8px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontSize: 16, color: "rgba(255,255,255,0.12)" }}>+</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AdsMockup() {
  const rows = [
    { name: "Innocent Drinks", cat: "Drinks", status: "Running", spend: "High" },
    { name: "M&S Food", cat: "Grocery", status: "Running", spend: "High" },
    { name: "Graze", cat: "Snacks", status: "Paused", spend: "Low" },
    { name: "Oatly", cat: "Dairy", status: "Running", spend: "Med" },
    { name: "Clipper Teas", cat: "Coffee & Tea", status: "None", spend: "—" },
  ];
  return (
    <div style={{ background: "#0F1E30", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 32px 60px rgba(0,0,0,0.35)", overflow: "hidden" }}>
      <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", fontFamily: "'Inter',sans-serif" }}>Meta Ad Intelligence</p>
          <p style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1 }}>Scanned 2 minutes ago</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(232,98,42,0.1)", border: "1px solid rgba(232,98,42,0.25)", borderRadius: 7, padding: "4px 10px" }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8622A", animation: "cl-pulse 2s infinite" }} />
          <span style={{ fontSize: 10, color: "#E8622A", fontWeight: 600 }}>Live</span>
        </div>
      </div>
      <div style={{ padding: "0 0 4px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0 16px", padding: "8px 18px 6px", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
          {["Company","Status","Spend"].map(h => <p key={h} style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.22)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{h}</p>)}
        </div>
        {rows.map((r, i) => (
          <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto auto", gap: "0 16px", padding: "10px 18px", borderBottom: i < rows.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none", alignItems: "center" }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: r.status === "Running" ? "#fff" : "rgba(255,255,255,0.5)" }}>{r.name}</p>
              <p style={{ fontSize: 9, color: "rgba(255,255,255,0.25)" }}>{r.cat}</p>
            </div>
            <div style={{
              padding: "2px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", gap: 4,
              background: r.status === "Running" ? "rgba(16,185,129,0.12)" : r.status === "Paused" ? "rgba(245,158,11,0.1)" : "rgba(255,255,255,0.05)",
              color: r.status === "Running" ? "#10B981" : r.status === "Paused" ? "#F59E0B" : "rgba(255,255,255,0.22)",
            }}>
              {r.status === "Running" && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#10B981", animation: "cl-pulse 2s infinite" }} />}
              {r.status}
            </div>
            <p style={{ fontSize: 11, fontWeight: 600, color: r.spend === "High" ? "#E8622A" : r.spend === "Med" ? "#F59E0B" : "rgba(255,255,255,0.25)", textAlign: "right" }}>{r.spend}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Feature sections data ──────────────────────────────────────
const FEATURES = [
  {
    tag: "Brand Contacts",
    title: "10,000+ contacts.",
    body: "Every contact is a real and verified marketing decision-maker at a brand you love. Food, drink, lifestyle, wellness, beauty — filtered by category, and contactable in one click. We did the work so you don't have to.",
    bullets: ["Brand managers & marketing leads", "Filtered by category & industry", "Request any missing contact"],
    mockup: <ContactsMockup />,
  },
  {
    tag: "Meta Ad Intelligence",
    title: "Pitch brands when\ntheir budget is open.",
    body: "A brand actively spending on Meta ads is a brand with a live marketing budget. We scan thousands of brands daily and flag who's running ads right now — so you pitch at exactly the right moment.",
    bullets: ["Live ad status for all contacts", "Daily automatic rescans"],
    mockup: <AdsMockup />,
  },
  {
    tag: "Email Outreach",
    title: "Personal at scale.\nPowerful by default.",
    body: "Send campaigns from your own Gmail or Outlook account — not a bulk sender with a strange domain. Use merge tags to personalise every line. Get automatic follow-up reminders. Every reply tracked.",
    bullets: ["Sends from your own inbox", "Send mass campaigns with personalisation", "Auto follow-up reminders"],
    mockup: <EmailMockup />,
  },
  {
    tag: "Deal Pipeline",
    title: "First pitch to paid.\nNothing gets lost.",
    body: "A visual deal board that shows exactly where every brand conversation stands. Move deals forward, log notes, track deal values. When a brand goes quiet, you'll know — and you'll know when to nudge.",
    bullets: ["Visual Kanban board", "Deal value & stage tracking", "Notes on every conversation"],
    mockup: <PipelineMockup />,
  },
];

// ── Main page ──────────────────────────────────────────────────
type CapacityRow = { category: string; label: string; emoji: string; filled: number; cap: number };

export default function LandingPage() {
  const typed = useTyping(NICHES);
  const [scrolled, setScrolled] = useState(false);
  const hero = useInView(0.05);
  const logos = useInView(0.1);
  const f0 = useInView(0.08);
  const f1 = useInView(0.08);
  const f2 = useInView(0.08);
  const f3 = useInView(0.08);
  const pricing = useInView(0.1);
  const urgency = useInView(0.1);
  const fRefs = [f0, f1, f2, f3];
  const [capacityRows, setCapacityRows] = useState<CapacityRow[]>([]);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    fetch("/api/capacity")
      .then(r => r.ok ? r.json() : [])
      .then(data => { if (Array.isArray(data) && data.length) setCapacityRows(data); })
      .catch(() => {});
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .cl-page { font-family: 'Inter', sans-serif; background: linear-gradient(150deg, #F0CBB4 0%, #E3AD8E 55%, #D4916C 100%) fixed; color: #0D1B2A; line-height: 1.5; -webkit-font-smoothing: antialiased; }
        .cl-h { font-family: 'Inter', sans-serif; }
        .cl-nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; transition: all 0.25s; }
        .cl-nav-inner { max-width: 1160px; margin: 0 auto; padding: 0 28px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
        .cl-nav-scrolled { background: rgba(255,255,255,0.92); backdrop-filter: blur(20px); border-bottom: 1px solid rgba(0,0,0,0.07); }
        .cl-dot { background-image: radial-gradient(circle, rgba(13,27,42,0.06) 1.2px, transparent 1.2px); background-size: 28px 28px; }
        .cl-btn { display: inline-flex; align-items: center; gap: 7px; text-decoration: none; border-radius: 9px; font-weight: 600; font-family: 'DM Sans', sans-serif; transition: all 0.18s ease; cursor: pointer; border: none; }
        .cl-btn-primary { background: #E8622A; color: #fff; padding: 11px 22px; font-size: 14px; }
        .cl-btn-primary:hover { background: #d45520; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(232,98,42,0.3); }
        .cl-btn-primary-lg { background: #E8622A; color: #fff; padding: 14px 30px; font-size: 16px; border-radius: 10px; }
        .cl-btn-primary-lg:hover { background: #d45520; transform: translateY(-1.5px); box-shadow: 0 8px 28px rgba(232,98,42,0.35); }
        .cl-btn-ghost { background: transparent; color: #0D1B2A; padding: 11px 18px; font-size: 14px; border: 1px solid #e5e7eb; }
        .cl-btn-ghost:hover { border-color: #E8622A; color: #E8622A; }
        .cl-float { animation: cl-float 6s ease-in-out infinite; }
        @keyframes cl-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }
        @keyframes cl-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }
        .cl-cursor { display: inline-block; width: 2.5px; height: 1em; background: #E8622A; margin-left: 2px; vertical-align: text-bottom; animation: cl-blink 1s step-end infinite; border-radius: 1px; }
        @keyframes cl-blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .cl-fade { opacity: 0; transform: translateY(24px); transition: opacity 0.6s ease, transform 0.6s ease; }
        .cl-fade.vis { opacity: 1; transform: none; }
        .cl-feat-card { transition: transform 0.25s ease, box-shadow 0.25s ease; border-radius: 14px; border: 1px solid #f0f0f0; padding: 28px; }
        .cl-feat-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.08); border-color: #fbd6c8; }
        .cl-price-card { border: 1.5px solid #f0f0f0; border-radius: 20px; padding: 48px; background: #fff; transition: border-color 0.25s, box-shadow 0.25s; box-shadow: 0 4px 24px rgba(0,0,0,0.05); }
        .cl-price-card:hover { border-color: #E8622A; box-shadow: 0 8px 40px rgba(232,98,42,0.12); }
        .cl-logo-item { font-family: 'Bricolage Grotesque', sans-serif; font-weight: 700; font-size: 15px; color: #c8cdd4; letter-spacing: -0.01em; transition: color 0.2s; white-space: nowrap; }
        .cl-logo-item:hover { color: #9ba3ae; }
        .cl-section { padding: 110px 28px; }
        .cl-section-sm { padding: 72px 28px; }
        .cl-inner { max-width: 1160px; margin: 0 auto; }
        .cl-tag { display: inline-block; font-size: 11px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: #E8622A; background: rgba(232,98,42,0.08); padding: 4px 12px; border-radius: 100px; margin-bottom: 16px; }
        .cl-hero-grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr); gap: 80px; align-items: center; }
        .cl-feat-row { display: grid; grid-template-columns: 1fr 1fr; gap: 80px; align-items: center; }
        .cl-pricing-grain { background: #0D1B2A; }
        .cl-pricing-grain::before { content: ""; position: absolute; inset: 0; background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E"); background-size: 200px 200px; opacity: 0.055; pointer-events: none; z-index: 0; }
        .cl-pricing-grain::after { content: ""; position: absolute; inset: 0; background: radial-gradient(ellipse at 30% 50%, rgba(71,129,255,0.18) 0%, transparent 65%), radial-gradient(ellipse at 80% 20%, rgba(232,98,42,0.08) 0%, transparent 50%); pointer-events: none; z-index: 0; }
        .cl-desktop-only { display: block; }
        .cl-mobile-only { display: none; }
        @media (max-width: 768px) {
          .cl-desktop-only { display: none !important; }
          .cl-mobile-only { display: block !important; }
        }
        .cl-hero-copy { min-height: 520px; }
        @media (max-width: 768px) {
          .cl-hero-section { min-height: unset !important; padding-top: 100px !important; padding-bottom: 60px !important; }
          .cl-hero-copy { min-height: unset !important; }
        }
        @media (max-width: 900px) {
          .cl-hero-grid { grid-template-columns: 1fr !important; gap: 40px !important; }
          .cl-mockup-hide { display: none !important; }
          .cl-feat-row { grid-template-columns: 1fr !important; gap: 40px !important; }
          .cl-feat-row-rev { direction: ltr !important; }
          .cl-section { padding: 72px 20px; }
          .cl-price-card { padding: 32px 24px; }
          .cl-nav-signin { display: none !important; }
        }
      `}</style>

      <div className="cl-page">

        {/* ── NAV ── */}
        <nav className={`cl-nav${scrolled ? " cl-nav-scrolled" : ""}`}>
          <div className="cl-nav-inner">
            <Link href="/" style={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
              <span className="cl-h" style={{ fontSize: 24, fontWeight: 800, color: "#0D1B2A", letterSpacing: "-0.04em" }}>Collabi</span>
            </Link>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <Link href="/sign-in" className="cl-btn cl-btn-ghost cl-nav-signin">Sign in</Link>
              <Link href="/sign-up" className="cl-btn cl-btn-primary">Start free trial →</Link>
            </div>
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="cl-dot cl-hero-section" style={{ paddingTop: 140, paddingBottom: 100, paddingLeft: 28, paddingRight: 28, background: "transparent", position: "relative", overflow: "hidden", minHeight: 760 }}>
          <div style={{ position: "absolute", top: "20%", right: "8%", width: 480, height: 480, background: "radial-gradient(ellipse, rgba(232,98,42,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
          <div className="cl-inner">
            <div ref={hero.ref} className={`cl-hero-grid cl-fade${hero.vis ? " vis" : ""}`}>
              {/* Copy */}
              <div className="cl-hero-copy">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(232,98,42,0.07)", border: "1px solid rgba(232,98,42,0.18)", borderRadius: 100, padding: "5px 13px", marginBottom: 26 }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8622A", animation: "cl-pulse 2s infinite" }} />
                  <span style={{ fontSize: 11, color: "#E8622A", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" }}>Now in early access</span>
                </div>

                <h1 className="cl-h" style={{ fontSize: "clamp(42px, 5.5vw, 68px)", fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.04em", color: "#0D1B2A", marginBottom: 20 }}>
                  Land more brand<br />
                  deals as a<br />
                  <span style={{ color: "#E8622A" }}>{typed}<span className="cl-cursor" /></span>
                </h1>

                <p style={{ fontSize: 18, color: "#6b7280", lineHeight: 1.75, marginBottom: 36, maxWidth: 480, fontWeight: 400 }}>
                  The outreach platform built for creators, by a creator. 10,000+ brand contacts, email campaigns, deal tracking, and meta ad intelligence — all in one place.
                </p>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
                  <Link href="/sign-up" className="cl-btn cl-btn-primary-lg">
                    Start 7-day free trial
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                  </Link>
                  <Link href="/sign-in" className="cl-btn cl-btn-ghost" style={{ fontSize: 15, padding: "13px 22px", borderRadius: 10 }}>Sign in</Link>
                </div>
                <p style={{ fontSize: 13, color: "#9ca3af" }}>No card required · £29/month after trial · Cancel anytime</p>
              </div>

              {/* Mockup */}
              <div className="cl-float cl-mockup-hide" style={{ position: "relative" }}>
                <HeroDashboard />
                <div style={{ position: "absolute", bottom: -12, right: -16, background: "#fff", border: "1px solid #f0f0f0", borderRadius: 12, padding: "10px 14px", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}>
                  <p style={{ fontSize: 10, color: "#9ca3af", marginBottom: 2 }}>Deal closed</p>
                  <p style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>Innocent Drinks · £2,400</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── LOGOS ── */}
        <div ref={logos.ref} style={{ borderTop: "1px solid #f3f4f6", borderBottom: "1px solid #f3f4f6", padding: "28px", background: "#fafafa" }}>
          <div className="cl-inner">
            <div className={`cl-fade${logos.vis ? " vis" : ""}`} style={{ display: "flex", alignItems: "center", gap: 40, flexWrap: "wrap", justifyContent: "center" }}>
              <p style={{ fontSize: 12, color: "#c4c9d1", fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", flexShrink: 0 }}>Creators working with</p>
              {["Innocent", "M&S Food", "Graze", "Oatly", "Clipper", "Pip & Nut"].map(b => (
                <span key={b} className="cl-logo-item">{b}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── FEATURES (desktop only) ── */}
        <div className="cl-desktop-only">
          {FEATURES.map((f, i) => {
            const fr = fRefs[i];
            const reverse = i % 2 !== 0;
            return (
              <section key={f.tag} className="cl-section" style={{ background: i % 2 === 0 ? "#fff" : "#fafafa", padding: "100px 28px" }}>
                <div className="cl-inner">
                  <div
                    ref={fr.ref}
                    className={`cl-feat-row cl-fade${fr.vis ? " vis" : ""}${reverse ? " cl-feat-row-rev" : ""}`}
                    style={{ direction: reverse ? "rtl" : "ltr" } as React.CSSProperties}
                  >
                    <div style={{ direction: "ltr" }}>
                      <div className="cl-tag">{f.tag}</div>
                      <h2 className="cl-h" style={{ fontSize: "clamp(30px, 3.5vw, 44px)", fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.1, color: "#0D1B2A", marginBottom: 20, whiteSpace: "pre-line" }}>
                        {f.title}
                      </h2>
                      <p style={{ fontSize: 17, color: "#6b7280", lineHeight: 1.8, marginBottom: 28 }}>{f.body}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                        {f.bullets.map(b => (
                          <div key={b} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(232,98,42,0.1)", border: "1px solid rgba(232,98,42,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#E8622A" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                            </div>
                            <span style={{ fontSize: 14, color: "#4b5563", fontWeight: 500 }}>{b}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div style={{ direction: "ltr" }}>{f.mockup}</div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>

        {/* ── MOBILE FEATURES (mobile only) ── */}
        <div className="cl-mobile-only" style={{ background: "#fff", padding: "56px 24px" }}>
          <p style={{ textAlign: "center", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#E8622A", marginBottom: 10 }}>Everything you need</p>
          <h2 className="cl-h" style={{ textAlign: "center", fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", color: "#0D1B2A", marginBottom: 32, lineHeight: 1.2 }}>
            One platform.<br />Every tool.
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            {[
              { emoji: "📋", title: "10k+ contacts", body: "Real brand managers, ready to pitch" },
              { emoji: "📊", title: "Ad intelligence", body: "See which brands have live budgets" },
              { emoji: "✉️", title: "Email campaigns", body: "Send from your own Gmail or Outlook" },
              { emoji: "💼", title: "Deal pipeline", body: "Track every conversation to paid" },
            ].map(({ emoji, title, body }) => (
              <div key={title} style={{ background: "rgba(251,247,242,0.7)", borderRadius: 16, padding: "20px 18px", border: "1px solid #F0F0F2" }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{emoji}</div>
                <p style={{ fontSize: 14, fontWeight: 700, color: "#0D1B2A", marginBottom: 5, letterSpacing: "-0.02em" }}>{title}</p>
                <p style={{ fontSize: 12, color: "#9CA3AF", lineHeight: 1.5 }}>{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── CREATOR SPOTS ── */}
        <section className="cl-section" style={{ background: "rgba(251,247,242,0.7)", padding: "90px 28px" }}>
          <div className="cl-inner" style={{ maxWidth: 860 }}>
            <div ref={urgency.ref} className={`cl-fade${urgency.vis ? " vis" : ""}`}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div className="cl-tag">Limited Access</div>
                <h2 className="cl-h" style={{ fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 800, letterSpacing: "-0.03em", color: "#0D1B2A", marginBottom: 12 }}>
                  We cap each creator category.
                </h2>
                <p style={{ fontSize: 16, color: "#6B7280", maxWidth: 480, margin: "0 auto" }}>
                  To keep the platform valuable, we limit how many creators share each brand database. Once a category fills up, it closes.
                </p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
                {capacityRows.map(({ category, label, emoji, filled, cap }) => {
                  const { accent, bg } = CAPACITY_ACCENTS[category] || { accent: "#E8622A", bg: "#FFF4EF" };
                  const pct = cap > 0 ? Math.round((filled / cap) * 100) : 0;
                  const left = cap - filled;
                  return (
                    <div key={category} style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 16, padding: "24px 28px", boxShadow: "0 1px 4px rgba(0,0,0,0.05)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                        <span style={{ fontSize: 22 }}>{emoji}</span>
                        <span style={{ fontWeight: 700, fontSize: 16, color: "#0D1B2A" }}>{label} creators</span>
                      </div>
                      {/* Bar */}
                      <div style={{ background: "#F3F4F6", borderRadius: 999, height: 8, marginBottom: 12, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${pct}%`, background: accent, borderRadius: 999, transition: "width 1s ease" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontSize: 13, color: "#6B7280" }}>
                          <span style={{ fontWeight: 700, color: "#0D1B2A" }}>{filled}</span> of {cap} spots filled
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: accent, background: bg, padding: "3px 10px", borderRadius: 999 }}>
                          {left} left
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div style={{ textAlign: "center", marginTop: 40 }}>
                <a href="/sign-up" style={{ display: "inline-block", background: "#E8622A", color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px 32px", borderRadius: 12, textDecoration: "none", letterSpacing: "-0.01em" }}>
                  Claim your spot now →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section className="cl-section cl-pricing-grain" style={{ padding: "110px 28px", position: "relative", overflow: "hidden" }}>
          {/* SVG grain filter — hidden, just defines the filter */}
          <svg width="0" height="0" style={{ position: "absolute" }}>
            <defs>
              <filter id="cl-grain">
                <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch" result="noise" />
                <feColorMatrix type="saturate" values="0" in="noise" result="grayNoise" />
                <feBlend in="SourceGraphic" in2="grayNoise" mode="overlay" result="blended" />
                <feComposite in="blended" in2="SourceGraphic" operator="in" />
              </filter>
            </defs>
          </svg>
          <div className="cl-inner" style={{ maxWidth: 620, position: "relative", zIndex: 1 }}>
            <div ref={pricing.ref} className={`cl-fade${pricing.vis ? " vis" : ""}`} style={{ textAlign: "center" }}>
              <div style={{ display: "inline-block", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.1)", padding: "4px 12px", borderRadius: 100, marginBottom: 16 }}>Pricing</div>
              <h2 className="cl-h" style={{ fontSize: "clamp(32px, 4vw, 48px)", fontWeight: 800, letterSpacing: "-0.035em", color: "#fff", marginBottom: 48 }}>
                One price.<br />Everything included.
              </h2>
              <div style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "48px", backdropFilter: "blur(10px)" }}>
                <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "center", gap: 4, marginBottom: 6 }}>
                  <span className="cl-h" style={{ fontSize: 72, fontWeight: 800, color: "#fff", letterSpacing: "-0.05em", lineHeight: 1 }}>£29</span>
                  <span style={{ fontSize: 18, color: "rgba(255,255,255,0.45)", marginBottom: 10 }}>/month</span>
                </div>
                <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", marginBottom: 36 }}>7-day free trial · No card required · Cancel anytime</p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 24px", textAlign: "left", marginBottom: 40 }}>
                  {[
                    "10,000+ brand contacts",
                    "Unlimited campaigns",
                    "Deal pipeline board",
                    "Meta Ad Intelligence",
                    "Gmail & Outlook integration",
                    "Media kit generator",
                    "Automatic follow-up reminders",
                    "New contacts added monthly",
                  ].map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(16,185,129,0.2)", border: "1px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#34D399" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.75)" }}>{item}</span>
                    </div>
                  ))}
                </div>

                <Link href="/sign-up" className="cl-btn cl-btn-primary-lg" style={{ width: "100%", justifyContent: "center", display: "flex", textDecoration: "none", borderRadius: 12, padding: "16px", background: "#fff", color: "#0D1B2A" }}>
                  Start 7-day free trial — it&apos;s free
                </Link>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 14 }}>No credit card needed. Cancel at any time.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer style={{ borderTop: "1px solid #f3f4f6", padding: "32px 28px", background: "#fff" }}>
          <div className="cl-inner" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <span className="cl-h" style={{ fontSize: 15, fontWeight: 800, color: "#9ca3af", letterSpacing: "-0.03em" }}>Collabi © 2025</span>
            <div style={{ display: "flex", gap: 24 }}>
              {[["Sign in", "/sign-in"], ["Sign up", "/sign-up"], ["Privacy", "/privacy"], ["Terms", "/terms"], ["Data Removal", "/data-removal"]].map(([l, h]) => (
                <Link key={l} href={h} style={{ fontSize: 13, color: "#9ca3af", textDecoration: "none" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#E8622A")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
                >{l}</Link>
              ))}
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
