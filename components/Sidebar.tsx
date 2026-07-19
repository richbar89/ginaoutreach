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
  Send,
  Plus,
  type LucideIcon,
} from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

type NavItem = { href: string; label: string; icon: LucideIcon; exact?: boolean; tourId?: string };

// Grouped by intent: find brands → reach out → manage the outcome
const NAV_GROUPS: { label: string | null; items: NavItem[] }[] = [
  {
    label: null,
    items: [
      { href: "/dashboard", label: "Today", icon: LayoutDashboard, exact: true, tourId: "tour-dashboard" },
    ],
  },
  {
    label: "Find",
    items: [
      { href: "/contacts", label: "Contacts",   icon: Users,     tourId: "tour-contacts" },
      { href: "/ads",      label: "Ad Signals", icon: BarChart3, tourId: "tour-ads" },
    ],
  },
  {
    label: "Reach",
    items: [
      { href: "/campaigns", label: "Campaigns", icon: Megaphone, tourId: "tour-campaigns" },
      { href: "/send",      label: "Compose",   icon: Send },
      { href: "/inbox",     label: "Inbox",     icon: Inbox,     tourId: "tour-inbox" },
    ],
  },
  {
    label: "Manage",
    items: [
      { href: "/pipeline",  label: "Pipeline",  icon: TrendingUp, tourId: "tour-pipeline" },
      { href: "/media-kit", label: "Media Kit", icon: BookOpen,   tourId: "tour-media-kit" },
    ],
  },
];

function NavLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      id={item.tourId}
      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl flex-shrink-0 transition-all duration-200 ${
        active
          ? "bg-white text-navy-900 shadow-[0_1px_6px_rgba(0,0,0,0.06)] border border-black/[0.04]"
          : "text-navy-500 border border-transparent hover:bg-black/[0.03] hover:text-navy-800"
      }`}
    >
      <Icon size={15} strokeWidth={active ? 2.2 : 1.75} className={`flex-shrink-0 ${active ? "text-coral-500" : ""}`} />
      <span className={`text-[13px] tracking-[-0.01em] ${active ? "font-semibold" : "font-medium"}`}>
        {item.label}
      </span>
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const isAdmin = !!user && user.id === ADMIN_USER_ID;
  const initials = (user?.fullName || user?.firstName || "U")
    .split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname.startsWith(item.href);

  return (
    <div className="glass flex flex-col w-[200px] h-full rounded-[20px] px-2.5 py-4 shadow-[0_2px_16px_rgba(0,0,0,0.05)] overflow-y-auto scrollbar-thin">

      {/* Wordmark */}
      <div className="px-3 pt-0.5 pb-4">
        <span className="font-display text-[24px] font-bold leading-none tracking-[-0.04em] select-none bg-gradient-to-r from-coral-400 to-coral-600 bg-clip-text text-transparent">
          collabi
        </span>
      </div>

      {/* Primary action */}
      <Link
        href="/campaigns/new"
        className="btn-primary !px-3 !py-2 text-[13px] mb-1.5 mx-0.5"
      >
        <Plus size={14} strokeWidth={2.5} />
        New Campaign
      </Link>

      {/* Nav groups */}
      {NAV_GROUPS.map((group, gi) => (
        <div key={gi} className="flex flex-col gap-0.5">
          {group.label ? (
            <p className="px-3 pt-4 pb-1 text-[10px] font-semibold uppercase tracking-[0.09em] text-navy-400 select-none">
              {group.label}
            </p>
          ) : (
            <div className="pt-2" />
          )}
          {group.items.map(item => (
            <NavLink key={item.href} item={item} active={isActive(item)} />
          ))}
        </div>
      ))}

      {/* Spacer */}
      <div className="flex-1 min-h-4" />

      {/* Admin + Settings */}
      {isAdmin && (
        <NavLink
          item={{ href: "/admin", label: "Admin", icon: ShieldCheck }}
          active={pathname.startsWith("/admin")}
        />
      )}
      <NavLink
        item={{ href: "/settings", label: "Settings", icon: Settings }}
        active={pathname === "/settings"}
      />

      {/* User + sign out */}
      <div className="flex items-center gap-2 px-3 pt-3 pb-0.5 mt-2 border-t border-black/[0.06]">
        <div className="w-7 h-7 rounded-full overflow-hidden bg-coral-500 flex-shrink-0 flex items-center justify-center">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt={initials} className="w-full h-full object-cover" />
          ) : (
            <span className="text-white text-[10px] font-bold">{initials}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-navy-900 tracking-[-0.01em] truncate m-0">
            {user?.firstName || user?.fullName || "Account"}
          </p>
        </div>
        <SignOutButton>
          <button
            title="Sign out"
            className="bg-transparent border-0 cursor-pointer p-1 rounded-md flex items-center text-navy-300 hover:text-red-500 transition-colors duration-200"
          >
            <LogOut size={13} />
          </button>
        </SignOutButton>
      </div>

    </div>
  );
}
