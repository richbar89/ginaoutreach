"use client";

import { useState } from "react";

export default function WaitlistPage() {
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
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          position: relative;
          overflow: hidden;
        }
        /* Floating blob decorations */
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
          .wl-card-right { display: none !important; }
        }
        /* Left panel */
        .wl-left {
          padding: 52px 48px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 580px;
        }
        @media (max-width: 680px) {
          .wl-left { padding: 36px 28px; min-height: unset; }
        }
        /* Right panel */
        .wl-right {
          background: #FFFFFF;
          border-radius: 0 28px 28px 0;
          padding: 52px 44px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        /* Form fields */
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
        .wl-select:invalid, .wl-select option[value=""] { color: #B5AFA8; }
        .wl-row { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
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
          letter-spacing: -0.01em;
        }
        .wl-btn:hover:not(:disabled) {
          background: #BF6849;
          transform: translateY(-1px);
          box-shadow: 0 8px 24px rgba(212,121,92,0.35);
        }
        .wl-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        /* Stat pill */
        .wl-stat {
          display: flex;
          flex-direction: column;
        }
        .wl-stat-num {
          font-family: 'Sora', sans-serif;
          font-size: 28px;
          font-weight: 800;
          color: #1A1A1A;
          letter-spacing: -0.04em;
          line-height: 1;
        }
        .wl-stat-label {
          font-size: 12px;
          color: #9E9790;
          margin-top: 3px;
          font-weight: 500;
        }
        @keyframes wl-pulse { 0%,100%{opacity:1}50%{opacity:0.35} }
        @keyframes wl-float { 0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)} }
      `}</style>

      <div className="wl-page">

        {/* Background blobs */}
        <div className="wl-blob" style={{ width: 400, height: 400, background: "rgba(255,180,140,0.35)", top: "-10%", left: "-8%" }} />
        <div className="wl-blob" style={{ width: 300, height: 300, background: "rgba(75,191,176,0.2)", bottom: "5%", right: "-5%" }} />
        <div className="wl-blob" style={{ width: 200, height: 200, background: "rgba(255,210,160,0.3)", bottom: "20%", left: "5%" }} />

        <div className="wl-card">

          {/* ── LEFT PANEL ── */}
          <div className="wl-left">

            {/* Logo */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 44 }}>
                {/* Logo mark */}
                <div style={{ width: 34, height: 34, borderRadius: 10, background: "#D4795C", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="white" opacity="0.9"/>
                    <path d="M2 17l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.7"/>
                    <path d="M2 12l10 5 10-5" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                  </svg>
                </div>
                <span style={{ fontFamily: "'Sora', sans-serif", fontSize: 20, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em" }}>Collabi</span>
              </div>

              {/* Heading */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(75,191,176,0.12)", border: "1px solid rgba(75,191,176,0.25)", borderRadius: 100, padding: "4px 12px", marginBottom: 20 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#4BBFB0", animation: "wl-pulse 2s infinite" }} />
                <span style={{ fontSize: 11, color: "#4BBFB0", fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase" as const }}>Coming soon</span>
              </div>

              <h1 style={{ fontFamily: "'Sora', sans-serif", fontSize: "clamp(32px, 3.5vw, 44px)", fontWeight: 800, color: "#1A1A1A", lineHeight: 1.12, letterSpacing: "-0.035em", marginBottom: 16 }}>
                Land more<br />
                brand deals.<br />
                <span style={{ color: "#D4795C" }}>Built for creators.</span>
              </h1>

              <p style={{ fontSize: 15, color: "#7A736B", lineHeight: 1.7, marginBottom: 40, maxWidth: 340 }}>
                10,000+ verified brand contacts, email outreach, deal tracking, and Meta ad intelligence — in one place.
              </p>
            </div>

            {/* Stats */}
            <div>
              <div style={{ height: 1, background: "#EDE8E1", marginBottom: 28 }} />
              <div style={{ display: "flex", gap: 36, flexWrap: "wrap" }}>
                <div className="wl-stat">
                  <span className="wl-stat-num">10k+</span>
                  <span className="wl-stat-label">Brand contacts</span>
                </div>
                <div className="wl-stat">
                  <span className="wl-stat-num">£29</span>
                  <span className="wl-stat-label">Per month at launch</span>
                </div>
                <div className="wl-stat">
                  <span className="wl-stat-num" style={{ color: "#4BBFB0" }}>Free</span>
                  <span className="wl-stat-label">7-day trial</span>
                </div>
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL ── */}
          <div className="wl-right" style={{ display: "flex" } as React.CSSProperties}>

            {/* Decorative arcs — top right corner, like Crowz */}
            <svg
              style={{ position: "absolute", top: -20, right: -20, pointerEvents: "none", opacity: 0.85, animation: "wl-float 7s ease-in-out infinite" }}
              width="200" height="200" viewBox="0 0 200 200" fill="none"
            >
              <path d="M 160 20 A 100 100 0 0 1 180 160" stroke="#4BBFB0" strokeWidth="10" strokeLinecap="round" fill="none"/>
              <path d="M 145 10 A 120 120 0 0 1 190 175" stroke="#F5A623" strokeWidth="10" strokeLinecap="round" fill="none"/>
              <path d="M 130 5 A 140 140 0 0 1 195 188" stroke="#3D3530" strokeWidth="10" strokeLinecap="round" fill="none"/>
            </svg>

            {/* Teal circle accent — bottom left */}
            <div style={{ position: "absolute", bottom: 32, left: 32, width: 52, height: 52, borderRadius: "50%", background: "rgba(75,191,176,0.1)", border: "2px solid rgba(75,191,176,0.2)" }} />
            <div style={{ position: "absolute", bottom: 44, left: 44, width: 28, height: 28, borderRadius: "50%", background: "rgba(75,191,176,0.18)" }} />

            <div style={{ position: "relative", zIndex: 1, width: "100%" }}>

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
                  <h2 style={{ fontFamily: "'Sora', sans-serif", fontSize: 22, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em", marginBottom: 6 }}>
                    Join the waitlist
                  </h2>
                  <p style={{ fontSize: 13, color: "#9E9790", marginBottom: 28 }}>Be first to know when we launch.</p>

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

        </div>

        {/* Footer */}
        <div style={{ marginTop: 24, display: "flex", gap: 20, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", fontWeight: 600 }}>© Collabi 2025</span>
          {[["Privacy", "/privacy"], ["Terms", "/terms"]].map(([l, h]) => (
            <a key={l} href={h} style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", textDecoration: "none", transition: "color 0.15s" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
              onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.45)")}
            >{l}</a>
          ))}
        </div>

      </div>
    </>
  );
}
