"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { HeroLogo } from "@/components/hero/HeroLogo";
import { stopPortalAuthRuntime } from "@/lib/integrate/auth/runtime";
import { clearAuthSession, getStoredUser } from "@/lib/integrate/auth/storage";
import type { UserRole } from "@/lib/integrate/auth/types";
import { cn } from "@/lib/utils";

const SIDEBAR_STORAGE_KEY = "hols-portal-sidebar-open";
const SIDEBAR_WIDTH = "w-60";
const SIDEBAR_OFFSET = "lg:ml-60";

export type PortalNavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
};

type PortalShellProps = {
  role: UserRole;
  title: string;
  subtitle?: string;
  nav: PortalNavItem[];
  children: React.ReactNode;
};

function NavIcon({ children }: { children: React.ReactNode }) {
  return <span className="flex h-5 w-5 shrink-0 items-center justify-center opacity-80">{children}</span>;
}

export function PortalShell({ role, title, subtitle, nav, children }: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const user = getStoredUser();

  const displayName =
    user?.profile?.first_name && user?.profile?.last_name
      ? `${user.profile.first_name} ${user.profile.last_name}`
      : "Account";

  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const stored = localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored !== null) {
        setSidebarOpen(stored === "true");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen));
  }, [sidebarOpen]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setSidebarOpen(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  function handleLogout() {
    stopPortalAuthRuntime();
    clearAuthSession();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-svh bg-[#F5F7FA] text-primary">
      <div className="flex min-h-svh">
        <aside
          aria-hidden={!sidebarOpen}
          className={cn(
            "fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col border-r border-black/[0.06] bg-[#F5F7FA] transition-transform duration-200 ease-out",
            SIDEBAR_WIDTH,
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/" className="min-w-0">
              <HeroLogo variant="dark" className="h-7 max-w-[8.5rem]" linked={false} />
            </Link>
            <button
              type="button"
              aria-label="Close sidebar"
              onClick={() => setSidebarOpen(false)}
              className="rounded-md p-1.5 text-primary/40 transition hover:bg-black/[0.04] hover:text-primary lg:hidden"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 space-y-0.5 px-2.5 pb-4" aria-label="Portal navigation">
            <p className="mb-2 px-2.5 text-[11px] font-medium uppercase tracking-[0.14em] text-primary/35">
              {role}
            </p>
            {nav.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    if (typeof window !== "undefined" && window.innerWidth < 1024) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={cn(
                    "group flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[13px] font-medium transition",
                    active
                      ? "bg-primary/[0.08] text-primary"
                      : "text-primary/55 hover:bg-black/[0.03] hover:text-primary",
                  )}
                >
                  <span className={cn(active ? "text-primary" : "text-primary/45 group-hover:text-primary/70")}>
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-black/[0.06] p-3">
            <div className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-[11px] font-semibold text-white">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-medium text-primary">{displayName}</p>
                <p className="truncate text-[11px] capitalize text-primary/40">{role}</p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="rounded-md p-1.5 text-primary/40 transition hover:bg-black/[0.04] hover:text-primary"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <path d="M16 17l5-5-5-5M21 12H9" />
                </svg>
              </button>
            </div>
          </div>
        </aside>

        {sidebarOpen ? (
          <button
            type="button"
            aria-label="Close sidebar backdrop"
            className="fixed inset-0 z-30 bg-black/20 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        ) : null}

        <div
          className={cn(
            "flex min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-out",
            sidebarOpen ? SIDEBAR_OFFSET : "ml-0",
          )}
        >
          <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-black/[0.06] bg-[#F5F7FA]/90 px-4 backdrop-blur-md md:px-6">
            <button
              type="button"
              aria-label={sidebarOpen ? "Collapse sidebar" : "Open sidebar"}
              aria-expanded={sidebarOpen}
              onClick={() => setSidebarOpen((open) => !open)}
              className="rounded-md p-1.5 text-primary/45 transition hover:bg-black/[0.04] hover:text-primary"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M4 7h16M4 12h10M4 17h16" />
              </svg>
            </button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-[15px] font-semibold tracking-tight text-primary">{title}</h1>
              {subtitle ? <p className="truncate text-xs text-primary/45">{subtitle}</p> : null}
            </div>
          </header>

          <main className="flex-1 px-4 py-6 md:px-6 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}

export const portalIcons = {
  dashboard: (
    <NavIcon>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 13h6V4H4v9zm10 7h6V11h-6v9zM4 20h6v-5H4v5zm10-9h6V4h-6v7z" />
      </svg>
    </NavIcon>
  ),
  courses: (
    <NavIcon>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    </NavIcon>
  ),
  membership: (
    <NavIcon>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    </NavIcon>
  ),
  payment: (
    <NavIcon>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    </NavIcon>
  ),
  profile: (
    <NavIcon>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.7-3.3 4.3-5 8-5s6.3 1.7 8 5" />
      </svg>
    </NavIcon>
  ),
  users: (
    <NavIcon>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    </NavIcon>
  ),
  plans: (
    <NavIcon>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    </NavIcon>
  ),
  referrals: (
    <NavIcon>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M10 13a5 5 0 0 1 7 0l1 1a5 5 0 0 1 0 7l-1 1" />
        <path d="M14 11a5 5 0 0 0-7 0l-1 1a5 5 0 0 0 0 7l1 1" />
      </svg>
    </NavIcon>
  ),
  earnings: (
    <NavIcon>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H14a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    </NavIcon>
  ),
  calculator: (
    <NavIcon>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M8 6h8M8 10h8M8 14h2M12 14h2M16 14h2M8 18h2M12 18h2M16 18h2" />
      </svg>
    </NavIcon>
  ),
};
