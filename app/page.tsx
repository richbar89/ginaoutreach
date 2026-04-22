"use client";
import { useState, useEffect, useRef } from "react";

type Brand = { name: string; category: string; country: string; domain?: string };


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

const FALLBACKS: Brand[] = [
  { name: "Nike", category: "Fashion", country: "US", domain: "nike.com" },
  { name: "Gymshark", category: "Fitness", country: "UK", domain: "gymshark.com" },
  { name: "Glossier", category: "Beauty", country: "US", domain: "glossier.com" },
  { name: "Oatly", category: "Food", country: "Sweden", domain: "oatly.com" },
  { name: "Allbirds", category: "Fashion", country: "US", domain: "allbirds.com" },
  { name: "Notion", category: "Tech", country: "US", domain: "notion.so" },
  { name: "Lush", category: "Beauty", country: "UK", domain: "lush.com" },
  { name: "Patagonia", category: "Lifestyle", country: "US", domain: "patagonia.com" },
  { name: "BrewDog", category: "Food", country: "UK", domain: "brewdog.com" },
  { name: "Monzo", category: "Fintech", country: "UK", domain: "monzo.com" },
  { name: "Innocent", category: "Food", country: "UK", domain: "innocentdrinks.co.uk" },
  { name: "Revolut", category: "Fintech", country: "UK", domain: "revolut.com" },
  { name: "Aesop", category: "Beauty", country: "Australia", domain: "aesop.com" },
  { name: "Headspace", category: "Wellness", country: "US", domain: "headspace.com" },
  { name: "Fever-Tree", category: "Food", country: "UK", domain: "fever-tree.com" },
  { name: "Depop", category: "Fashion", country: "UK", domain: "depop.com" },
  { name: "Peloton", category: "Fitness", country: "US", domain: "onepeloton.com" },
  { name: "Rapha", category: "Fitness", country: "UK", domain: "rapha.cc" },
  { name: "Graze", category: "Food", country: "UK", domain: "graze.com" },
  { name: "Calm", category: "Wellness", country: "US", domain: "calm.com" },
  { name: "Butternut Box", category: "Food", country: "UK", domain: "butternutbox.com" },
  { name: "Wild", category: "Beauty", country: "UK", domain: "wearewild.com" },
  { name: "Huel", category: "Food", country: "UK", domain: "huel.com" },
  { name: "Duolingo", category: "Tech", country: "US", domain: "duolingo.com" },
  { name: "Pact Coffee", category: "Food", country: "UK", domain: "pactcoffee.com" },
  { name: "Finisterre", category: "Fashion", country: "UK", domain: "finisterre.com" },
  { name: "Ohh Deer", category: "Lifestyle", country: "UK", domain: "ohhdeer.com" },
  { name: "Papier", category: "Lifestyle", country: "UK", domain: "papier.com" },
  { name: "Bloom & Wild", category: "Lifestyle", country: "UK", domain: "bloomandwild.com" },
  { name: "Dash Water", category: "Food", country: "UK", domain: "drinkdash.com" },
  { name: "Passenger", category: "Fashion", country: "UK", domain: "passenger-clothing.com" },
  { name: "Seedlip", category: "Food", country: "UK", domain: "seedlipdrinks.com" },
  { name: "Heights", category: "Wellness", country: "UK", domain: "yourheights.com" },
  { name: "Ned's Neon", category: "Lifestyle", country: "UK", domain: "nedsneon.com" },
  { name: "Represent", category: "Fashion", country: "UK", domain: "representclo.com" },
  { name: "Form Nutrition", category: "Fitness", country: "UK", domain: "formnutrition.com" },
];

const NUM_ROWS = 7;
const DURATIONS = [190, 225, 200, 240, 210, 185, 215];

function getRowBrands(all: Brand[], row: number): Brand[] {
  if (all.length === 0) return [];
  const offset = Math.floor((row * all.length) / NUM_ROWS) % all.length;
  const rotated = [...all.slice(offset), ...all.slice(0, offset)];
  return rotated.slice(0, 7);
}

