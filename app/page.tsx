"use client";

import { useState, useEffect } from "react";

const NICHES = [
  "food creator",
  "lifestyle influencer",
  "beauty creator",
  "fitness influencer",
  "fashion influencer",
  "parenting creator",
  "tech influencer",
  "travel creator",
];

function useTyping(words: string[], speed = 78, del = 42, pause = 2200) {
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
    body: "A brand actively spending on Meta ads has a live marketing budget. We scan thousands of brands daily and flag who's running ads right now — so you pitch at exactly the right moment.",
    bullets: ["Live ad status for all contacts", "Daily automatic rescans"],
  },
  {
    emoji: "✉️",
    tag: "Email Outreach",
    title: "Personal at scale. Powerful by default.",
    body: "Send campaigns from your own Gmail or Outlook — not a bulk sender with a strange domain. Use merge tags to personalise every line. Get automatic follow-up reminders. Every reply tracked.",
    bullets: ["Sends from your own inbox", "Mass campaigns with personalisation", "Auto follow-up reminders"],
  },
  {
    emoji: "💼",
    tag: "Deal Pipeline",
    title: "First pitch to paid. Nothing gets lost.",
    body: "A visual deal board that shows exactly where every brand conversation stands. Move deals forward, log notes, track deal values. When a brand goes quiet, you'll know — and you'll know when to nudge.",
    bullets: ["Visual Kanban board", "Deal value & stage tracking", "Notes on every conversation"],
  },
];

