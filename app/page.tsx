"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

function AppMockup() {
  const deals = [
    { brand: "Innocent Drinks", value: "£2,400", status: "Negotiating", color: "#F59E0B" },
    { brand: "Graze", value: "£1,200", status: "Replied", color: "#6366F1" },
    { brand: "Oatly", value: "£3,500", status: "Contracted", color: "#8B5CF6" },
    { brand: "M&S Food", value: "£800", status: "Pitched", color: "#3B82F6" },
  ];
  return (
    <div style={{ background: "linear-gradient(135deg, #0D1B2A 0%, #162540 100%)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "16px", overflow: "hidden", boxShadow: "0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)" }}>
      {/* Window chrome */}
      <div style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "12px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FF5F57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#FEBC2E" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28C840" }} />
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ display: "inline-block", background: "rgba(255,255,255,0.05)", borderRadius: "6px", padding: "2px 16px", fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>
            app.collabi.io/dashboard
          </div>
        </div>
      </div>
      {/* Content */}
      <div style={{ display: "flex", height: "360px" }}>
        {/* Sidebar */}
        <div style={{ width: "52px", background: "rgba(255,255,255,0.02)", borderRight: "1px solid rgba(255,255,255,0.06)", padding: "16px 0", display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          {[
            { active: true, d: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" },
            { active: false, d: "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" },
            { active: false, d: "M22 6L12 13 2 6M2 6h20v14a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" },
            { active: false, d: "M18 20V10M12 20V4M6 20v-6" },
          ].map((item, i) => (
            <div key={i} style={{ width: 32, height: 32, borderRadius: 8, background: item.active ? "rgba(232,98,42,0.2)" : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={item.active ? "#E8622A" : "rgba(255,255,255,0.25)"} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.d} />
              </svg>
            </div>
          ))}
        </div>
        {/* Main */}
        <div style={{ flex: 1, padding: "16px", overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", marginBottom: "16px" }}>
            {[{ label: "Contacts", value: "1,293" }, { label: "Emails Sent", value: "47" }, { label: "Active Deals", value: "8" }].map(s => (
              <div key={s.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "10px 12px", border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: "10px", color: "rgba(255,255,255,0.35)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.06em" }}>{s.label}</p>
                <p style={{ fontSize: "18px", fontWeight: 800, color: "white", lineHeight: 1 }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <p style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Deal Pipeline</p>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8622A" }} />
              <p style={{ fontSize: "10px", color: "#E8622A" }}>4 active</p>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            {deals.map(deal => (
              <div key={deal.brand} style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", padding: "7px 10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div style={{ width: 26, height: 26, borderRadius: 6, background: `${deal.color}22`, border: `1px solid ${deal.color}44`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <p style={{ fontSize: "10px", fontWeight: 800, color: deal.color }}>{deal.brand[0]}</p>
                </div>
                <p style={{ flex: 1, fontSize: "11px", fontWeight: 600, color: "rgba(255,255,255,0.8)", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{deal.brand}</p>
                <p style={{ fontSize: "11px", fontWeight: 700, color: "#10B981", flexShrink: 0 }}>{deal.value}</p>
                <div style={{ padding: "2px 7px", borderRadius: "20px", background: `${deal.color}18`, border: `1px solid ${deal.color}40`, flexShrink: 0 }}>
                  <p style={{ fontSize: "9px", fontWeight: 700, color: deal.color }}>{deal.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const FEATURES = [
  {
    title: "1,200+ Brand Contacts",
    desc: "Ready-to-use database of food, drink, lifestyle and more brand marketing contacts. No cold prospecting, no hunting down emails.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
      </svg>
    ),
  },
  {
    title: "Email Outreach",
    desc: "Send personalised campaigns from your Gmail or Outlook. Track every reply, and get automatic follow-up reminders.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
      </svg>
    ),
  },
  {
    title: "Deal Pipeline",
    desc: "Track every brand conversation from first pitch to paid. Visual pipeline board. Never let a deal fall through the cracks.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
      </svg>
    ),
  },
  {
    title: "Meta Ad Intelligence",
    desc: "See which brands are actively running ads right now. Pitch them when their budget is live — and your message actually lands.",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
      </svg>
    ),
  },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const features = useInView(0.1);
  const pricing = useInView(0.1);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');
        .cl-landing { font-family: 'DM Sans', sans-serif; background: #0D1B2A; color: #fff; }
        .cl-display { font-family: 'Syne', sans-serif; }
        .cl-nav-blur { backdrop-filter: blur(20px); background: rgba(13,27,42,0.85); border-bottom: 1px solid rgba(255,255,255,0.07); }
        .cl-hero-grid {
          background-image: linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
          background-size: 52px 52px;
        }
        .cl-glow { box-shadow: 0 0 40px rgba(232,98,42,0.25), 0 0 80px rgba(232,98,42,0.1); }
        .cl-card-hover { transition: transform 0.3s ease, border-color 0.3s ease; }
        .cl-card-hover:hover { transform: translateY(-5px); border-color: rgba(232,98,42,0.25) !important; }
        .cl-fade { opacity: 0; transform: translateY(28px); transition: opacity 0.65s ease, transform 0.65s ease; }
        .cl-fade.in { opacity: 1; transform: translateY(0); }
        .cl-float { animation: cl-float 7s ease-in-out infinite; }
        @keyframes cl-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-14px); } }
        .cl-pulse { animation: cl-pulse 2.5s ease-in-out infinite; }
        @keyframes cl-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.35; } }
        .cl-gradient-text { background: linear-gradient(135deg, #fff 30%, rgba(255,255,255,0.65) 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .cl-coral-text { background: linear-gradient(135deg, #E8622A 0%, #F59E0B 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .cl-btn-primary { background: #E8622A; color: #fff; transition: background 0.2s ease, transform 0.15s ease; }
        .cl-btn-primary:hover { background: #d45520; transform: translateY(-1px); }
        .cl-btn-ghost { background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); color: rgba(255,255,255,0.8); transition: background 0.2s ease; }
        .cl-btn-ghost:hover { background: rgba(255,255,255,0.1); }
        @media (max-width: 768px) {
          .cl-hero-grid-cols { grid-template-columns: 1fr !important; }
          .cl-mockup-col { display: none !important; }
          .cl-feat-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div className="cl-landing">

        {/* NAV */}
        <nav className={`cl-nav ${scrolled ? "cl-nav-blur" : ""}`} style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 50, transition: "all 0.3s" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 32, height: 32, background: "#E8622A", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <span className="cl-display" style={{ fontSize: 18, fontWeight: 700 }}>Collabi</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Link href="/sign-in" className="cl-btn-ghost" style={{ fontSize: 14, fontWeight: 500, textDecoration: "none", padding: "8px 18px", borderRadius: 8, display: "inline-block" }}>
                Sign in
              </Link>
              <Link href="/sign-up" className="cl-btn-primary cl-glow" style={{ fontSize: 14, fontWeight: 600, textDecoration: "none", padding: "8px 20px", borderRadius: 8, display: "inline-block" }}>
                Start free trial
              </Link>
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section className="cl-hero-grid" style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "120px 24px 80px", position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #0D1B2A 0%, #162540 55%, #0D1B2A 100%)" }}>
          {/* ambient glow */}
          <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)", width: 700, height: 350, background: "radial-gradient(ellipse, rgba(232,98,42,0.1) 0%, transparent 70%)", pointerEvents: "none" }} />

          <div className="cl-hero-grid-cols" style={{ maxWidth: 1160, width: "100%", margin: "0 auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 72, alignItems: "center" }}>

            {/* Copy */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(232,98,42,0.1)", border: "1px solid rgba(232,98,42,0.25)", borderRadius: 100, padding: "5px 14px", marginBottom: 28 }}>
                <div className="cl-pulse" style={{ width: 7, height: 7, borderRadius: "50%", background: "#E8622A" }} />
                <span style={{ fontSize: 11, color: "#E8622A", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>Now in Early Access</span>
              </div>

              <h1 className="cl-display" style={{ fontSize: "clamp(38px, 5vw, 62px)", fontWeight: 800, lineHeight: 1.06, marginBottom: 22, letterSpacing: "-0.035em" }}>
                <span className="cl-gradient-text">Land more brand deals.</span><br />
                <span className="cl-coral-text">Less chasing,</span><br />
                <span className="cl-gradient-text">more closing.</span>
              </h1>

              <p style={{ fontSize: 17, color: "rgba(255,255,255,0.5)", lineHeight: 1.75, marginBottom: 40, maxWidth: 440, fontWeight: 400 }}>
                The outreach platform built for influencers — 1,200+ brand contacts, email campaigns, deal tracking, and Meta ad intelligence, all in one place.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <Link href="/sign-up" className="cl-btn-primary cl-glow" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", padding: "13px 26px", borderRadius: 10, fontSize: 15, fontWeight: 700 }}>
                  Start 7-day free trial
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12h14M12 5l7 7-7 7"/>
                  </svg>
                </Link>
                <Link href="/sign-in" className="cl-btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 8, textDecoration: "none", padding: "13px 22px", borderRadius: 10, fontSize: 15, fontWeight: 500 }}>
                  Sign in
                </Link>
              </div>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", letterSpacing: "0.01em" }}>No card required · Cancel anytime · £29/month after trial</p>
            </div>

            {/* Mockup */}
            <div className="cl-mockup-col cl-float" style={{ position: "relative" }}>
              <AppMockup />
              <div style={{ position: "absolute", bottom: -14, left: -20, background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.28)", borderRadius: 12, padding: "10px 16px", backdropFilter: "blur(12px)" }}>
                <p style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginBottom: 2 }}>Latest deal closed</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#10B981" }}>Innocent Drinks · £2,400</p>
              </div>
            </div>
          </div>
        </section>

        {/* STATS BAR */}
        <div style={{ background: "rgba(255,255,255,0.025)", borderTop: "1px solid rgba(255,255,255,0.07)", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "30px 24px" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap", gap: "40px 56px" }}>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>Join influencers already using Collabi</p>
            <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.08)" }} />
            {[
              { val: "1,293", label: "brand contacts" },
              { val: "3.2×", label: "avg reply rate" },
              { val: "£0", label: "cold prospecting" },
            ].map(s => (
              <div key={s.label} style={{ textAlign: "center" }}>
                <p className="cl-display" style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1 }}>{s.val}</p>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 4 }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* FEATURES */}
        <section ref={features.ref} style={{ padding: "100px 24px", background: "#0D1B2A" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto" }}>
            <div className={`cl-fade ${features.inView ? "in" : ""}`} style={{ textAlign: "center", marginBottom: 60 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#E8622A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Everything you need</p>
              <h2 className="cl-display cl-gradient-text" style={{ fontSize: "clamp(30px, 4vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                Built for the business side<br />of being a creator
              </h2>
            </div>

            <div className="cl-feat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 18 }}>
              {FEATURES.map((f, i) => (
                <div
                  key={f.title}
                  className={`cl-card-hover cl-fade ${features.inView ? "in" : ""}`}
                  style={{
                    background: "linear-gradient(135deg, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.02) 100%)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 16,
                    padding: "32px 28px",
                    transitionDelay: `${i * 0.1}s`,
                  }}
                >
                  <div style={{ width: 46, height: 46, borderRadius: 11, background: "rgba(232,98,42,0.12)", border: "1px solid rgba(232,98,42,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#E8622A", marginBottom: 20 }}>
                    {f.icon}
                  </div>
                  <h3 className="cl-display" style={{ fontSize: 19, fontWeight: 700, color: "#fff", marginBottom: 10, letterSpacing: "-0.02em" }}>{f.title}</h3>
                  <p style={{ fontSize: 15, color: "rgba(255,255,255,0.48)", lineHeight: 1.75 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section ref={pricing.ref} style={{ padding: "100px 24px", background: "linear-gradient(180deg, #0D1B2A 0%, #162540 100%)" }}>
          <div style={{ maxWidth: 480, margin: "0 auto", textAlign: "center" }}>
            <div className={`cl-fade ${pricing.inView ? "in" : ""}`}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#E8622A", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14 }}>Pricing</p>
              <h2 className="cl-display cl-gradient-text" style={{ fontSize: "clamp(30px, 4vw, 46px)", fontWeight: 800, letterSpacing: "-0.03em", marginBottom: 48 }}>
                Simple, honest pricing
              </h2>

              <div className="cl-glow" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.03) 100%)", border: "1px solid rgba(232,98,42,0.28)", borderRadius: 20, padding: "44px 36px" }}>
                <div style={{ marginBottom: 6 }}>
                  <span className="cl-display" style={{ fontSize: 64, fontWeight: 800, color: "#fff", letterSpacing: "-0.045em" }}>£29</span>
                  <span style={{ fontSize: 18, color: "rgba(255,255,255,0.35)", marginLeft: 4 }}>/month</span>
                </div>
                <p style={{ fontSize: 14, color: "rgba(255,255,255,0.35)", marginBottom: 32 }}>Everything included. No tiers, no add-ons.</p>

                <div style={{ display: "flex", flexDirection: "column", gap: 11, marginBottom: 36, textAlign: "left" }}>
                  {[
                    "1,293 brand contacts, all niches",
                    "Unlimited email campaigns",
                    "Deal pipeline & tracking",
                    "Meta Ad intelligence",
                    "Gmail & Outlook integration",
                    "Media kit generator",
                  ].map(item => (
                    <div key={item} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.35)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                      </div>
                      <span style={{ fontSize: 14, color: "rgba(255,255,255,0.65)" }}>{item}</span>
                    </div>
                  ))}
                </div>

                <Link href="/sign-up" className="cl-btn-primary" style={{ display: "block", textDecoration: "none", padding: "15px", borderRadius: 10, fontSize: 16, fontWeight: 700, textAlign: "center", marginBottom: 14 }}>
                  Start 7-day free trial
                </Link>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.28)" }}>7-day free trial · No card required · Cancel anytime</p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "28px 24px", background: "#0D1B2A" }}>
          <div style={{ maxWidth: 1160, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 24, height: 24, background: "#E8622A", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
                </svg>
              </div>
              <span className="cl-display" style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.4)" }}>Collabi © 2025</span>
            </div>
            <div style={{ display: "flex", gap: 24 }}>
              <Link href="/sign-in" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Sign in</Link>
              <Link href="/sign-up" style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", textDecoration: "none" }}>Sign up</Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
