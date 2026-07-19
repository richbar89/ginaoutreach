"use client";

import { usePathname } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import ProductTour from "@/components/ProductTour";
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
    <div className="h-screen flex overflow-hidden p-6 gap-5">

      {/* Mobile nudge */}
      <div className="md:hidden fixed inset-0 z-[999] flex flex-col items-center justify-center p-8 text-center bg-cream-100">
        <div className="card w-full max-w-[340px] px-8 py-10 shadow-[0_16px_60px_rgba(0,0,0,0.10)]">
          <div className="w-[52px] h-[52px] bg-coral-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <Monitor size={24} className="text-coral-500" />
          </div>
          <h2 className="text-xl font-bold text-navy-900 tracking-[-0.02em] mb-2.5">
            Best on desktop
          </h2>
          <p className="text-sm text-navy-500 leading-relaxed mb-6">
            Collabi is designed for a full-screen experience. For the best results, open it on your laptop or desktop.
          </p>
          <a href="/" className="inline-block text-[13px] text-coral-500 font-semibold no-underline hover:text-coral-600 transition-colors">
            ← Back to home
          </a>
        </div>
      </div>

      <ProductTour />

      {/* Sidebar */}
      <div className="flex items-center flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        <AnnouncementBanner />
        <div className="flex-1 overflow-y-auto scrollbar-thin">{children}</div>
      </div>

    </div>
  );
}