export default function WaitlistPage() {
  const typed = useTyping(NICHES);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", niche: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");

  function set(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: e.target.value }));
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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@400;500;600&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        body { background: #D4795C; }
        .wl-page {
          min-height: 100vh;
          background: #D4795C;
          font-family: 'Inter', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .wl-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 48px 20px 40px;
          position: relative;
          overflow: hidden;
        }
        .wl-blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(60px);
          pointer-events: none;
        }
        .wl-card {
          background: #FBF7F2;
          border-radius: 28px;
          width: 100%;
          max-width: 980px;
          box-shadow: 0 32px 80px rgba(0,0,0,0.18);
          overflow: hidden;
          display: grid;
          grid-template-columns: 1fr 1fr;
          position: relative;
          z-index: 1;
        }
        @media (max-width: 680px) {
          .wl-card { grid-template-columns: 1fr; }
          .wl-right { border-radius: 0 0 28px 28px !important; }
        }
        .wl-left {
          padding: 52px 48px;
          display: flex;
          flex-direction: column;
          gap: 0;
        }
        @media (max-width: 680px) {
          .wl-left { padding: 36px 28px; }
        }
        .wl-right {
          background: #FFFFFF;
          border-radius: 0 28px 28px 0;
          padding: 52px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        @media (max-width: 680px) {
          .wl-right { padding: 32px 28px; }
        }
        .wl-input, .wl-select {
          width: 100%;
          padding: 13px 16px;
          border: 1.5px solid #E8E2DA;
          border-radius: 12px;
          font-size: 14px;
          font-family: 'Inter', sans-serif;
          color: #1A1A1A;
          background: #FAFAF9;
          outline: none;
          transition: border-color 0.18s, box-shadow 0.18s;
        }
        .wl-input::placeholder { color: #B5AFA8; }
        .wl-input:focus, .wl-select:focus {
          border-color: #4BBFB0;
          box-shadow: 0 0 0 3px rgba(75,191,176,0.12);
          background: #fff;
        }
        .wl-select {
          appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23B5AFA8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          cursor: pointer;
        }
        .wl-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 400px) { .wl-row { grid-template-columns: 1fr; } }
        .wl-label {
          font-size: 11px;
          font-weight: 600;
          color: #9E9790;
          letter-spacing: 0.07em;
          text-transform: uppercase;
          margin-bottom: 6px;
          display: block;
        }
        .wl-btn {
          width: 100%;
          padding: 14px;
          background: #D4795C;
          color: #fff;
          border: none;
          border-radius: 12px;
          font-size: 15px;
          font-weight: 700;
          font-family: 'Sora', sans-serif;
          cursor: pointer;
          transition: background 0.18s, transform 0.15s, box-shadow 0.18s;
        }
        .wl-btn:hover:not(:disabled) {
          background: #BF6849;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(212,121,92,0.35);
        }
        .wl-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .wl-cursor {
          display: inline-block;
          width: 3px;
          height: 1em;
          background: #D4795C;
          margin-left: 2px;
          vertical-align: text-bottom;
          border-radius: 2px;
          animation: wl-blink 1s step-end infinite;
        }
        @keyframes wl-blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes wl-pulse { 0%,100%{opacity:1} 50%{opacity:0.35} }
        @keyframes wl-bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(6px)} }

        /* Features section */
        .wl-features { background: #C96B4E; padding: 80px 20px; }
        .wl-feat-grid {
          max-width: 980px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        @media (max-width: 640px) { .wl-feat-grid { grid-template-columns: 1fr; } }
        .wl-feat-card {
          background: #FBF7F2;
          border-radius: 24px;
          padding: 32px;
          border: 1px solid rgba(255,255,255,0.6);
        }
      `}</style>

      <div className="wl-page">

        {/* ── HERO ── */}
        <div className="wl-hero">
          <div className="wl-blob" style={{ width: 400, height: 400, background: "rgba(255,180,140,0.3)", top: "-10%", left: "-6%" }} />
          <div className="wl-blob" style={{ width: 300, height: 300, background: "rgba(75,191,176,0.15)", bottom: "5%", right: "-4%" }} />

          <div className="wl-card">

            {/* LEFT */}
            <div className="wl-left">
              {/* Logo */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 40 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#D4795C", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9"/>
                    <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
                    <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em" }}>Collabi</span>
              </div>

              {/* Headline */}
              <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(28px, 3.2vw, 42px)", fontWeight: 800, color: "#1A1A1A", lineHeight: 1.12, letterSpacing: "-0.035em", marginBottom: 16 }}>
                Land more brand<br />
                deals as a<br />
                <span style={{ color: "#D4795C" }}>{typed}<span className="wl-cursor" /></span>
              </h1>

              <p style={{ fontSize: 15, color: "#7A736B", lineHeight: 1.7, marginBottom: 8, maxWidth: 360 }}>
                10,000+ verified brand contacts, email outreach, deal tracking, and Meta ad intelligence — in one place.
              </p>

              <p style={{ fontSize: 13, color: "#4BBFB0", fontWeight: 600, marginBottom: 0 }}>
                Scroll down for more features ↓
              </p>

              {/* Divider */}
              <div style={{ height: 1, background: "#EDE8E1", margin: "32px 0" }} />

              {/* Feature bullets */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  "10,000+ verified brand contacts",
                  "Email campaigns from your own inbox",
                  "Meta ad intelligence — pitch at the right time",
                  "Visual deal pipeline — first pitch to paid",
                ].map(b => (
                  <div key={b} style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                    <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(75,191,176,0.15)", border: "1px solid rgba(75,191,176,0.3)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#4BBFB0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <span style={{ fontSize: 13, color: "#4B4540", lineHeight: 1.5 }}>{b}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT */}
            <div className="wl-right">
              {status === "done" ? (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(75,191,176,0.12)", border: "2px solid rgba(75,191,176,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4BBFB0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 24, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em", marginBottom: 10 }}>
                    You&apos;re on the list!
                  </h2>
                  <p style={{ fontSize: 14, color: "#9E9790", lineHeight: 1.6 }}>
                    We&apos;ll email you as soon as Collabi is ready.<br />Stay tuned — it&apos;s going to be good.
                  </p>
                </div>
              ) : (
                <>
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.035em", marginBottom: 6, lineHeight: 1.15 }}>
                    Join the waitlist
                  </h2>
                  <p style={{ fontSize: 15, color: "#7A736B", marginBottom: 28, fontWeight: 500 }}>Be first to know when we launch.</p>

                  <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div className="wl-row">
                      <div>
                        <label className="wl-label">First name</label>
                        <input className="wl-input" type="text" placeholder="Jane" value={form.first_name} onChange={set("first_name")} required disabled={status === "loading"} />
                      </div>
                      <div>
                        <label className="wl-label">Last name</label>
                        <input className="wl-input" type="text" placeholder="Smith" value={form.last_name} onChange={set("last_name")} required disabled={status === "loading"} />
                      </div>
                    </div>

                    <div>
                      <label className="wl-label">Email address</label>
                      <input className="wl-input" type="email" placeholder="jane@example.com" value={form.email} onChange={set("email")} required disabled={status === "loading"} />
                    </div>

                    <div>
                      <label className="wl-label">What do you create?</label>
                      <select className="wl-select" value={form.niche} onChange={set("niche")} required disabled={status === "loading"}>
                        <option value="" disabled>Select your niche...</option>
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
                    </div>

                    <button className="wl-btn" type="submit" disabled={status === "loading"} style={{ marginTop: 4 }}>
                      {status === "loading" ? "Joining..." : "Join the waitlist →"}
                    </button>

                    {status === "error" && (
                      <p style={{ fontSize: 13, color: "#e05252", textAlign: "center" }}>Something went wrong — please try again.</p>
                    )}

                    <p style={{ fontSize: 12, color: "#B5AFA8", textAlign: "center" }}>No spam, ever. Unsubscribe anytime.</p>
                  </form>
                </>
              )}
            </div>

          </div>

          {/* Scroll nudge */}
          <div style={{ marginTop: 28, display: "flex", flexDirection: "column", alignItems: "center", gap: 6, opacity: 0.7 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.8)", fontWeight: 600, letterSpacing: "0.05em" }}>SCROLL TO EXPLORE</span>
            <svg style={{ animation: "wl-bounce 1.6s ease-in-out infinite" }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <div className="wl-features">
          <div style={{ maxWidth: 980, margin: "0 auto 56px", textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)", marginBottom: 10 }}>Everything you need</p>
            <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(28px, 3.5vw, 42px)", fontWeight: 800, color: "#fff", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
              One platform. Every tool.
            </h2>
          </div>

          <div className="wl-feat-grid">
            {FEATURES.map(f => (
              <div key={f.tag} className="wl-feat-card">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(212,121,92,0.1)", border: "1px solid rgba(212,121,92,0.2)", borderRadius: 100, padding: "4px 12px", marginBottom: 18 }}>
                  <span style={{ fontSize: 13 }}>{f.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#D4795C" }}>{f.tag}</span>
                </div>
                <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 12 }}>
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

          {/* Bottom CTA */}
          <div style={{ textAlign: "center", marginTop: 56 }}>
            <p style={{ fontSize: 15, color: "rgba(255,255,255,0.7)", marginBottom: 20 }}>Ready to land more brand deals?</p>
            <a
              href="#"
              onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              style={{ display: "inline-block", background: "#fff", color: "#D4795C", fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 15, padding: "14px 32px", borderRadius: 14, textDecoration: "none", letterSpacing: "-0.01em", boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
            >
              Join the waitlist →
            </a>
          </div>
        </div>

        {/* Footer */}
        <div style={{ background: "#BF6849", padding: "24px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>© Collabi 2025</span>
          <div style={{ display: "flex", gap: 20 }}>
            {[["Privacy", "/privacy"], ["Terms", "/terms"]].map(([l, h]) => (
              <a key={l} href={h} style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textDecoration: "none" }}
                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
              >{l}</a>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