const FEATURES = [
  {
    emoji: "📋",
    tag: "Brand Contacts",
    title: "10,000+ verified contacts",
    body: "Every contact is a real, verified marketing decision-maker at a brand you'd love to work with. Filtered by category, contactable in one click.",
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
    body: "Send campaigns from your own Gmail or Outlook. Use merge tags to personalise every line. Every reply tracked.",
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

function BrandCard({ brand }: { brand: Brand }) {
  const col = avatarColor(brand.name);
  const letter = brand.name[0]?.toUpperCase() ?? "?";
  const sub = [brand.category, brand.country].filter(Boolean).join(" · ");
  const [logoFailed, setLogoFailed] = useState(false);
  const showLogo = !!brand.domain && !logoFailed;

  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 11,
      background: "rgba(255,255,255,0.68)", border: "1px solid rgba(200,185,170,0.26)",
      borderRadius: 14, padding: "9px 16px", flexShrink: 0,
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0, overflow: "hidden",
        background: showLogo ? "#fff" : col.bg,
        display: "flex", alignItems: "center", justifyContent: "center",
        border: showLogo ? "1px solid rgba(0,0,0,0.06)" : "none",
      }}>
        {showLogo ? (
          <img
            src={`https://logo.clearbit.com/${brand.domain}`}
            alt={brand.name}
            width={32} height={32}
            style={{ objectFit: "contain", width: 32, height: 32 }}
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span style={{ fontSize: 15, fontWeight: 700, color: col.fg, fontFamily: "'Inter', sans-serif" }}>{letter}</span>
        )}
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1110", lineHeight: 1.3, whiteSpace: "nowrap" }}>{brand.name}</div>
        {sub && <div style={{ fontSize: 11, color: "#9E9790", lineHeight: 1.3, whiteSpace: "nowrap" }}>{sub}</div>}
      </div>
    </div>
  );
}

function ScrollRow({ brands, direction, duration }: { brands: Brand[]; direction: "left" | "right"; duration: number }) {
  const items = [...brands, ...brands];
  return (
    <div style={{ overflow: "hidden", width: "100%", flexShrink: 0 }}>
      <div style={{
        display: "flex", gap: 80, width: "max-content",
        willChange: "transform",
        animation: `${direction === "left" ? "lp-sl" : "lp-sr"} ${duration}s linear infinite`,
      }}>
        {items.map((b, i) => <BrandCard key={i} brand={b} />)}
      </div>
    </div>
  );
}

