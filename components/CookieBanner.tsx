"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "collabi_cookie_consent";

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 9999,
        width: "calc(100% - 40px)",
        maxWidth: 680,
        background: "#1F2937",
        borderRadius: 16,
        boxShadow: "0 8px 32px rgba(0,0,0,0.24), 0 2px 8px rgba(0,0,0,0.16)",
        display: "flex",
        alignItems: "center",
        gap: 16,
        padding: "14px 18px",
      }}
    >
      <p style={{ flex: 1, fontSize: 13, color: "#D1D5DB", lineHeight: 1.5, margin: 0 }}>
        We use strictly necessary cookies for authentication. No advertising or tracking cookies.{" "}
        <Link href="/privacy" style={{ color: "#FB923C", fontWeight: 600, textDecoration: "none" }}>
          Privacy policy
        </Link>
      </p>
      <button
        onClick={accept}
        style={{
          flexShrink: 0,
          padding: "8px 18px",
          background: "#E8622A",
          color: "#fff",
          fontSize: 13,
          fontWeight: 700,
          borderRadius: 10,
          border: "none",
          cursor: "pointer",
          whiteSpace: "nowrap",
        }}
      >
        Got it
      </button>
    </div>
  );
}
