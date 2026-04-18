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

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = !!user && user.id === ADMIN_USER_ID;
  const initials = (user?.fullName || user?.firstName || "U")
    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div style={{
      width: 220,
      flexShrink: 0,
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      background: "var(--bg)",
      borderRight: "1px solid var(--border)",
    }}>

      {/* Logo */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: "var(--bg)", fontSize: 13, fontWeight: 900, fontFamily: "'Inter', sans-serif" }}>C</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 900, color: "var(--text)", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "'Inter', sans-serif" }}>
            Colla<span style={{ fontFamily: "'Instrument Serif', serif", fontStyle: "italic", fontWeight: 400, textTransform: "lowercase", color: "var(--accent)" }}>b</span>i
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "9px 24px",
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                letterSpacing: active ? "0.06em" : "0.01em",
                textTransform: active ? "uppercase" : "none",
                color: active ? "var(--bg)" : "var(--text-muted)",
                background: active ? "var(--ink)" : "transparent",
                textDecoration: "none",
                transition: "background 120ms ease-out, color 120ms ease-out",
                fontFamily: "'Inter', sans-serif",
              }}
              onMouseEnter={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "var(--surface)";
                  (e.currentTarget as HTMLElement).style.color = "var(--text)";
                }
              }}
              onMouseLeave={e => {
                if (!active) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
                }
              }}
            >
              <Icon size={15} strokeWidth={active ? 2.5 : 1.75} />
              {label}
            </Link>
          );
        })}

        {isAdmin && (
          <Link
            href="/admin"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 11,
              padding: "9px 24px",
              fontSize: 12,
              fontWeight: pathname.startsWith("/admin") ? 700 : 500,
              letterSpacing: pathname.startsWith("/admin") ? "0.06em" : "0.01em",
              textTransform: pathname.startsWith("/admin") ? "uppercase" : "none",
              color: pathname.startsWith("/admin") ? "var(--bg)" : "var(--text-muted)",
              background: pathname.startsWith("/admin") ? "var(--ink)" : "transparent",
              textDecoration: "none",
              transition: "background 120ms ease-out, color 120ms ease-out",
              fontFamily: "'Inter', sans-serif",
            }}
            onMouseEnter={e => {
              if (!pathname.startsWith("/admin")) {
                (e.currentTarget as HTMLElement).style.background = "var(--surface)";
                (e.currentTarget as HTMLElement).style.color = "var(--text)";
              }
            }}
            onMouseLeave={e => {
              if (!pathname.startsWith("/admin")) {
                (e.currentTarget as HTMLElement).style.background = "transparent";
                (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
              }
            }}
          >
            <ShieldCheck size={15} strokeWidth={1.75} />
            Admin
          </Link>
        )}
      </nav>

      {/* Bottom: settings + user */}
      <div style={{ borderTop: "1px solid var(--border)", flexShrink: 0 }}>
        <Link
          href="/settings"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            padding: "9px 24px",
            fontSize: 12,
            fontWeight: pathname === "/settings" ? 700 : 500,
            letterSpacing: pathname === "/settings" ? "0.06em" : "0.01em",
            textTransform: pathname === "/settings" ? "uppercase" : "none",
            color: pathname === "/settings" ? "var(--bg)" : "var(--text-muted)",
            background: pathname === "/settings" ? "var(--ink)" : "transparent",
            textDecoration: "none",
            transition: "background 120ms ease-out, color 120ms ease-out",
            fontFamily: "'Inter', sans-serif",
          }}
          onMouseEnter={e => {
            if (pathname !== "/settings") {
              (e.currentTarget as HTMLElement).style.background = "var(--surface)";
              (e.currentTarget as HTMLElement).style.color = "var(--text)";
            }
          }}
          onMouseLeave={e => {
            if (pathname !== "/settings") {
              (e.currentTarget as HTMLElement).style.background = "transparent";
              (e.currentTarget as HTMLElement).style.color = "var(--text-muted)";
            }
          }}
        >
          <Settings size={15} strokeWidth={1.75} />
          Settings
        </Link>

        <SignOutButton>
          <button
            title={`Sign out (${user?.firstName || ""})`}
            style={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 24px",
              background: "transparent",
              border: "none",
              borderTop: "1px solid var(--border-soft)",
              cursor: "pointer",
              textAlign: "left",
              transition: "background 120ms ease-out",
            }}
            onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "var(--surface)"}
            onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
          >
            <div style={{ width: 28, height: 28, background: "var(--ink)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, overflow: "hidden", borderRadius: 2 }}>
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={initials} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ color: "var(--bg)", fontSize: 10, fontWeight: 900, fontFamily: "'Inter', sans-serif" }}>{initials}</span>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "var(--text)", letterSpacing: "0.02em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: 0, fontFamily: "'Inter', sans-serif" }}>
                {user?.fullName || user?.firstName || "Account"}
              </p>
              <p style={{ fontSize: 10, color: "var(--text-dim)", marginTop: 1, fontFamily: "'Inter', sans-serif" }}>Sign out</p>
            </div>
          </button>
        </SignOutButton>
      </div>

    </div>
  );
}
