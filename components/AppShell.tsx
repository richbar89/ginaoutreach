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
    <div style={{ height: "100vh", display: "flex", overflow: "hidden", padding: "24px", gap: "20px" }}>

      {/* Mobile nudge */}
      <div
        className="md:hidden fixed inset-0 z-[999] flex flex-col items-center justify-center p-8 text-center"
        style={{ background: "#B5684E" }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "40px 32px",
            boxShadow: "0 16px 60px rgba(0,0,0,0.18)",
            maxWidth: 340,
            width: "100%",
          }}
        >
          <div
            style={{
              width: 52,
              height: 52,
              background: "rgba(212,121,92,0.1)",
              borderRadius: 14,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Monitor size={24} style={{ color: "#D4795C" }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#1A1A1A", letterSpacing: "-0.03em", marginBottom: 10, fontFamily: "'Sora', sans-serif" }}>
            Best on desktop
          </h2>
          <p style={{ fontSize: 14, color: "#7A736B", lineHeight: 1.6, marginBottom: 24 }}>
            Collabi is designed for a full-screen experience. For the best results, open it on your laptop or desktop.
          </p>
          <a href="/" style={{ display: "inline-block", fontSize: 13, color: "#D4795C", fontWeight: 700, textDecoration: "none" }}>
            ← Back to home
          </a>
        </div>
      </div>

      {/* Sidebar */}
      <div style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
        <Sidebar />
      </div>

      {/* Main content — transparent so cards float on terracotta */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AnnouncementBanner />
        <div style={{ flex: 1, overflow: "auto" }}>{children}</div>
      </div>

    </div>
  );
}
