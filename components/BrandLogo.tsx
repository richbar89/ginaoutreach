"use client";

import { useState, useEffect } from "react";

const BRAND_AVATAR_COLOURS = [
  "#3B82F6","#8B5CF6","#10B981","#F59E0B",
  "#EF4444","#EC4899","#06B6D4","#84CC16","#F97316","#6366F1",
];

/** Brand logo via Clearbit with favicon + coloured-initial fallbacks. */
export default function BrandLogo({ name, size = 30, domain }: { name: string; size?: number; domain?: string }) {
  const colour = BRAND_AVATAR_COLOURS[
    name.split("").reduce((h, c) => (h * 31 + c.charCodeAt(0)) & 0xffff, 0) % BRAND_AVATAR_COLOURS.length
  ];
  const [imgSrc, setImgSrc] = useState<string | null>(
    domain ? `https://logo.clearbit.com/${domain}` : null
  );
  const [failed, setFailed] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (domain) {
      setImgSrc(`https://logo.clearbit.com/${domain}`);
      setFailed(false);
      setLoaded(false);
    }
  }, [domain]);

  function handleError() {
    if (domain && imgSrc?.includes("logo.clearbit.com")) {
      setImgSrc(`https://www.google.com/s2/favicons?domain=${domain}&sz=64`);
      setLoaded(false);
    } else {
      setFailed(true);
    }
  }

  const hasImg = !!imgSrc && !failed;

  return (
    <div style={{
      width: size, height: size, borderRadius: 9, flexShrink: 0, overflow: "hidden",
      background: hasImg && loaded ? "#fff" : hasImg ? "#F0F0F0" : colour,
      border: hasImg ? "1px solid rgba(0,0,0,0.05)" : "none",
      display: "flex", alignItems: "center", justifyContent: "center",
      position: "relative",
    }}>
      {hasImg && (
        <>
          <img
            src={imgSrc} alt={name}
            style={{ objectFit: "contain", width: size - 6, height: size - 6 }}
            onLoad={() => setLoaded(true)}
            onError={handleError}
          />
          {!loaded && (
            <div className="animate-pulse" style={{ position: "absolute", inset: 0, background: "#E8E8ED" }} />
          )}
        </>
      )}
      {!hasImg && (
        <span style={{ color: "white", fontSize: size * 0.37, fontWeight: 800 }}>{name[0]?.toUpperCase()}</span>
      )}
    </div>
  );
}
