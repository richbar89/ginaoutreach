"use client";
import { useState, useEffect, useRef } from "react";

/* ── Types ────────────────────────────────────────────── */
type Brand = { name: string; category: string; country: string };

/* ── Avatar colour palette ────────────────────────────── */
const PALETTE = [
  { bg: "#FFE4DC", fg: "#C4603A" },
  { bg: "#E8E4FF", fg: "#6B50C4" },
  { bg: "#DCF0EE", fg: "#2A8F80" },
  { bg: "#FFE8F0", fg: "#C43A6B" },
  { bg: "#E4F0DC", fg: "#4A8A30" },
  { bg: "#DCE8FF", fg: "#3A6BC4" },
  { bg: "#FFF4DC", fg: "#C4923A" },
  { bg: "#F0DCF0", fg: "#8A3AC4" },
];

function avatarColor(name: string) {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return PALETTE[h % PALETTE.length];
}

/* ── Fallback brands shown before API responds ────────── */
const FALLBACKS: Brand[] = [
  { name: "Kinder & Co.", category: "Beauty", country: "Manchester" },
  { name: "Pebble", category: "Wellness", country: "Bristol" },
  { name: "Tally", category: "Fintech", country: "London" },
  { name: "Oru", category: "Wellness", country: "Brighton" },
  { name: "Papercut", category: "Stationery", country: "UK" },
  { name: "Ridge", category: "Lifestyle", country: "US" },
  { name: "Figtree", category: "Wellness", country: "Austin" },
  { name: "Halcyon", category: "Travel", country: "London" },
  { name: "Murray", category: "Food", country: "Glasgow" },
  { name: "Juno", category: "Audio", country: "Stockholm" },
  { name: "Cove", category: "Wellness", country: "Dublin" },
  { name: "Lumen", category: "Tech", country: "Berlin" },
  { name: "Bramble", category: "Food", country: "Edinburgh" },
  { name: "Cobalt", category: "Tech", country: "Berlin" },
  { name: "Nomad", category: "Travel", country: "SF" },
  { name: "Denim & Soul", category: "Fashion", country: "London" },
  { name: "Solace", category: "Wellness", country: "NYC" },
  { name: "Lark", category: "Lifestyle", country: "Sydney" },
  { name: "Grove", category: "Food", country: "Portland" },
  { name: "Beacon", category: "Tech", country: "London" },
  { name: "Haywood", category: "Fitness", country: "Melbourne" },
  { name: "Ember", category: "Beauty", country: "Paris" },
  { name: "Coba", category: "Lifestyle", country: "Barcelona" },
  { name: "Willow", category: "Wellness", country: "Amsterdam" },
];

/* ── Features ─────────────────────────────────────────── */
const FEATURES = [
  {
    emoji: "📋",
    tag: "Brand Contacts",
    title: "10,000+ verified contacts",
    body: "Every contact is a real, verified marketing decision-maker at a brand you'd love to work with. Food, drink, lifestyle, wellness, beauty — filtered by category, contactable in one click.",
    bullets: ["Brand managers & marketing leads", "Filtered by category & industry", "Request any missing contact"],
  },
  {
    emoji: "📊",
    tag: "Meta Ad Intelligence",
    title: "Pitch brands when their budget is open",
    body: "A brand actively spending on Meta ads has a live marketing budget. We scan thousands of brands daily and flag who's running ads right now.",
    bullets: ["Live ad status for all contacts", "Daily automatic rescans"],
  },
  {
    emoji: "✉️",
    tag: "Email Outreach",
    title: "Personal at scale. Powerful by default.",
    body: "Send campaigns from your own Gmail or Outlook — not a bulk sender with a strange domain. Use merge tags to personalise every line. Every reply tracked.",
    bullets: ["Sends from your own inbox", "Mass campaigns with personalisation", "Auto follow-up reminders"],
  },
  {
    emoji: "💼",
    tag: "Deal Pipeline",
    title: "First pitch to paid. Nothing gets lost.",
    body: "A visual deal board that shows exactly where every brand conversation stands. Move deals forward, log notes, track deal values.",
    bullets: ["Visual Kanban board", "Deal value & stage tracking", "Notes on every conversation"],
  },
];

