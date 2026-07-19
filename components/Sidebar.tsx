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
  type LucideIcon,
} from "lucide-react";
import { useUser, SignOutButton } from "@clerk/nextjs";

const ADMIN_USER_ID = process.env.NEXT_PUBLIC_ADMIN_USER_ID;

const NAV_ITEMS = [
  { href: "/dashboard",  label: "Dashboard",    icon: LayoutDashboard, exact: true,  tourId: "tour-dashboard"  },
  { href: "/contacts",   label: "Contacts",     icon: Users,           exact: false, tourId: "tour-contacts"   },
  { href: "/inbox",      label: "Inbox",        icon: Inbox,           exact: false, tourId: "tour-inbox"      },
  { href: "/campaigns",  label: "Campaigns",    icon: Megaphone,       exact: false, tourId: "tour-campaigns"  },
  { href: "/pipeline",   label: "Pipeline",     icon: TrendingUp,      exact: false, tourId: "tour-pipeline"   },
  { href: "/media-kit",  label: "Media Kit",    icon: BookOpen,        exact: false, tourId: "tour-media-kit"  },
  { href: "/ads",        label: "Meta Ads",     icon: BarChart3,       exact: false, tourId: "tour-ads"        },
];

function NavLink({
  href,
  label,
  icon: Icon,
  active,
  tourId,
}: {
  href: string;
  label: string;
  icon: LucideIcon;
  active: boolean;
  tourId?: string;
}) {
  return (
    <Link
      href={href}
      id={tourId}
      className={`flex items-center gap-2.5 px-2.5 py-[9px] rounded-xl flex-shrink-0 transition-all duration-200 ${
        active
          ? "bg-coral-500/10 text-coral-600"
          : "text-navy-500 hover:bg-black/[0.04] hover:text-navy-700"
      }`}
    >
      <Icon size={16} strokeWidth={active ? 2.4 : 1.75} className="flex-shrink-0" />
      <span className={`text-[13px] tracking-[-0.01em] ${active ? "font-semibold" : "font-medium"}`}>
        {label}
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

  return (
    <div className="glass flex flex-col gap-0.5 w-[152px] h-full rounded-[20px] px-2 py-3.5 shadow-[0_2px_16px_rgba(0,0,0,0.05)]">

      {/* Wordmark */}
      <div className="px-2 pt-1.5 pb-3.5 text-center">
        <span className="font-display text-[26px] font-bold leading-none tracking-[-0.04em] select-none bg-gradient-to-r from-coral-400 to-coral-600 bg-clip-text text-transparent">
          collabi
        </span>
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map(({ href, label, icon, exact, tourId }) => (
        <NavLink
          key={href}
          href={href}
          label={label}
          icon={icon}
          tourId={tourId}
          active={exact ? pathname === href : pathname.startsWith(href)}
        />
      ))}

      {/* Admin */}
      {isAdmin && (
        <NavLink
          href="/admin"
          label="Admin"
          icon={ShieldCheck}
          active={pathname.startsWith("/admin")}
        />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <NavLink
        href="/settings"
        label="Settings"
        icon={Settings}
        active={pathname === "/settings"}
      />

      {/* User + sign out */}
      <div className="flex items-center gap-2 px-2.5 pt-3 pb-0.5 mt-1 border-t border-black/[0.06]">
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
