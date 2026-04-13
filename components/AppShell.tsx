"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AnnouncementBanner from "@/components/AnnouncementBanner";

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
    <div style={{ minHeight: "100vh", padding: "16px", background: "#EDEEF2" }}>
      <div
        className="flex overflow-hidden"
        style={{
          height: "calc(100vh - 32px)",
          borderRadius: "16px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 8px 24px rgba(0,0,0,0.08), 0 32px 56px rgba(0,0,0,0.06)",
          overflow: "hidden",
          border: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <Sidebar />
        <main
          className="flex-1 flex flex-col overflow-hidden"
          style={{ background: "#F7F8FA" }}
        >
          <AnnouncementBanner />
          <div className="flex-1 overflow-y-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
