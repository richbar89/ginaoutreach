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
          <img src={`https://www.google.com/s2/favicons?domain=${brand.domain}&sz=64`} alt={brand.name} width={32} height={32} style={{ objectFit: "contain", width: 32, height: 32 }} onError={() => setLogoFailed(true)} />
        ) : (
          <span style={{ fontSize: 15, fontWeight: 700, color: col.fg }}>{letter}</span>
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

function HeroPhone() {
  const [perelloOk, setPerelloOk] = useState(true);

  const brandRows = [
    { name: "Graze", domain: "graze.com" },
    { name: "Huel", domain: "huel.com" },
    { name: "Innocent", domain: "innocentdrinks.co.uk" },
  ];

  return (
    <div style={{ position: "relative", width: 270, flexShrink: 0 }}>
      {/* Ambient glow under phone */}
      <div style={{
        position: "absolute", bottom: -40, left: "50%", transform: "translateX(-50%)",
        width: 220, height: 80,
        background: "radial-gradient(ellipse, rgba(232,98,42,0.30) 0%, transparent 70%)",
        filter: "blur(24px)", pointerEvents: "none",
      }} />

      {/* Phone chassis */}
      <div style={{
        width: 270, height: 548,
        borderRadius: 46,
        background: "linear-gradient(160deg, #2e2e2e 0%, #111 100%)",
        border: "7px solid #1e1e1e",
        boxShadow: "0 0 0 1px rgba(255,255,255,0.06) inset, 0 40px 80px rgba(0,0,0,0.45), 0 8px 24px rgba(0,0,0,0.25)",
        position: "relative",
        overflow: "hidden",
        animation: "phoneFloat 5s ease-in-out infinite",
      }}>
        {/* Dynamic Island */}
        <div style={{
          position: "absolute", top: 13, left: "50%", transform: "translateX(-50%)",
          width: 90, height: 28, borderRadius: 14, background: "#111", zIndex: 20,
        }} />

        {/* Screen */}
        <div style={{ position: "absolute", inset: 0, background: "#F7F3EE", borderRadius: 40, overflow: "hidden" }}>

          {/* Status bar */}
          <div style={{ padding: "15px 18px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#111", letterSpacing: "-0.02em" }}>9:41</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              {[1, 0.65, 0.35].map((o, i) => <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: `rgba(17,17,17,${o})` }} />)}
              <div style={{ width: 16, height: 8, borderRadius: 2, border: "1.5px solid rgba(17,17,17,0.6)", marginLeft: 3, position: "relative" }}>
                <div style={{ position: "absolute", left: 1.5, top: 1.5, bottom: 1.5, width: "65%", background: "rgba(17,17,17,0.7)", borderRadius: 1 }} />
              </div>
            </div>
          </div>

          {/* App header */}
          <div style={{ padding: "10px 16px 8px", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <p style={{ fontSize: 13, fontWeight: 800, color: "#C4603A", letterSpacing: "-0.04em", lineHeight: 1 }}>collabi</p>
            <p style={{ fontSize: 9, color: "#9E9790", letterSpacing: "0.07em", textTransform: "uppercase", marginTop: 1 }}>Brand Monitor</p>
          </div>

          {/* Brand list */}
          <div style={{ padding: "10px 12px", display: "flex", flexDirection: "column", gap: 7 }}>
            {brandRows.map(b => (
              <div key={b.name} style={{
                display: "flex", alignItems: "center", gap: 9,
                background: "white", borderRadius: 11, padding: "8px 10px",
                boxShadow: "0 1px 4px rgba(0,0,0,0.06)",
              }}>
                <div style={{ width: 26, height: 26, borderRadius: 7, background: "#f5f5f5", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <img src={`https://www.google.com/s2/favicons?domain=${b.domain}&sz=32`} width={20} height={20} style={{ objectFit: "contain" }} alt={b.name} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 600, color: "#1A1110", lineHeight: 1.2 }}>{b.name}</p>
                  <p style={{ fontSize: 8, color: "#B5AFA8" }}>No active ads</p>
                </div>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E5E7EB" }} />
              </div>
            ))}
          </div>

          {/* Animated alert — slides in from top of phone screen */}
          <div style={{
            position: "absolute", top: 52, left: 8, right: 8,
            background: "white",
            borderRadius: 18,
            padding: "12px 13px",
            boxShadow: "0 8px 30px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.08)",
            border: "1px solid rgba(232,98,42,0.18)",
            display: "flex", gap: 10, alignItems: "flex-start",
            animation: "alertLoop 7s ease-in-out infinite",
            animationDelay: "1.8s",
          }}>
            {/* Perello logo */}
            <div style={{
              width: 38, height: 38, borderRadius: 11, flexShrink: 0,
              background: "#fff8f5", border: "1px solid rgba(232,98,42,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center",
              overflow: "hidden",
            }}>
              {perelloOk ? (
                <img
                  src="https://www.google.com/s2/favicons?domain=perelloolives.com&sz=64"
                  width={28} height={28} style={{ objectFit: "contain" }}
                  onError={() => setPerelloOk(false)}
                  alt="Perello"
                />
              ) : (
                <span style={{ fontSize: 16, fontWeight: 800, color: "#C4603A" }}>P</span>
              )}
            </div>

            {/* Alert content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E8622A", animation: "pulseDot 1.3s ease-in-out infinite", flexShrink: 0 }} />
                <span style={{ fontSize: 9, fontWeight: 800, color: "#E8622A", letterSpacing: "0.05em", textTransform: "uppercase" }}>Alert</span>
                <span style={{ fontSize: 8, color: "#B5AFA8", marginLeft: "auto" }}>just now</span>
              </div>
              <p style={{ fontSize: 11.5, fontWeight: 700, color: "#1A1110", lineHeight: 1.3, marginBottom: 2 }}>
                Perello are running ads!
              </p>
              <p style={{ fontSize: 9, color: "#7A736B" }}>Meta Ads · Active now · Budget open 🟢</p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Mini phone for "How it works" steps
function MiniPhone({ step }: { step: number }) {
  const screens: Record<number, React.ReactNode> = {
    1: (
      <div style={{ padding: "28px 10px 10px" }}>
        <p style={{ fontSize: 8, fontWeight: 700, color: "#C4603A", letterSpacing: "-0.03em", marginBottom: 6 }}>collabi</p>
        <div style={{ background: "#F7F3EE", borderRadius: 8, padding: "6px 8px", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#D1CBC3", flexShrink: 0 }} />
          <div style={{ height: 5, background: "#E5E0DA", borderRadius: 3, flex: 1 }} />
        </div>
        {[["Graze", "graze.com"], ["Huel", "huel.com"], ["Wild", "wearewild.com"], ["Papier", "papier.com"]].map(([n, d]) => (
          <div key={n} style={{ display: "flex", alignItems: "center", gap: 5, background: "white", borderRadius: 7, padding: "5px 7px", marginBottom: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <img src={`https://www.google.com/s2/favicons?domain=${d}&sz=16`} width={12} height={12} style={{ borderRadius: 3, objectFit: "contain" }} alt={n} />
            <div style={{ height: 4, background: "#1A1110", borderRadius: 2, width: "45%", opacity: 0.7 }} />
          </div>
        ))}
      </div>
    ),
    2: (
      <div style={{ padding: "28px 10px 10px", position: "relative", overflow: "hidden", height: "100%" }}>
        <p style={{ fontSize: 8, fontWeight: 700, color: "#C4603A", letterSpacing: "-0.03em", marginBottom: 6 }}>collabi</p>
        {[["Graze", "graze.com"], ["Huel", "huel.com"], ["Perello", "perelloolives.com"]].map(([n, d]) => (
          <div key={n as string} style={{ display: "flex", alignItems: "center", gap: 5, background: "white", borderRadius: 7, padding: "5px 7px", marginBottom: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}>
            <img src={`https://www.google.com/s2/favicons?domain=${d}&sz=16`} width={12} height={12} style={{ borderRadius: 3, objectFit: "contain" }} alt={n as string} />
            <div style={{ flex: 1, height: 4, background: "#D1CBC3", borderRadius: 2 }} />
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#E5E0DA", flexShrink: 0 }} />
          </div>
        ))}
        {/* Animated Perello alert — loops like the hero phone */}
        <div style={{
          position: "absolute", top: 28, left: 6, right: 6,
          background: "white", borderRadius: 12,
          padding: "8px 9px",
          boxShadow: "0 4px 16px rgba(0,0,0,0.16)",
          border: "1px solid rgba(232,98,42,0.18)",
          display: "flex", gap: 7, alignItems: "flex-start",
          animation: "alertLoop 7s ease-in-out infinite",
          animationDelay: "1.8s",
        }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: "#fff8f5", border: "1px solid rgba(232,98,42,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden" }}>
            <img src="https://www.google.com/s2/favicons?domain=perelloolives.com&sz=32" width={16} height={16} style={{ objectFit: "contain" }} alt="Perello" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 2 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#E8622A", animation: "pulseDot 1.3s ease-in-out infinite", flexShrink: 0 }} />
              <span style={{ fontSize: 6.5, fontWeight: 800, color: "#E8622A", letterSpacing: "0.04em", textTransform: "uppercase" }}>Alert</span>
            </div>
            <p style={{ fontSize: 7.5, fontWeight: 700, color: "#1A1110", lineHeight: 1.3 }}>Perello are running ads!</p>
            <p style={{ fontSize: 6, color: "#9E9790" }}>Meta · Active now 🟢</p>
          </div>
        </div>
      </div>
    ),
    3: (
      <div style={{ padding: "28px 10px 10px" }}>
        <p style={{ fontSize: 8, fontWeight: 700, color: "#C4603A", letterSpacing: "-0.03em", marginBottom: 6 }}>collabi</p>
        <div style={{ background: "white", borderRadius: 8, padding: "7px 8px", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
          <div style={{ fontSize: 7, color: "#9E9790", marginBottom: 3 }}>To: marketing@huel.com</div>
          <div style={{ height: 4, background: "#1A1110", borderRadius: 2, width: "80%", marginBottom: 6, opacity: 0.8 }} />
          {[1, 0.6, 0.8, 0.5, 0.7].map((w, i) => (
            <div key={i} style={{ height: 3, background: "#D1CBC3", borderRadius: 2, width: `${w * 100}%`, marginBottom: 4 }} />
          ))}
          <div style={{ marginTop: 8, background: "#E8622A", borderRadius: 6, padding: "4px 8px", display: "inline-block" }}>
            <span style={{ fontSize: 7, color: "white", fontWeight: 700 }}>Send →</span>
          </div>
        </div>
      </div>
    ),
  };

  return (
    <div style={{
      width: 110, height: 220,
      borderRadius: 20, background: "linear-gradient(145deg, #2e2e2e, #111)",
      border: "4px solid #1e1e1e",
      boxShadow: "0 0 0 1px rgba(255,255,255,0.05) inset, 0 20px 40px rgba(0,0,0,0.25)",
      position: "relative", overflow: "hidden", flexShrink: 0,
    }}>
      <div style={{ position: "absolute", top: 6, left: "50%", transform: "translateX(-50%)", width: 36, height: 11, borderRadius: 6, background: "#111", zIndex: 10 }} />
      <div style={{ position: "absolute", inset: 0, background: "#F7F3EE", borderRadius: 17, overflow: "hidden" }}>
        {screens[step]}
      </div>
    </div>
  );
}

const HOW_STEPS = [
  {
    n: 1,
    title: "Add brands you love",
    body: "Search 10,000+ verified contacts at brands in your niche. One click to follow.",
  },
  {
    n: 2,
    title: "Get live ad alerts",
    body: "Know the moment a brand opens their Meta budget — that's your window to pitch.",
  },
  {
    n: 3,
    title: "Send your pitch",
    body: "Personalised outreach from your own Gmail. Auto follow-ups handle the rest.",
  },
];

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
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { background: #F5F0EA; font-size: 16px; }
        .lp { -webkit-font-smoothing: antialiased; background: #F5F0EA; }
        .lp h1, .lp h2, .lp h3 { font-family: 'DM Serif Display', serif; }

        .lp-hero {
          position: relative; min-height: 100vh;
          display: flex; align-items: center; justify-content: center;
          overflow: hidden;
        }
        .lp-bg-rows {
          position: absolute; top: 0; left: 0; right: 0; bottom: 0;
          display: flex; flex-direction: column; justify-content: center;
          gap: 68px; padding: 40px 0;
          pointer-events: none; user-select: none; overflow: hidden;
        }
        @keyframes lp-sl { from { transform: translateX(0); } to { transform: translateX(-50%); } }
        @keyframes lp-sr { from { transform: translateX(-50%); } to { transform: translateX(0); } }

        .lp-blur-center {
          position: absolute; inset: 0; pointer-events: none; z-index: 1;
          backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
          mask-image: radial-gradient(ellipse 68% 78% at 50% 50%, black 0%, black 22%, rgba(0,0,0,0.55) 52%, transparent 74%);
          -webkit-mask-image: radial-gradient(ellipse 68% 78% at 50% 50%, black 0%, black 22%, rgba(0,0,0,0.55) 52%, transparent 74%);
        }
        .lp-vignette {
          position: absolute; inset: 0; pointer-events: none; z-index: 2;
          background: radial-gradient(ellipse 58% 68% at 50% 50%,
            rgba(245,240,234,0.94) 0%, rgba(245,240,234,0.72) 25%,
            rgba(245,240,234,0.30) 54%, transparent 74%);
        }
        .lp-glow {
          position: fixed; width: 320px; height: 320px; border-radius: 50%;
          background: radial-gradient(circle, rgba(200,96,58,0.22) 0%, rgba(200,96,58,0.08) 45%, transparent 70%);
          filter: blur(36px); transform: translate(-50%, -50%);
          pointer-events: none; z-index: 5; will-change: left, top; left: 50%; top: 50%;
        }

        /* Hero centred content */
        .lp-center {
          position: relative; z-index: 10;
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: 56px 24px 64px; max-width: 680px; width: 100%;
        }

        .lp-logo {
          font-family: system-ui, -apple-system, sans-serif;
          font-size: clamp(52px, 8vw, 80px); font-weight: 700; letter-spacing: -0.04em; line-height: 1;
          background: linear-gradient(135deg, #FF8C42 0%, #C4603A 100%);
          -webkit-background-clip: text; -webkit-text-fill-color: transparent;
          background-clip: text; margin-bottom: 20px;
          filter: drop-shadow(0 2px 28px rgba(196,96,58,0.55));
        }
        .lp-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: #FFFFFF; border: 1.5px solid rgba(196,96,58,0.25);
          border-radius: 100px; padding: 6px 14px;
          font-size: 12px; font-weight: 600; color: #2E2521;
          margin-bottom: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.07);
        }
        .lp-dot-o { width: 7px; height: 7px; border-radius: 50%; background: #E8622A; flex-shrink: 0; }
        .lp-hl {
          font-size: clamp(36px, 5.5vw, 64px); font-weight: 900;
          color: #1A1110; line-height: 1.08; letter-spacing: -0.02em;
          margin-bottom: 18px;
        }
        .lp-hl em { font-style: italic; font-weight: 400; color: #C4603A; }
        .lp-sub {
          font-size: 15px; color: #6B6560; line-height: 1.7;
          max-width: 440px; margin-bottom: 28px;
        }
        .lp-card {
          width: 100%; max-width: 380px;
          background: rgba(245,240,234,0.85); backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1.5px solid rgba(200,185,170,0.38);
          border-radius: 20px; padding: 20px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.07);
          margin-bottom: 14px;
        }
        .lp-row2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .lp-field {
          width: 100%; padding: 11px 14px;
          border: 1.5px solid #E8E2DA; border-radius: 11px;
          font-size: 14px; color: #1A1110; background: #FAFAF9; outline: none;
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
          background: #E8622A; color: #fff; border: none; border-radius: 11px;
          font-size: 14px; font-weight: 600; cursor: pointer;
          transition: background 0.14s, transform 0.12s;
          box-shadow: 0 4px 18px rgba(232,98,42,0.38);
        }
        .lp-btn:hover:not(:disabled) { background: #C4500A; transform: translateY(-1px); }
        .lp-btn:disabled { opacity: 0.6; cursor: not-allowed; }

        /* Phone animations */
        @keyframes phoneFloat {
          0%, 100% { transform: translateY(0) rotate(-3deg); }
          50% { transform: translateY(-14px) rotate(-3deg); }
        }
        @keyframes alertLoop {
          0%   { transform: translateY(-115%); opacity: 0; }
          12%  { transform: translateY(0);     opacity: 1; }
          68%  { transform: translateY(0);     opacity: 1; }
          80%  { transform: translateY(-115%); opacity: 0; }
          100% { transform: translateY(-115%); opacity: 0; }
        }
        @keyframes pulseDot {
          0%, 100% { transform: scale(1); opacity: 1; }
          50%       { transform: scale(1.5); opacity: 0.65; }
        }

        /* How it works */
        .lp-how {
          background: #FFFFFF; padding: 100px 24px;
        }
        .lp-how-grid {
          max-width: 960px; margin: 64px auto 0;
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 40px;
        }
        .lp-how-step {
          display: flex; flex-direction: column; align-items: center; text-align: center;
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
          .lp-logo { font-size: clamp(72px, 20vw, 96px); }
          .lp-center { padding: 24px 20px 28px; }
          .lp-row2 { grid-template-columns: 1fr; }
          .lp-how-grid { grid-template-columns: 1fr; }
          .lp-feat-grid { grid-template-columns: 1fr; }
          .lp-footer { padding: 18px 20px; }
        }
      `}</style>

      <div className="lp">
        <div className="lp-glow" ref={glowRef} />

        {/* ── HERO ── */}
        <div className="lp-hero">
          <div className="lp-bg-rows">
            {Array.from({ length: NUM_ROWS }, (_, i) => (
              <ScrollRow key={i} brands={getRowBrands(brands, i)} direction={i % 2 === 0 ? "left" : "right"} duration={DURATIONS[i]} />
            ))}
          </div>
          <div className="lp-blur-center" />
          <div className="lp-vignette" />

          <div className="lp-center">
            <div className="lp-logo">collabi</div>

            <div className="lp-badge">
              <span className="lp-dot-o" />
              Invite-only beta · Coming June 2026
            </div>

            <h1 className="lp-hl">
              Find the <em>humans</em><br />
              behind your<br />
              favourite brands.
            </h1>

            <p className="lp-sub hidden sm:block">
              Collabi is an outreach tool for creators. Search thousands of brands,
              see who&apos;s actively spending on marketing, and reach the right
              person in their inbox — all from one place.
            </p>

            {status === "done" ? (
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: "rgba(232,98,42,0.10)", border: "2px solid rgba(232,98,42,0.28)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 14px" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#E8622A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                </div>
                <p style={{ fontSize: 22, fontWeight: 700, color: "#1A1110", marginBottom: 8 }}>You&apos;re on the list!</p>
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

        {/* ── HOW IT WORKS ── */}
        <div className="lp-how">
          <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9E9790", marginBottom: 10 }}>Simple by design</p>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 900, color: "#1A1110", letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 12 }}>
              How it works
            </h2>
            <p style={{ fontSize: 15, color: "#7A736B", maxWidth: 420, margin: "0 auto" }}>
              Three steps. Minutes to set up. Deals from day one.
            </p>
          </div>

          <div className="lp-how-grid">
            {HOW_STEPS.map(s => (
              <div key={s.n} className="lp-how-step">
                {/* Mini phone */}
                <div style={{ marginBottom: 28, position: "relative" }}>
                  <div style={{
                    position: "absolute", bottom: -16, left: "50%", transform: "translateX(-50%)",
                    width: 80, height: 30,
                    background: "radial-gradient(ellipse, rgba(232,98,42,0.20) 0%, transparent 70%)",
                    filter: "blur(10px)",
                  }} />
                  <MiniPhone step={s.n} />
                </div>

                {/* Step number */}
                <div style={{
                  width: 32, height: 32, borderRadius: "50%",
                  background: "rgba(232,98,42,0.10)", border: "1.5px solid rgba(232,98,42,0.22)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 13, fontWeight: 800, color: "#C4603A",
                  marginBottom: 12,
                }}>
                  {s.n}
                </div>

                <h3 style={{ fontSize: 18, fontWeight: 700, color: "#1A1110", letterSpacing: "-0.02em", marginBottom: 8 }}>{s.title}</h3>
                <p style={{ fontSize: 14, color: "#7A736B", lineHeight: 1.65 }}>{s.body}</p>
              </div>
            ))}
          </div>

          {/* Connector line between steps (desktop only) */}
          <div style={{ maxWidth: 960, margin: "0 auto", position: "relative", height: 0 }}>
          </div>
        </div>

        {/* ── FEATURES ── */}
        <div className="lp-features" id="features">
          <div style={{ maxWidth: 960, margin: "0 auto", textAlign: "center" }}>
            <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#9E9790", marginBottom: 10 }}>Everything you need</p>
            <h2 style={{ fontSize: "clamp(28px, 3.5vw, 44px)", fontWeight: 900, color: "#1A1110", letterSpacing: "-0.025em", lineHeight: 1.1 }}>
              One platform. Every tool.
            </h2>
          </div>
          <div className="lp-feat-grid">
            {FEATURES.map(f => (
              <div key={f.tag} className="lp-feat-card">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(196,96,58,0.08)", border: "1px solid rgba(196,96,58,0.18)", borderRadius: 100, padding: "4px 12px", marginBottom: 18 }}>
                  <span style={{ fontSize: 13 }} suppressHydrationWarning>{f.emoji}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" as const, color: "#C4603A" }}>{f.tag}</span>
                </div>
                <h3 style={{ fontSize: 21, fontWeight: 700, color: "#1A1110", letterSpacing: "-0.02em", lineHeight: 1.2, marginBottom: 12 }}>{f.title}</h3>
                <p style={{ fontSize: 14, color: "#7A736B", lineHeight: 1.7, marginBottom: 20 }}>{f.body}</p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {f.bullets.map(b => (
                    <div key={b} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 16, height: 16, borderRadius: "50%", background: "rgba(75,191,176,0.12)", border: "1px solid rgba(75,191,176,0.25)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#4BBFB0" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
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
              onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); setTimeout(() => (formRef.current?.querySelector("input") as HTMLInputElement)?.focus(), 600); }}
              style={{ display: "inline-block", background: "#E8622A", color: "#fff", fontWeight: 700, fontSize: 15, padding: "14px 32px", borderRadius: 100, textDecoration: "none", boxShadow: "0 4px 18px rgba(232,98,42,0.38)" }}
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
