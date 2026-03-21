"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  BarChart2,
  Eye,
  Megaphone,
  Bell,
  Zap,
} from "lucide-react";

const navSections = [
  {
    label: "Outreach",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard, exact: true },
      { href: "/contacts", label: "Contacts", icon: Users, exact: false },
    ],
  },
  {
    label: "Intelligence",
    items: [
      {
        href: "/meta-analytics",
        label: "Meta Analytics",
        icon: BarChart2,
        exact: false,
      },
      {
        href: "/competitors",
        label: "Competitor Tracker",
        icon: Eye,
        exact: false,
      },
      {
        href: "/influencer-tracker",
        label: "Influencer Tracker",
        icon: Megaphone,
        exact: false,
      },
      { href: "/ad-alerts", label: "Ad Alerts", icon: Bell, exact: false },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-60 flex-shrink-0 bg-navy-900 flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-navy-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-coral-500 rounded-lg flex items-center justify-center">
            <Zap size={15} className="text-white" strokeWidth={2.5} />
          </div>
          <span className="text-white font-semibold text-[15px] tracking-tight font-serif">
            GinaOS
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 overflow-y-auto scrollbar-thin space-y-6">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest text-navy-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact
                  ? pathname === href
                  : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                      active
                        ? "bg-coral-500 text-white"
                        : "text-navy-300 hover:text-white hover:bg-navy-800"
                    }`}
                  >
                    <Icon size={16} strokeWidth={active ? 2.5 : 2} />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-navy-800">
        <p className="text-xs text-navy-500 text-center">GinaOS v1.0</p>
      </div>
    </aside>
  );
}