/* ── BrandCard ────────────────────────────────────────── */
function BrandCard({ brand }: { brand: Brand }) {
  const col = avatarColor(brand.name);
  const letter = brand.name[0]?.toUpperCase() ?? "?";
  const sub = [brand.category, brand.country].filter(Boolean).join(" · ");
  return (
    <div style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 10,
      background: "rgba(255,255,255,0.72)",
      border: "1px solid rgba(200,185,170,0.28)",
      borderRadius: 14,
      padding: "9px 14px",
      flexShrink: 0,
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: col.bg, color: col.fg,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, fontWeight: 700, flexShrink: 0,
        fontFamily: "'Inter', sans-serif",
      }}>{letter}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1110", lineHeight: 1.3, whiteSpace: "nowrap" }}>{brand.name}</div>
        {sub && <div style={{ fontSize: 11, color: "#9E9790", lineHeight: 1.4, whiteSpace: "nowrap" }}>{sub}</div>}
      </div>
    </div>
  );
}

/* ── ScrollRow ────────────────────────────────────────── */
function ScrollRow({ brands, direction, duration }: { brands: Brand[]; direction: "left" | "right"; duration: number }) {
  const items = [...brands, ...brands];
  return (
    <div style={{ overflow: "hidden", width: "100%", flexShrink: 0 }}>
      <div style={{
        display: "flex",
        gap: 12,
        width: "max-content",
        willChange: "transform",
        animation: `${direction === "left" ? "lp-scroll-left" : "lp-scroll-right"} ${duration}s linear infinite`,
      }}>
        {items.map((b, i) => <BrandCard key={i} brand={b} />)}
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────── */
export default function WaitlistPage() {
  const [step, setStep] = useState<"email" | "details">("email");
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", niche: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [brands, setBrands] = useState<Brand[]>(FALLBACKS);
  const glowRef = useRef<HTMLDivElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/brands-public")
      .then(r => r.json())
      .then(d => { if (d.brands?.length > 10) setBrands(d.brands); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const move = (e: MouseEvent) => {
      if (!glowRef.current) return;
      glowRef.current.style.left = `${e.clientX}px`;
      glowRef.current.style.top = `${e.clientY}px`;
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, []);

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
  }

  function handleEmailNext(e: React.FormEvent) {
    e.preventDefault();
    if (form.email) setStep("details");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) setStatus("done");
      else setStatus("error");
    } catch {
      setStatus("error");
    }
  }

  const rows = [0, 1, 2, 3].map(r => {
    const row = brands.filter((_, i) => i % 4 === r);
    return row.length >= 6 ? row : FALLBACKS.filter((_, i) => i % 4 === r);
  });
  const durations = [52, 68, 44, 72];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,600&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #F5F0EA; }

        .lp { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; background: #F5F0EA; min-height: 100vh; }

        /* Nav */
        .lp-nav {
          position: fixed; top: 0; left: 0; right: 0; z-index: 100;
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 36px;
          background: rgba(245,240,234,0.88);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
        }
        .lp-logo {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 22px; font-weight: 600; letter-spacing: -0.04em;
          background: linear-gradient(to right, #FFD4A3, #FF9D6F);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; text-decoration: none;
        }
        .lp-nav-link {
          font-size: 14px; font-weight: 500; color: #6B6560;
          text-decoration: none; transition: color 0.15s;
        }
        .lp-nav-link:hover { color: #1A1110; }
        .lp-nav-btn {
          background: #1A1110; color: #fff; border: none; border-radius: 100px;
          padding: 10px 20px; font-size: 13px; font-weight: 600; cursor: pointer;
          font-family: 'Inter', sans-serif; transition: background 0.15s;
        }
        .lp-nav-btn:hover { background: #333; }

        /* Hero */
        .lp-hero {
          position: relative; height: 100vh; min-height: 620px;
          overflow: hidden; display: flex; flex-direction: column;
          align-items: center; justify-content: center;
        }
        .lp-bg-rows {
          position: absolute; inset: 0;
          display: flex; flex-direction: column; justify-content: space-around;
          padding: 12px 0; pointer-events: none; user-select: none;
        }
        @keyframes lp-scroll-left {
          from { transform: translateX(0); }
          to   { transform: translateX(-50%); }
        }
        @keyframes lp-scroll-right {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        .lp-vignette {
          position: absolute; inset: 0; pointer-events: none; z-index: 2;
          background: radial-gradient(ellipse 56% 68% at 50% 47%,
            rgba(245,240,234,0.92) 0%,
            rgba(245,240,234,0.68) 38%,
            rgba(245,240,234,0.22) 68%,
            transparent 100%
          );
        }

        /* Cursor glow */
        .lp-glow {
          position: fixed; width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(200,96,58,0.32) 0%, rgba(200,96,58,0.12) 42%, transparent 70%);
          filter: blur(32px);
          transform: translate(-50%, -50%);
          pointer-events: none; z-index: 5;
          will-change: left, top;
          left: 50%; top: 50%;
        }

        /* Centre content */
        .lp-center {
          position: relative; z-index: 10;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 80px 24px 128px; max-width: 720px; width: 100%;
        }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.82); border: 1px solid rgba(200,185,170,0.38);
          border-radius: 100px; padding: 6px 14px;
          font-size: 12px; font-weight: 500; color: #6B6560;
          margin-bottom: 32px; letter-spacing: 0.01em;
        }
        .lp-dot-orange { width: 7px; height: 7px; border-radius: 50%; background: #C4603A; flex-shrink: 0; }
        .lp-headline {
          font-family: 'Playfair Display', serif;
          font-size: clamp(52px, 7.5vw, 96px);
          font-weight: 900; color: #1A1110;
          line-height: 1.04; letter-spacing: -0.02em; margin-bottom: 24px;
        }
        .lp-headline em { font-style: italic; font-weight: 400; color: #C4603A; }
        .lp-sub {
          font-size: 16px; color: #6B6560; line-height: 1.7;
          max-width: 520px; margin-bottom: 36px;
        }

        /* Form pill */
        .lp-form {
          display: flex; background: #fff;
          border: 1.5px solid rgba(200,185,170,0.48);
          border-radius: 100px; padding: 6px 6px 6px 22px;
          box-shadow: 0 4px 24px rgba(0,0,0,0.07);
          gap: 8px; width: 100%; max-width: 440px; margin-bottom: 14px;
        }
        .lp-email {
          flex: 1; border: none; outline: none; background: transparent;
          font-size: 15px; color: #1A1110; font-family: 'Inter', sans-serif; min-width: 0;
        }
        .lp-email::placeholder { color: #B5AFA8; }
        .lp-submit {
          background: #1A1110; color: #fff; border: none; border-radius: 100px;
          padding: 12px 22px; font-size: 14px; font-weight: 600;
          font-family: 'Inter', sans-serif; cursor: pointer; white-space: nowrap;
          transition: background 0.14s, transform 0.12s; flex-shrink: 0;
        }
        .lp-submit:hover:not(:disabled) { background: #333; transform: scale(1.02); }
        .lp-submit:disabled { opacity: 0.6; cursor: not-allowed; }
        .lp-proof {
          display: flex; align-items: center; gap: 7px;
          font-size: 12.5px; color: #7A736B;
        }
        .lp-dot-green { width: 7px; height: 7px; border-radius: 50%; background: #4BBFB0; flex-shrink: 0; }

        /* Stats bar */
        .lp-stats {
          position: absolute; bottom: 28px; left: 50%; transform: translateX(-50%);
          z-index: 10; display: flex; align-items: center;
          background: rgba(255,255,255,0.85); border: 1px solid rgba(200,185,170,0.28);
          border-radius: 100px; padding: 14px 28px;
          backdrop-filter: blur(10px); box-shadow: 0 4px 20px rgba(0,0,0,0.06);
          white-space: nowrap;
        }
        .lp-stat { display: flex; flex-direction: column; align-items: center; gap: 2px; }
        .lp-stat-label { font-size: 10px; font-weight: 700; letter-spacing: 0.09em; text-transform: uppercase; color: #9E9790; }
        .lp-stat-value { font-size: 14px; font-weight: 700; color: #1A1110; }
        .lp-stat-div { width: 1px; height: 32px; background: rgba(200,185,170,0.38); margin: 0 24px; }

        /* Step 2 fields */
        .lp-field {
          width: 100%; padding: 12px 14px;
          border: 1.5px solid #E8E2DA; border-radius: 12px;
          font-size: 14px; font-family: 'Inter', sans-serif; color: #1A1110;
          background: #FAFAF9; outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .lp-field::placeholder { color: #B5AFA8; }
        .lp-field:focus { border-color: #C4603A; box-shadow: 0 0 0 3px rgba(196,96,58,0.1); background: #fff; }
        .lp-select { appearance: none; cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23B5AFA8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
        }

        /* Features */
        .lp-features { background: #EDE8E0; padding: 96px 24px; }
        .lp-feat-grid {
          max-width: 960px; margin: 48px auto 0;
          display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px;
        }
        .lp-feat-card {
          background: #FBF7F2; border-radius: 22px; padding: 30px;
          border: 1px solid rgba(200,185,170,0.28);
        }

        /* Footer */
        .lp-footer {
          background: #E5DED4; padding: 22px 36px;
          display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px;
        }

        @media (max-width: 640px) {
          .lp-nav { padding: 16px 20px; }
          .lp-headline { font-size: clamp(42px, 11vw, 64px); }
          .lp-feat-grid { grid-template-columns: 1fr; }
          .lp-stats { padding: 12px 18px; }
          .lp-stat-div { margin: 0 14px; }
          .lp-center { padding-bottom: 148px; }
          .lp-footer { padding: 18px 20px; }
        }
      `}</style>

      <div className="lp">
        {/* Cursor glow */}
        <div className="lp-glow" ref={glowRef} />

        {/* ── NAV ── */}
        <nav className="lp-nav">
          <span className="lp-logo">collabi</span>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <a href="#features" className="lp-nav-link">Features</a>
            <button className="lp-nav-btn" onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); emailRef.current?.focus(); }}>
              Join waitlist
            </button>
          </div>
        </nav>

        {/* ── HERO ── */}
        <div className="lp-hero">

          {/* Scrolling brand rows */}
          <div className="lp-bg-rows">
            {rows.map((row, i) => (
              <ScrollRow key={i} brands={row} direction={i % 2 === 0 ? "left" : "right"} duration={durations[i]} />
            ))}
          </div>

          {/* Centre vignette */}
          <div className="lp-vignette" />

          {/* Centre content */}
          <div className="lp-center">
            <div className="lp-badge">
              <span className="lp-dot-orange" />
              Invite-only beta · Spring 2026
            </div>

            <h1 className="lp-headline">
              Find the <em>humans</em><br />
              behind your<br />
              favourite brands.
            </h1>

            <p className="lp-sub">
              Collabi is outreach for creators. Search thousands of brands,
              see who&apos;s actively spending on marketing, and reach the right
              person in their inbox — all from one place.
            </p>

            {status === "done" ? (
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 56, height: 56, borderRadius: "50%", background: "rgba(75,191,176,0.12)", border: "2px solid rgba(75,191,176,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4BBFB0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, fontWeight: 700, color: "#1A1110", marginBottom: 8 }}>You&apos;re on the list!</p>
                <p style={{ fontSize: 14, color: "#7A736B" }}>We&apos;ll be in touch when Collabi launches.</p>
              </div>
            ) : step === "email" ? (
              <>
                <form onSubmit={handleEmailNext} className="lp-form">
                  <input
                    ref={emailRef}
                    className="lp-email"
                    type="email"
                    placeholder="your@email.com"
                    value={form.email}
                    onChange={set("email")}
                    required
                  />
                  <button className="lp-submit" type="submit">
                    Join waitlist →
                  </button>
                </form>
                <div className="lp-proof">
                  <span className="lp-dot-green" />
                  Joining <strong style={{ color: "#1A1110", marginLeft: 3 }}>1,284</strong>&nbsp;creators already on the list
                </div>
              </>
            ) : (
              <div style={{ width: "100%", maxWidth: 440, background: "rgba(255,255,255,0.9)", border: "1.5px solid rgba(200,185,170,0.45)", borderRadius: 20, padding: "24px 24px 20px", boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                <p style={{ fontSize: 13, color: "#9E9790", marginBottom: 16, fontWeight: 500 }}>
                  Almost there — just a couple more details.
                </p>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                    <input className="lp-field" type="text" placeholder="First name" value={form.first_name} onChange={set("first_name")} required disabled={status === "loading"} />
                    <input className="lp-field" type="text" placeholder="Last name" value={form.last_name} onChange={set("last_name")} required disabled={status === "loading"} />
                  </div>
                  <select className="lp-field lp-select" value={form.niche} onChange={set("niche")} required disabled={status === "loading"}>
                    <option value="" disabled>What do you create?</option>
                    <option value="food">Food & Drink</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="beauty">Beauty & Skincare</option>
                    <option value="fitness">Fitness & Wellness</option>
                    <option value="fashion">Fashion</option>
                    <option value="parenting">Parenting & Family</option>
                    <option value="tech">Tech & Gaming</option>
                    <option value="travel">Travel</option>
                    <option value="finance">Finance & Business</option>
                    <option value="other">Other</option>
                  </select>
                  <button className="lp-submit" type="submit" disabled={status === "loading"} style={{ width: "100%", borderRadius: 12, padding: "13px" }}>
                    {status === "loading" ? "Joining…" : "Complete signup →"}
                  </button>
                  {status === "error" && <p style={{ fontSize: 12, color: "#e05252", textAlign: "center" }}>Something went wrong — please try again.</p>}
                  <p style={{ fontSize: 11, color: "#B5AFA8", textAlign: "center" }}>No spam, ever. Unsubscribe anytime.</p>
                </form>
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className="lp-stats">
            <div className="lp-stat">
              <span className="lp-stat-label">Brands</span>
              <span className="lp-stat-value">18,400+</span>
            </div>
            <div className="lp-stat-div" />
            <div className="lp-stat">
              <span className="lp-stat-label">Verified Contacts</span>
              <span className="lp-stat-value">62K</span>
            </div>
            <div className="lp-stat-div" />
            <div className="lp-stat">
              <span className="lp-stat-label">Meta Ads</span>
              <span className="lp-stat-value">LIVE</span>
            </div>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <div className="lp-features" id="features">
          <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9E9790", marginBottom: 10 }}>Everything you need</p>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 900, color: "#1A1110", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              One platform. Every tool.
            </h2>
          </div>

          <div className="lp-feat-grid">
            {FEATURES.map(f => (
              <div key={f.tag} className="lp-feat-card">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(196,96,58,0.08)", border: "1px solid rgba(196,96,58,0.18)", borderRadius: 100, padding: "4px 12px", marginBottom: 18 }}>
                  <span style={{ fontSize: 13 }}>{f.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#C4603A" }}>{f.tag}</span>
                </div>
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, fontWeight: 700, color: "#1A1110", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 12 }}>
                  {f.title}
                </h3>
                <p style={{ fontSize: 14, color: "#7A736B", lineHeight: 1.7, marginBottom: 20 }}>{f.body}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {f.bullets.map(b => (
                    <div key={b} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(75,191,176,0.12)", border: "1px solid rgba(75,191,176,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#4BBFB0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <span style={{ fontSize: 13, color: "#4B4540", fontWeight: 500 }}>{b}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 60 }}>
            <p style={{ fontSize: 15, color: "#7A736B", marginBottom: 20 }}>Ready to land more brand deals?</p>
            <a
              href="#"
              onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => emailRef.current?.focus(), 600); }}
              style={{ display: "inline-block", background: "#1A1110", color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15, padding: "14px 32px", borderRadius: 100, textDecoration: "none" }}
            >
              Join the waitlist →
            </a>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="lp-footer">
          <span className="lp-logo" style={{ fontSize: 17 }}>collabi</span>
          <span style={{ fontSize: 12, color: "#9E9790" }}>© Collabi 2025</span>
          <div style={{ display: "flex", gap: 20 }}>
            {[["Privacy", "/privacy"], ["Terms", "/terms"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: 12, color: "#9E9790", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#1A1110")}
                onMouseLeave={e => (e.currentTarget.style.color = "#9E9790")}
              >{l}</a>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
