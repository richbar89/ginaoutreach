"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Megaphone,
  Settings,
  Inbox,
  TrendingUp,
  BarChart2,
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
      { href: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard, exact: true },
      { href: "/contacts",   label: "Contacts",     icon: Users,           exact: false },
      { href: "/inbox",      label: "Inbox",        icon: Inbox,           exact: false },
      { href: "/campaigns",  label: "Campaigns",    icon: Megaphone,       exact: false },
    ],
  },
  {
    label: "Deals",
    items: [
      { href: "/pipeline",   label: "Deal Pipeline", icon: TrendingUp, exact: false },
      { href: "/media-kit",  label: "Media Kit",     icon: BookOpen,   exact: false },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { href: "/ads",        label: "Meta Ad Alerts", icon: BarChart2, exact: false },
      { href: "/analytics",  label: "My Analytics",   icon: BarChart2, exact: false },
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
        background: "rgba(255,255,255,0.70)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        borderRight: "1px solid rgba(255,255,255,0.45)",
      }}
    >
      {/* Logo */}
      <div className="px-5 pt-6 pb-5" style={{ borderBottom: "1px solid rgba(255,255,255,0.5)" }}>
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
      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin space-y-5">
        {navSections.map((section) => (
          <div key={section.label}>
            <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em]"
               style={{ color: "rgba(13,27,42,0.3)" }}>
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
                        ? {
                            background: "rgba(232,98,42,0.08)",
                            color: "#E8622A",
                            fontWeight: 600,
                            borderLeft: "2px solid #E8622A",
                            paddingLeft: "8px",
                          }
                        : { color: "#6B7280" }
                    }
                    onMouseEnter={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.color = "#0D1B2A";
                    }}
                    onMouseLeave={e => {
                      if (!active) (e.currentTarget as HTMLElement).style.color = "#6B7280";
                    }}
                  >
                    <Icon
                      size={15}
                      strokeWidth={active ? 2.5 : 2}
                      style={{
                        color: active ? "#E8622A" : "#9CA3AF",
                        flexShrink: 0,
                      }}
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
          <p className="px-2 mb-1.5 text-[10px] font-bold uppercase tracking-[0.15em]"
             style={{ color: "rgba(13,27,42,0.3)" }}>Admin</p>
          <Link
            href="/admin"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-100"
            style={
              pathname.startsWith("/admin")
                ? { background: "rgba(232,98,42,0.08)", color: "#E8622A", fontWeight: 600, borderLeft: "2px solid #E8622A", paddingLeft: "8px" }
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
      <div className="px-3 pb-2" style={{ borderTop: "1px solid rgba(255,255,255,0.5)" }}>
        <div className="pt-2">
          <Link
            href="/settings"
            className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-100"
            style={
              pathname === "/settings"
                ? { background: "rgba(232,98,42,0.08)", color: "#E8622A", fontWeight: 600, borderLeft: "2px solid #E8622A", paddingLeft: "8px" }
                : { color: "#6B7280" }
            }
            onMouseEnter={e => {
              if (pathname !== "/settings") (e.currentTarget as HTMLElement).style.color = "#0D1B2A";
            }}
            onMouseLeave={e => {
              if (pathname !== "/settings") (e.currentTarget as HTMLElement).style.color = "#6B7280";
            }}
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
      <div className="px-4 py-3.5" style={{ borderTop: "1px solid rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.4)" }}>
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
              className="text-[11px] transition-colors flex-shrink-0 font-medium"
              style={{ color: "#D1D5DB" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
              onMouseLeave={e => (e.currentTarget.style.color = "#D1D5DB")}
            >
              ↪
            </button>
          </SignOutButton>
        </div>
      </div>
    </aside>
  );
}
