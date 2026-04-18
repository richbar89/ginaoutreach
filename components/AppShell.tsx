"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { Monitor } from "lucide-react";

const APP_ROUTES = [
  "/dashboard",
  "/contacts",
  "/campaigns",
  "/send",
  "/inbox",
  "/templates",
  "/pipeline",
  "/media-kit",
  "/ads",
  "/analytics",
  "/settings",
  "/admin",
  "/onboarding",
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const isOnboarding = pathname.startsWith("/onboarding");

  if (!isApp) return <>{children}</>;
  if (isOnboarding) return <>{children}</>;

  return (
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", background: "var(--bg)" }}>

      {/* Mobile nudge */}
      <div
        className="md:hidden fixed inset-0 z-[999] flex flex-col items-center justify-center p-8 text-center"
        style={{ background: "var(--ink)" }}
      >
        <div
          style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            padding: "40px 32px",
            maxWidth: 340,
            width: "100%",
          }}
        >
          <Monitor size={24} style={{ color: "var(--accent)", marginBottom: 20, display: "inline-block" }} />
          <h2 style={{ fontSize: 16, fontWeight: 900, color: "var(--text)", letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>
            Best on desktop
          </h2>
          <p style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6, marginBottom: 24 }}>
            Collabi is designed for a full-screen experience. Open it on your laptop or desktop.
          </p>
          <a href="/" style={{ fontSize: 11, color: "var(--accent)", fontWeight: 700, textDecoration: "none", textTransform: "uppercase", letterSpacing: "0.15em" }}>
            ← Back to home
          </a>
        </div>
      </div>

      {/* Sidebar */}
      <Sidebar />

      {/* Main content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          background: "var(--bg)",
          overflow: "hidden",
        }}
      >
        <AnnouncementBanner />
        <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>{children}</div>
      </div>

    </div>
  );
}
