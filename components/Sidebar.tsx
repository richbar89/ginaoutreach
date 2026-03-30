"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Settings,
  Send,
  Inbox,
  TrendingUp,
  BarChart2,
  FileText,
  BookOpen,
  Sparkles,
} from "lucide-react";

const navSections = [
  {
    label: "Outreach",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/contacts", label: "Contacts", icon: Users, exact: false },
      { href: "/campaigns", label: "Campaigns", icon: Megaphone, exact: false },
      { href: "/send", label: "Quick Send", icon: Send, exact: false },
      { href: "/inbox", label: "Inbox", icon: Inbox, exact: false },
      { href: "/templates", label: "Templates", icon: FileText, exact: false },
      { href: "/pipeline", label: "Deal Pipeline", icon: TrendingUp, exact: false },
      { href: "/media-kit", label: "Media Kit", icon: BookOpen, exact: false },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/trends", label: "Trend Monitor", icon: TrendingUp, exact: false },
      { href: "/ads", label: "Meta Ad Alerts", icon: BarChart2, exact: false },
      { href: "/analytics", label: "My Analytics", icon: BarChart2, exact: false },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-64 flex-shrink-0 flex flex-col h-full"
      style={{
        background: "#FFFFFF",
        borderRight: "1px solid #E5E7EB",
        borderRadius: "20px 0 0 20px",
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-7 pb-5" style={{ borderBottom: "1px solid #E5E7EB" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #F7A882 0%, #E8622A 100%)" }}
          >
            <Sparkles size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span
              className="font-display text-2xl font-black leading-none tracking-tight"
              style={{ color: "#111111" }}
            >
              GinaOS
            </span>
            <p className="text-[9px] mt-0.5 tracking-[0.18em] uppercase font-sans font-bold" style={{ color: "#9CA3AF" }}>
              Creator Suite
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto scrollbar-thin space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p
              className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.2em] font-sans"
              style={{ color: "#D1D5DB" }}
            >
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 font-sans"
                    style={
                      active
                        ? {
                            background: "#FEF0EB",
                            color: "#C04A1A",
                            fontWeight: 700,
                          }
                        : { color: "#6B7280", fontWeight: 600 }
                    }
                  >
                    <Icon
                      size={16}
                      strokeWidth={active ? 2.5 : 1.75}
                    />
                    {label}
                    {active && (
                      <div
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: "#E8622A" }}
                      />
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings link */}
      <div className="px-3 pb-3" style={{ borderTop: "1px solid #E5E7EB" }}>
        <div className="pt-3">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 font-sans"
            style={
              pathname === "/settings"
                ? {
                    background: "#FEF0EB",
                    color: "#C04A1A",
                    fontWeight: 700,
                  }
                : { color: "#6B7280", fontWeight: 600 }
            }
          >
            <Settings size={16} strokeWidth={pathname === "/settings" ? 2.5 : 1.75} />
            Settings
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid #E5E7EB" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #F7A882 0%, #E8622A 100%)" }}
          >
            <span className="text-white text-sm font-black">G</span>
          </div>
          <div>
            <p className="text-sm font-bold font-sans" style={{ color: "#1F2937" }}>
              Gina Burgess
            </p>
            <p className="text-[11px] font-semibold font-sans" style={{ color: "#9CA3AF" }}>
              @ginanutrition
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
