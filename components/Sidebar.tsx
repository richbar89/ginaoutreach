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
  BarChart3,
  BookOpen,
  ShieldCheck,
  LogOut,
} from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard, exact: true },
  { href: "/contacts",   label: "Contacts",     icon: Users,           exact: false },
  { href: "/inbox",      label: "Inbox",        icon: Inbox,           exact: false },
  { href: "/campaigns",  label: "Campaigns",    icon: Megaphone,       exact: false },
  { href: "/pipeline",   label: "Pipeline",     icon: TrendingUp,      exact: false },
  { href: "/media-kit",  label: "Media Kit",    icon: BookOpen,        exact: false },
  { href: "/ads",        label: "Meta Ads",     icon: BarChart3,       exact: false },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = !!user && user.id === ADMIN_USER_ID;
  const initials = (user?.fullName || user?.firstName || "U")
    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{
      background: "#FFFFFF",
      borderRadius: 20,
      border: "1px solid rgba(0,0,0,0.07)",
      boxShadow: "0 2px 12px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.04)",
      display: "flex",
      flexDirection: "column",
      padding: "14px 8px",
      gap: 2,
      width: 152,
      height: "100%",
    }}>

      {/* Wordmark */}
      <div style={{ padding: "6px 8px 14px", textAlign: "center" }}>
        <span style={{
          fontFamily: "var(--font-comfortaa), system-ui, sans-serif",
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1,
          display: "block",
          background: "linear-gradient(90deg, #FFAE7E 0%, #E8622A 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
          userSelect: "none",
        }}>
          collabi
        </span>
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              padding: "9px 10px",
              borderRadius: 11,
              background: active ? "rgba(232,98,42,0.10)" : "transparent",
              color: active ? "#E8622A" : "#6B7280",
              textDecoration: "none",
              transition: "all 0.12s",
              flexShrink: 0,
            }}
            onMouseEnter={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)";
                (e.currentTarget as HTMLElement).style.color = "#374151";
              }
            }}
            onMouseLeave={e => {
              if (!active) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "#6B7280";
              }
            }}
          >
            <Icon size={16} strokeWidth={active ? 2.5 : 1.75} style={{ flexShrink: 0 }} />
            <span style={{
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              letterSpacing: "-0.01em",
            }}>
              {label}
            </span>
          </Link>
        );
      })}

      {/* Admin */}
      {isAdmin && (
        <Link
          href="/admin"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            padding: "9px 10px",
            borderRadius: 11,
            background: pathname.startsWith("/admin") ? "rgba(232,98,42,0.10)" : "transparent",
            color: pathname.startsWith("/admin") ? "#E8622A" : "#6B7280",
            textDecoration: "none",
            transition: "all 0.12s",
          }}
        >
          <ShieldCheck size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12.5, fontWeight: 500, letterSpacing: "-0.01em" }}>Admin</span>
        </Link>
      )}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Settings */}
      <Link
        href="/settings"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          padding: "9px 10px",
          borderRadius: 11,
          background: pathname === "/settings" ? "rgba(232,98,42,0.10)" : "transparent",
          color: pathname === "/settings" ? "#E8622A" : "#6B7280",
          textDecoration: "none",
          transition: "all 0.12s",
        }}
        onMouseEnter={e => {
          if (pathname !== "/settings") {
            (e.currentTarget as HTMLElement).style.background = "rgba(0,0,0,0.04)";
            (e.currentTarget as HTMLElement).style.color = "#374151";
          }
        }}
        onMouseLeave={e => {
          if (pathname !== "/settings") {
            (e.currentTarget as HTMLElement).style.background = "transparent";
            (e.currentTarget as HTMLElement).style.color = "#6B7280";
          }
        }}
      >
        <Settings size={16} strokeWidth={1.75} style={{ flexShrink: 0 }} />
        <span style={{ fontSize: 12.5, fontWeight: 500, letterSpacing: "-0.01em" }}>Settings</span>
      </Link>

      {/* User + sign out */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 10px 2px", borderTop: "1px solid rgba(0,0,0,0.06)", marginTop: 4 }}>
        <div style={{
          width: 28, height: 28, borderRadius: "50%", overflow: "hidden",
          background: "#E8622A", flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ color: "white", fontSize: 10, fontWeight: 800 }}>{initials}</span>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: "#111827", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0 }}>
            {user?.firstName || user?.fullName || "Account"}
          </p>
        </div>
        <SignOutButton>
          <button title="Sign out" style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#9CA3AF", display: "flex", alignItems: "center", borderRadius: 6, transition: "color 0.12s" }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#EF4444"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = "#9CA3AF"}
          >
            <LogOut size={13} />
          </button>
        </SignOutButton>
      </div>

    </div>
  );
}
