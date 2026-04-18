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
  background: "rgba(251, 247, 242, 0.97)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  borderRadius: 30,
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 4px 28px rgba(0,0,0,0.12), 0 1px 6px rgba(0,0,0,0.06)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  padding: "14px 0",
  gap: 4,
  width: 62,
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
          width: 38,
          height: 38,
          background: "#D4795C",
          borderRadius: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 12,
          boxShadow: "0 2px 10px rgba(212,121,92,0.35)",
          flexShrink: 0,
        }}
      >
        <Sparkles size={17} color="white" strokeWidth={2.5} />
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
              width: 46,
              height: 46,
              borderRadius: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: active ? "rgba(75,191,176,0.12)" : "transparent",
              color: active ? "#4BBFB0" : "#9CA3AF",
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
            <Icon size={21} strokeWidth={active ? 2.5 : 1.75} />
          </Link>
        );
      })}

      {/* Admin icon */}
      {isAdmin && (
        <Link
          href="/admin"
          title="Admin Dashboard"
          style={{
            width: 46,
            height: 46,
            borderRadius: 13,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: pathname.startsWith("/admin") ? "rgba(75,191,176,0.12)" : "transparent",
            color: pathname.startsWith("/admin") ? "#4BBFB0" : "#9CA3AF",
            transition: "all 0.12s",
            flexShrink: 0,
          }}
        >
          <ShieldCheck size={21} strokeWidth={1.75} />
        </Link>
      )}

      {/* Spacer */}
      <div style={{ flex: 1, minHeight: 12 }} />

      {/* Settings */}
      <Link
        href="/settings"
        title="Settings"
        style={{
          width: 46,
          height: 46,
          borderRadius: 13,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: pathname === "/settings" ? "rgba(75,191,176,0.12)" : "transparent",
          color: pathname === "/settings" ? "#4BBFB0" : "#9CA3AF",
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
        <Settings size={21} strokeWidth={1.75} />
      </Link>

      {/* User avatar */}
      <SignOutButton>
        <button
          title={`Sign out (${user?.firstName || ""})`}
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            overflow: "hidden",
            background: "#D4795C",
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
            <span style={{ color: "white", fontSize: 11, fontWeight: 800 }}>{initials}</span>
          )}
        </button>
      </SignOutButton>

    </div>
  );
}
