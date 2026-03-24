"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Settings,
  Zap,
  Send,
  Inbox,
  TrendingUp,
  BarChart2,
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
      className="w-64 flex-shrink-0 flex flex-col h-full"
      style={{ background: "#0d1829" }}
    >
      {/* Logo */}
      <div className="px-6 py-7" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 bg-coral-500 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ boxShadow: "0 4px 14px rgba(232,113,90,0.4)" }}
          >
            <Zap size={16} className="text-white" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-white font-serif text-lg font-bold leading-none tracking-tight">
              GinaOS
            </span>
            <p className="text-[10px] mt-0.5 tracking-widest uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>
              Outreach Suite
            </p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 overflow-y-auto scrollbar-thin space-y-7">
        {navSections.map((section) => (
          <div key={section.label}>
            <p
              className="px-3 mb-2.5 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "rgba(255,255,255,0.2)" }}
            >
              {section.label}
            </p>
            <div className="space-y-1">
              {section.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact
                  ? pathname === href
                  : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                      active
                        ? "bg-coral-500 text-white"
                        : "hover:bg-white/5"
                    }`}
                    style={
                      active
                        ? { boxShadow: "0 4px 12px rgba(232,113,90,0.35)" }
                        : { color: "rgba(255,255,255,0.4)" }
                    }
                  >
                    <Icon size={16} strokeWidth={active ? 2.5 : 1.75} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Settings link */}
      <div className="px-4 pb-4">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
            pathname === "/settings"
              ? "bg-coral-500 text-white"
              : "hover:bg-white/5"
          }`}
          style={
            pathname === "/settings"
              ? { boxShadow: "0 4px 12px rgba(232,113,90,0.35)" }
              : { color: "rgba(255,255,255,0.4)" }
          }
        >
          <Settings size={16} strokeWidth={pathname === "/settings" ? 2.5 : 1.75} />
          Settings
        </Link>
      </div>

      {/* Footer */}
      <div className="px-5 py-5" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(232,113,90,0.15)" }}
          >
            <span className="text-coral-400 text-xs font-bold font-serif">G</span>
          </div>
          <div>
            <p className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.45)" }}>
              Gina&apos;s workspace
            </p>
            <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              GinaOS v1.0
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
