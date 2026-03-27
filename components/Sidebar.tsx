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
      { href: "/ads", label: "Meta Ad Alerts", icon: TrendingUp, exact: false },
      { href: "/analytics", label: "My Analytics", icon: BarChart2, exact: false },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="w-60 flex-shrink-0 flex flex-col h-full"
      style={{
        background: "var(--sidebar)",
        borderRight: "1px solid var(--border)",
        borderRadius: "20px 0 0 20px",
      }}
    >
      {/* Logo */}
      <div className="px-6 pt-7 pb-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #60A5FA 0%, #2563EB 100%)" }}
          >
            <Sparkles size={13} className="text-white" strokeWidth={2} />
          </div>
          <div>
            <span
              className="font-display text-xl font-bold leading-none tracking-tight"
              style={{ color: "#0F172A" }}
            >
              GinaOS
            </span>
            <p className="text-[9px] mt-0.5 tracking-[0.15em] uppercase font-sans" style={{ color: "#94A3B8" }}>
              Creator Suite
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto scrollbar-thin space-y-6">
        {navSections.map((section) => (
          <div key={section.label}>
            <p
              className="px-3 mb-2 text-[9px] font-bold uppercase tracking-[0.18em] font-sans"
              style={{ color: "#CBD5E1" }}
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
                    className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 font-sans"
                    style={
                      active
                        ? {
                            background: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
                            color: "#2563EB",
                            fontWeight: 600,
                          }
                        : { color: "#64748B" }
                    }
                  >
                    <Icon
                      size={15}
                      strokeWidth={active ? 2 : 1.5}
                      style={{ opacity: active ? 1 : 0.7 }}
                    />
                    {label}
                    {active && (
                      <div
                        className="ml-auto w-1.5 h-1.5 rounded-full"
                        style={{ background: "#3B82F6" }}
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
      <div className="px-3 pb-3" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="pt-3">
          <Link
            href="/settings"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-[13px] font-medium transition-all duration-150 font-sans"
            style={
              pathname === "/settings"
                ? {
                    background: "linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%)",
                    color: "#2563EB",
                    fontWeight: 600,
                  }
                : { color: "#64748B" }
            }
          >
            <Settings size={15} strokeWidth={pathname === "/settings" ? 2 : 1.5} style={{ opacity: pathname === "/settings" ? 1 : 0.7 }} />
            Settings
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #BFDBFE 0%, #60A5FA 100%)" }}
          >
            <span className="text-white text-[11px] font-bold font-serif">G</span>
          </div>
          <div>
            <p className="text-xs font-semibold font-sans" style={{ color: "#334155" }}>
              Gina Burgess
            </p>
            <p className="text-[10px] font-sans" style={{ color: "#94A3B8" }}>
              @ginanutrition
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
