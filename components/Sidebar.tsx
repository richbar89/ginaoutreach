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
  ShieldCheck,
} from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

const navSections = [
  {
    label: "Outreach",
    items: [
      { href: "/dashboard",  label: "Dashboard",     icon: LayoutDashboard, exact: true },
      { href: "/contacts",   label: "Contacts",       icon: Users,           exact: false },
      { href: "/campaigns",  label: "Campaigns",      icon: Megaphone,       exact: false },
      { href: "/send",       label: "Quick Send",     icon: Send,            exact: false },
      { href: "/inbox",      label: "Inbox",          icon: Inbox,           exact: false },
      { href: "/templates",  label: "Templates",      icon: FileText,        exact: false },
      { href: "/pipeline",   label: "Deal Pipeline",  icon: TrendingUp,      exact: false },
      { href: "/media-kit",  label: "Media Kit",      icon: BookOpen,        exact: false },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/trends",    label: "Trend Monitor",  icon: TrendingUp, exact: false },
      { href: "/ads",       label: "Meta Ad Alerts", icon: BarChart2,  exact: false },
      { href: "/analytics", label: "My Analytics",   icon: BarChart2,  exact: false },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = !!user && user.id === ADMIN_USER_ID;

  const displayName = user?.fullName || user?.firstName || user?.emailAddresses?.[0]?.emailAddress || "You";
  const displayHandle = user?.emailAddresses?.[0]?.emailAddress || "";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <aside
      className="w-[220px] flex-shrink-0 flex flex-col h-full"
      style={{
        background: "#FFFFFF",
        borderRight: "1px solid #F0F0F2",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid #F0F0F2" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "#E8622A" }}
          >
            <Sparkles size={13} className="text-white" strokeWidth={2.5} />
          </div>
          <span
            className="text-[19px] font-black tracking-tight leading-none"
            style={{ color: "#0D1B2A", letterSpacing: "-0.04em" }}
          >
            Collabi
          </span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin space-y-4">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">
              {section.label}
            </p>
            <div className="space-y-0.5">
              {section.items.map(({ href, label, icon: Icon, exact }) => {
                const active = exact ? pathname === href : pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-100"
                    style={
                      active
                        ? { background: "#FEF0EB", color: "#C04A1A", fontWeight: 600 }
                        : { color: "#6B7280" }
                    }
                  >
                    <Icon
                      size={15}
                      strokeWidth={active ? 2.5 : 2}
                      style={{ color: active ? "#E8622A" : "#9CA3AF", flexShrink: 0 }}
                    />
                    {label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Admin */}
      {isAdmin && (
        <div className="px-3 pb-2">
          <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400">Admin</p>
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-100"
            style={
              pathname.startsWith("/admin")
                ? { background: "#FEF0EB", color: "#C04A1A", fontWeight: 600 }
                : { color: "#6B7280" }
            }
          >
            <ShieldCheck
              size={15}
              strokeWidth={pathname.startsWith("/admin") ? 2.5 : 2}
              style={{ color: pathname.startsWith("/admin") ? "#E8622A" : "#9CA3AF", flexShrink: 0 }}
            />
            Admin Dashboard
          </Link>
        </div>
      )}

      {/* Settings */}
      <div className="px-3 pb-2" style={{ borderTop: "1px solid #F0F0F2" }}>
        <div className="pt-2">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-100"
            style={
              pathname === "/settings"
                ? { background: "#FEF0EB", color: "#C04A1A", fontWeight: 600 }
                : { color: "#6B7280" }
            }
          >
            <Settings
              size={15}
              strokeWidth={pathname === "/settings" ? 2.5 : 2}
              style={{ color: pathname === "/settings" ? "#E8622A" : "#9CA3AF", flexShrink: 0 }}
            />
            Settings
          </Link>
        </div>
      </div>

      {/* User footer */}
      <div className="px-4 py-3.5" style={{ borderTop: "1px solid #F0F0F2" }}>
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden"
            style={{ background: "#E8622A" }}
          >
            {user?.imageUrl ? (
              <img src={user.imageUrl} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <span className="text-white text-[11px] font-black">{initials}</span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold truncate" style={{ color: "#0D1B2A" }}>
              {displayName}
            </p>
            <p className="text-[10px] truncate" style={{ color: "#9CA3AF" }}>
              {displayHandle}
            </p>
          </div>
          <SignOutButton>
            <button
              title="Sign out"
              className="text-[11px] text-gray-300 hover:text-red-400 transition-colors flex-shrink-0 font-medium"
            >
              ↪
            </button>
          </SignOutButton>
        </div>
      </div>
    </aside>
  );
}
