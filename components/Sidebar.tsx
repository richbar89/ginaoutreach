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
  Sparkles,
  ShieldCheck,
  LineChart,
} from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",      icon: LayoutDashboard, exact: true },
  { href: "/contacts",   label: "Contacts",        icon: Users,           exact: false },
  { href: "/inbox",      label: "Inbox",           icon: Inbox,           exact: false },
  { href: "/campaigns",  label: "Campaigns",       icon: Megaphone,       exact: false },
  { href: "/pipeline",   label: "Deal Pipeline",   icon: TrendingUp,      exact: false },
  { href: "/media-kit",  label: "Media Kit",       icon: BookOpen,        exact: false },
  { href: "/ads",        label: "Meta Ad Alerts",  icon: BarChart3,       exact: false },
  { href: "/analytics",  label: "My Analytics",    icon: LineChart,       exact: false },
];

const PILL: React.CSSProperties = {
  background: "rgba(255,255,255,0.88)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: 26,
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 4px 24px rgba(99,102,241,0.15), 0 1px 4px rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "12px 0",
  gap: 2,
  width: 52,
};

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = !!user && user.id === ADMIN_USER_ID;
  const initials = (user?.fullName || user?.firstName || "U")
    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={PILL}>

      {/* Logo mark */}
      <div
        style={{
          width: 32,
          height: 32,
          background: "linear-gradient(135deg, #EA580C, #FB923C)",
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
          boxShadow: "0 2px 8px rgba(234,88,12,0.35)",
          flexShrink: 0,
        }}
      >
        <Sparkles size={14} color="white" strokeWidth={2.5} />
      </div>

      {/* Nav icons */}
      {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            title={label}
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: active ? "rgba(234,88,12,0.10)" : "transparent",
              color: active ? "#EA580C" : "#9CA3AF",
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
                (e.currentTarget as HTMLElement).style.color = "#9CA3AF";
              }
            }}
          >
            <Icon size={17} strokeWidth={active ? 2.5 : 1.75} />
          </Link>
        );
      })}

      {/* Admin icon */}
      {isAdmin && (
        <Link
          href="/admin"
          title="Admin Dashboard"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: pathname.startsWith("/admin") ? "rgba(234,88,12,0.10)" : "transparent",
            color: pathname.startsWith("/admin") ? "#EA580C" : "#9CA3AF",
            transition: "all 0.12s",
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={17} strokeWidth={1.75} />
        </Link>
      )}

      {/* Spacer */}
      <div style={{ flex: 1, minHeight: 12 }} />

      {/* Settings */}
      <Link
        href="/settings"
        title="Settings"
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: pathname === "/settings" ? "rgba(234,88,12,0.10)" : "transparent",
          color: pathname === "/settings" ? "#EA580C" : "#9CA3AF",
          transition: "all 0.12s",
          flexShrink: 0,
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
            (e.currentTarget as HTMLElement).style.color = "#9CA3AF";
          }
        }}
      >
        <Settings size={17} strokeWidth={1.75} />
      </Link>

      {/* User avatar */}
      <SignOutButton>
        <button
          title={`Sign out (${user?.firstName || ""})`}
          style={{
            width: 30,
            height: 30,
            borderRadius: "50%",
            overflow: "hidden",
            background: "#EA580C",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginTop: 4,
            flexShrink: 0,
          }}
        >
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <span style={{ color: "white", fontSize: 10, fontWeight: 800 }}>{initials}</span>
          )}
        </button>
      </SignOutButton>

    </div>
  );
}
