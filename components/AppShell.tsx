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
    <div style={{ height: "100vh", display: "flex", overflow: "hidden" }}>
      {/* Mobile nudge — only visible on small screens */}
      <div
        className="md:hidden fixed inset-0 z-[999] flex flex-col items-center justify-center p-8 text-center"
        style={{ background: "linear-gradient(135deg, #A8B4FF 0%, #C8B4FF 45%, #FFB090 100%)" }}
      >
        <div style={{ background: "rgba(255,255,255,0.85)", backdropFilter: "blur(20px)", borderRadius: 20, padding: "40px 32px", boxShadow: "0 8px 40px rgba(100,80,200,0.2)", maxWidth: 340, width: "100%" }}>
          <div style={{ width: 52, height: 52, background: "#FEF0EB", borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
            <Monitor size={24} style={{ color: "#E8622A" }} />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#0D1B2A", letterSpacing: "-0.03em", marginBottom: 10 }}>Best on desktop</h2>
          <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: 24 }}>Collabi is designed for a full-screen experience. For the best results, open it on your laptop or desktop.</p>
          <a href="/" style={{ display: "inline-block", fontSize: 13, color: "#E8622A", fontWeight: 600, textDecoration: "none" }}>← Back to home</a>
        </div>
      </div>

      <Sidebar />

      <main
        className="flex-1 flex flex-col overflow-hidden"
        style={{ background: "transparent" }}
      >
        <AnnouncementBanner />
        <div className="flex-1 overflow-y-auto">{children}</div>
      </main>
    </div>
  );
}
