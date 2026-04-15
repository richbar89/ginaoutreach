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

const SIDEBAR_WIDTH = 52; // px

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isApp = APP_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
  const isOnboarding = pathname.startsWith("/onboarding");

  if (!isApp) return <>{children}</>;
  if (isOnboarding) return <>{children}</>;

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        overflow: "hidden",
        padding: "20px",
        paddingLeft: "20px",
      }}
    >
      {/* Mobile nudge */}
      <div
        className="md:hidden fixed inset-0 z-[999] flex flex-col items-center justify-center p-8 text-center"
        style={{ background: "linear-gradient(145deg, #818CF8 0%, #A5B4FC 30%, #FFFFFF 100%)" }}
      >
        <div
          style={{
            background: "rgba(255,255,255,0.9)",
            backdropFilter: "blur(20px)",
            borderRadius: 20,
            padding: "40px 32px",
            boxShadow: "0 8px 40px rgba(99,102,241,0.2)",
            maxWidth: 340,
            width: "100%",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              background: "#FEF0EB",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Monitor size={24} style={{ color: "#EA580C" }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#111827", letterSpacing: "-0.03em", marginBottom: 10 }}>
            Best on desktop
          </h2>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}>
            Collabi is designed for a full-screen experience. For the best results, open it on your laptop or desktop.
          </p>
          <a href="/" style={{ display: "inline-block", fontSize: 13, color: "#EA580C", fontWeight: 600, textDecoration: "none" }}>
            ← Back to home
          </a>
        </div>
      </div>

      {/* Layout: sidebar straddling left edge of card */}
      <div style={{ position: "relative", flex: 1, display: "flex" }}>

        {/* Sidebar — 50% outside card, 50% inside */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: SIDEBAR_WIDTH,
            zIndex: 20,
            display: "flex",
            alignItems: "center",
          }}
        >
          <Sidebar />
        </div>

        {/* Main card — starts at half the sidebar width so sidebar straddles its edge */}
        <div
          style={{
            marginLeft: SIDEBAR_WIDTH / 2,
            flex: 1,
            background: "#FFFFFF",
            borderRadius: 20,
            boxShadow: "0 8px 48px rgba(99,102,241,0.12), 0 2px 8px rgba(0,0,0,0.06)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <AnnouncementBanner />
          <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
        </div>
      </div>
    </div>
  );
}