export default function WaitlistPage() {
  const [form, setForm] = useState({ email: "", first_name: "", last_name: "", niche: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [brands, setBrands] = useState<Brand[]>(FALLBACKS);
  const glowRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

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
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400;1,600&family=Inter:wght@400;500;600;700&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #F5F0EA; }
        .lp { font-family: 'Inter', sans-serif; -webkit-font-smoothing: antialiased; background: #F5F0EA; }

        /* Hero */
        .lp-hero {
          position: relative; min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }

        /* Background rows */
        .lp-bg-rows {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          display: flex; flex-direction: column; justify-content: center;
          gap: 68px; padding: 40px 0;
          pointer-events: none; user-select: none; overflow: hidden;
        }

        @keyframes lp-sl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes lp-sr { from { transform: translateX(-50%); } to { transform: translateX(0); } }

        /* Strong centre vignette for readability */
        .lp-vignette {
          position: absolute; inset: 0; pointer-events: none; z-index: 2;
          background: radial-gradient(ellipse 52% 62% at 50% 50%,
            rgba(245,240,234,0.97) 0%,
            rgba(245,240,234,0.82) 32%,
            rgba(245,240,234,0.38) 58%,
            transparent 80%
          );
        }

        /* Orange cursor glow */
        .lp-glow {
          position: fixed; width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(200,96,58,0.28) 0%, rgba(200,96,58,0.1) 45%, transparent 70%);
          filter: blur(36px); transform: translate(-50%, -50%);
          pointer-events: none; z-index: 5; will-change: left, top;
          left: 50%; top: 50%;
        }

        /* Centre content */
        .lp-center {
          position: relative; z-index: 10;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 56px 24px 64px; max-width: 680px; width: 100%;
        }

        /* Logo — big, centred */
        .lp-logo {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: clamp(52px, 8vw, 80px);
          font-weight: 600; letter-spacing: -0.04em; line-height: 1;
          background: linear-gradient(to right, #FF8C42, #C4603A);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; margin-bottom: 20px;
          filter: drop-shadow(0 2px 16px rgba(196,96,58,0.35));
        }

        /* Badge */
        .lp-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: rgba(255,255,255,0.82); border: 1px solid rgba(200,185,170,0.38);
          border-radius: 100px; padding: 6px 14px;
          font-size: 12px; font-weight: 500; color: #6B6560;
          margin-bottom: 22px; letter-spacing: 0.01em;
        }
        .lp-dot-o { width: 7px; height: 7px; border-radius: 50%; background: #C4603A; flex-shrink: 0; }

        /* Headline */
        .lp-hl {
          font-family: 'Playfair Display', serif;
          font-size: clamp(36px, 5.5vw, 64px);
          font-weight: 900; color: #1A1110; line-height: 1.08;
          letter-spacing: -0.02em; margin-bottom: 18px;
        }
        .lp-hl em { font-style: italic; font-weight: 400; color: #C4603A; }

        /* Sub-heading */
        .lp-sub {
          font-size: 15px; color: #6B6560; line-height: 1.7;
          max-width: 480px; margin-bottom: 32px;
        }

        /* Form card */
        .lp-card {
          width: 100%; max-width: 400px;
          background: rgba(255,255,255,0.92);
          border: 1.5px solid rgba(200,185,170,0.42);
          border-radius: 20px; padding: 22px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.08);
          margin-bottom: 16px;
        }
        .lp-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .lp-field {
          width: 100%; padding: 11px 14px;
          border: 1.5px solid #E8E2DA; border-radius: 11px;
          font-size: 14px; font-family: 'Inter', sans-serif; color: #1A1110;
          background: #FAFAF9; outline: none;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .lp-field::placeholder { color: #B5AFA8; }
        .lp-field:focus { border-color: #C4603A; box-shadow: 0 0 0 3px rgba(196,96,58,0.09); background: #fff; }
        .lp-sel {
          appearance: none; cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23B5AFA8' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
          background-repeat: no-repeat; background-position: right 14px center;
        }
        .lp-btn {
          width: 100%; padding: 13px;
          background: #1A1110; color: #fff; border: none; border-radius: 11px;
          font-size: 14px; font-weight: 600; font-family: 'Inter', sans-serif;
          cursor: pointer; transition: background 0.14s, transform 0.12s;
        }
        .lp-btn:hover:not(:disabled) { background: #333; transform: translateY(-1px); }
        .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; }

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
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
        }
        .lp-footer-logo {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: 17px; font-weight: 600; letter-spacing: -0.04em;
          background: linear-gradient(to right, #FFD4A3, #FF9D6F);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        @media (max-width: 600px) {
          .lp-hl { font-size: clamp(32px, 9vw, 48px); }
          .lp-logo { font-size: clamp(44px, 12vw, 64px); }
          .lp-row2 { grid-template-columns: 1fr; }
          .lp-feat-grid { grid-template-columns: 1fr; }
          .lp-footer { padding: 18px 20px; }
        }
      `}</style>

      <div className="lp">
        {/* Cursor glow */}
        <div className="lp-glow" ref={glowRef} />

        {/* ── HERO ── */}
        <div className="lp-hero">

          {/* Scrolling brand rows */}
          <div className="lp-bg-rows">
            {Array.from({ length: NUM_ROWS }, (_, i) => (
              <ScrollRow
                key={i}
                brands={getRowBrands(brands, i)}
                direction={i % 2 === 0 ? "left" : "right"}
                duration={DURATIONS[i]}
              />
            ))}
          </div>

          {/* Vignette */}
          <div className="lp-vignette" />

          {/* Centre content */}
          <div className="lp-center">

            {/* Logo */}
            <div className="lp-logo">collabi</div>

            {/* Badge */}
            <div className="lp-badge">
              <span className="lp-dot-o" />
              Invite-only beta · Coming June 2026
            </div>

            {/* Headline */}
            <h1 className="lp-hl">
              Find the <em>humans</em><br />
              behind your<br />
              favourite brands.
            </h1>

            {/* Sub-heading */}
            <p className="lp-sub">
              Collabi is an outreach tool for creators. Search thousands of brands,
              see who&apos;s actively spending on marketing, and reach the right
              person in their inbox — all from one place.
            </p>

            {/* Form */}
            {status === "done" ? (
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(75,191,176,0.12)", border: "2px solid rgba(75,191,176,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4BBFB0" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 700, color: "#1A1110", marginBottom: 8 }}>You&apos;re on the list!</p>
                <p style={{ fontSize: 14, color: "#7A736B" }}>We&apos;ll be in touch when Collabi launches.</p>
              </div>
            ) : (
              <div className="lp-card" ref={formRef}>
                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div className="lp-row2">
                    <input className="lp-field" type="text" placeholder="First name" value={form.first_name} onChange={set("first_name")} required disabled={status === "loading"} />
                    <input className="lp-field" type="text" placeholder="Last name" value={form.last_name} onChange={set("last_name")} required disabled={status === "loading"} />
                  </div>
                  <input className="lp-field" type="email" placeholder="your@email.com" value={form.email} onChange={set("email")} required disabled={status === "loading"} />
                  <select className="lp-field lp-sel" value={form.niche} onChange={set("niche")} required disabled={status === "loading"}>
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
                  <button className="lp-btn" type="submit" disabled={status === "loading"}>
                    {status === "loading" ? "Joining…" : "Join the waitlist →"}
                  </button>
                  {status === "error" && <p style={{ fontSize: 12, color: "#e05252", textAlign: "center" }}>Something went wrong — please try again.</p>}
                  <p style={{ fontSize: 11, color: "#B5AFA8", textAlign: "center" }}>No spam, ever. Unsubscribe anytime.</p>
                </form>
              </div>
            )}

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
                <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 21, fontWeight: 700, color: "#1A1110", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 12 }}>{f.title}</h3>
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
              onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => formRef.current?.querySelector("input")?.focus(), 600); }}
              style={{ display: "inline-block", background: "#1A1110", color: "#fff", fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15, padding: "14px 32px", borderRadius: 100, textDecoration: "none" }}
            >
              Join the waitlist →
            </a>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <div className="lp-footer">
          <span className="lp-footer-logo">collabi</span>
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
