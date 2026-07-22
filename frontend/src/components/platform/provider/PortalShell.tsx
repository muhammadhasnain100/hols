"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { HeroLogo } from "@/components/hero/HeroLogo";
import { stopPortalAuthRuntime } from "@/lib/integrate/auth/runtime";
import { clearAuthSession } from "@/lib/integrate/auth/storage";
import type { UserRole } from "@/lib/integrate/auth/types";
import {
  portalNavFlyoutLabelClass,
  portalNavItemClass,
  portalPageDescClass,
  portalPageTitleClass,
} from "@/components/platform/provider/portal-styles";
import { cn } from "@/lib/utils";

const MOBILE_OPEN_KEY = "hols-portal-sidebar-open";
const COLLAPSED_KEY = "hols-portal-sidebar-collapsed";
const THEME_KEY = "hols-portal-theme";

type PortalTheme = "light" | "dark";

export type PortalNavChild = {
  label: string;
  href: string;
  exact?: boolean;
};

export type PortalNavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  exact?: boolean;
  children?: PortalNavChild[];
};

type PortalShellProps = {
  role: UserRole;
  title: string;
  subtitle?: string;
  eyebrow?: string;
  /** When false, skip in-page title (use for pages with their own hero heading). */
  showPageHeader?: boolean;
  /** When true, skip the sticky top chrome so the page can own a fixed header. */
  contentFlush?: boolean;
  /** Full-bleed brand gradient on the content screen (no inset “cart” panel). */
  brandBackdrop?: boolean;
  nav: PortalNavItem[];
  children: React.ReactNode;
};

function roleEyebrow(role: UserRole): string {
  if (role === "admin") return "Admin portal";
  if (role === "affiliate") return "Affiliate portal";
  return "Student portal";
}

function NavIcon({ children }: { children: React.ReactNode }) {
  return (
    <span className="portal-nav-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-current transition-colors duration-200">
      {children}
    </span>
  );
}

function isItemActive(pathname: string, href: string, exact?: boolean): boolean {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isNavItemActive(pathname: string, item: PortalNavItem): boolean {
  if (isItemActive(pathname, item.href, item.exact)) return true;
  return item.children?.some((child) => isItemActive(pathname, child.href)) ?? false;
}

export function PortalShell({
  role,
  title,
  subtitle,
  eyebrow,
  showPageHeader = true,
  contentFlush = false,
  brandBackdrop = false,
  nav,
  children,
}: PortalShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState<PortalTheme>(() => {
    if (typeof window === "undefined") return "dark";
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "dark" || stored === "light") return stored;
    return "dark";
  });
  const [flyoutHref, setFlyoutHref] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());

  const sidebarOffset = collapsed
    ? "lg:ml-[4.75rem]"
    : "lg:ml-[16rem]";
  const pageEyebrow = eyebrow ?? roleEyebrow(role);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedMobile = localStorage.getItem(MOBILE_OPEN_KEY);
      const storedCollapsed = localStorage.getItem(COLLAPSED_KEY);
      const storedTheme = localStorage.getItem(THEME_KEY);
      if (storedMobile !== null) setMobileOpen(storedMobile === "true");
      if (storedCollapsed !== null) setCollapsed(storedCollapsed === "true");
      if (storedTheme === "dark" || storedTheme === "light") {
        setTheme(storedTheme);
      } else {
        localStorage.setItem(THEME_KEY, "dark");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next: PortalTheme = current === "light" ? "dark" : "light";
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(MOBILE_OPEN_KEY, String(mobileOpen));
  }, [mobileOpen]);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    if (collapsed) setExpandedGroups(new Set());
  }, [collapsed]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        setMobileOpen(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const next = new Set<string>();
      nav.forEach((item) => {
        if (item.children?.some((child) => isItemActive(pathname, child.href))) {
          next.add(item.href);
        }
      });
      if (next.size > 0) setExpandedGroups(next);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [pathname, nav]);

  useEffect(() => {
    function handleOpenSidebar() {
      setMobileOpen(true);
    }
    window.addEventListener("hols-portal-open-sidebar", handleOpenSidebar);
    return () => window.removeEventListener("hols-portal-open-sidebar", handleOpenSidebar);
  }, []);

  const handleLogout = useCallback(() => {
    stopPortalAuthRuntime();
    clearAuthSession();
    router.push("/login");
    router.refresh();
  }, [router]);

  const closeMobile = useCallback(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setMobileOpen(false);
    }
  }, []);

  const toggleGroup = useCallback((href: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href);
      else next.add(href);
      return next;
    });
  }, []);

  function renderNavLink(item: PortalNavItem, opts?: { inFlyout?: boolean; child?: PortalNavChild }) {
    const href = opts?.child?.href ?? item.href;
    const label = opts?.child?.label ?? item.label;
    const active = opts?.child
      ? isItemActive(pathname, opts.child.href, opts.child.exact)
      : isNavItemActive(pathname, item);
    const showIcon = !opts?.inFlyout && !opts?.child;

    return (
      <Link
        key={opts?.child?.href ?? item.href}
        href={href}
        onClick={closeMobile}
        className={cn(
          "portal-nav-item group relative flex items-center transition-colors duration-200",
          portalNavItemClass,
          opts?.inFlyout ? "h-9 gap-2.5 rounded-xl px-3" : collapsed ? "h-11 justify-center rounded-xl px-0" : "h-11 gap-3 rounded-xl px-3.5",
          active && "is-active",
        )}
      >
        {showIcon ? item.icon : null}
        {(!collapsed || opts?.inFlyout) && <span className="truncate">{label}</span>}
        {!opts?.inFlyout && !collapsed && item.children?.length ? (
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn(
              "ml-auto shrink-0 text-[color:var(--sidebar-text)] opacity-60 transition-transform",
              expandedGroups.has(item.href) && "rotate-90",
            )}
            aria-hidden
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
        ) : null}
      </Link>
    );
  }

  return (
    <div
      className="portal-shell min-h-svh text-primary"
      data-theme={theme}
      data-role={role}
      data-backdrop={brandBackdrop ? "brand" : undefined}
      style={brandBackdrop ? undefined : { background: "var(--portal-page-bg)" }}
    >
      <div className="flex min-h-svh">
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close sidebar backdrop"
            className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside
          aria-hidden={!mobileOpen}
          className={cn(
            "portal-sidebar-glass portal-sidebar-flush fixed inset-y-0 left-0 z-40 flex shrink-0 flex-col overflow-visible transition-all duration-300 ease-out",
            collapsed ? "w-[4.75rem]" : "w-[16rem]",
            mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          )}
        >
          <div
            className={cn(
              "flex shrink-0 items-center",
              collapsed ? "h-16 justify-center px-2" : "h-16 px-5",
            )}
          >
            <HeroLogo
              variant={theme === "dark" ? "light" : "dark"}
              compact={collapsed}
              linked={false}
              className={cn(collapsed ? "h-7 w-7" : "h-7 max-w-[8.5rem]")}
            />
          </div>

          <button
            type="button"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={() => setCollapsed((value) => !value)}
            className="portal-sidebar-toggle absolute -right-3 top-1/2 z-50 hidden h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full lg:flex"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className={cn("transition-transform", collapsed && "rotate-180")}
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-visible px-3 pb-3" aria-label="Portal navigation">
            {nav.map((item) => {
              const hasChildren = (item.children?.length ?? 0) > 0;
              const groupOpen = expandedGroups.has(item.href);
              const active = isNavItemActive(pathname, item);

              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => {
                    if (collapsed) setFlyoutHref(item.href);
                  }}
                  onMouseLeave={() => {
                    if (collapsed) setFlyoutHref((current) => (current === item.href ? null : current));
                  }}
                >
                  {hasChildren && !collapsed ? (
                    <button
                      type="button"
                      onClick={() => toggleGroup(item.href)}
                      className={cn(
                        "portal-nav-item group relative flex w-full items-center rounded-xl transition-colors duration-200",
                        portalNavItemClass,
                        "h-11 gap-3 px-3.5",
                        active && "is-active",
                      )}
                    >
                      {item.icon}
                      <span className="truncate">{item.label}</span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        className={cn("ml-auto shrink-0 text-[color:var(--sidebar-text)] opacity-60 transition-transform", groupOpen && "rotate-90")}
                        aria-hidden
                      >
                        <path d="M9 18l6-6-6-6" />
                      </svg>
                    </button>
                  ) : (
                    renderNavLink(item)
                  )}

                  {!collapsed && hasChildren && groupOpen ? (
                    <div className="relative ml-5 mt-0.5 space-y-0.5 border-l border-[color:var(--sidebar-divider)] pl-3">
                      {item.children!.map((child) => renderNavLink(item, { inFlyout: true, child }))}
                    </div>
                  ) : null}

                  {collapsed && flyoutHref === item.href ? (
                    <div
                      className="portal-sidebar-flyout absolute left-[calc(100%+0.65rem)] top-0 z-50 min-w-[11rem] rounded-2xl p-2"
                      onMouseEnter={() => setFlyoutHref(item.href)}
                      onMouseLeave={() => setFlyoutHref(null)}
                    >
                      {hasChildren ? (
                        <>
                          <p className={portalNavFlyoutLabelClass}>
                            {item.label}
                          </p>
                          <div className="space-y-0.5">
                            {item.children!.map((child) => renderNavLink(item, { inFlyout: true, child }))}
                          </div>
                        </>
                      ) : (
                        renderNavLink(item, { inFlyout: true })
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </nav>

          <div className="portal-sidebar-footer mx-3 mb-3 mt-auto shrink-0 space-y-2 rounded-2xl p-2 pt-2">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className={cn(
                "portal-sidebar-theme flex w-full items-center rounded-xl transition",
                collapsed ? "justify-center p-2" : "gap-3 px-2.5 py-2",
              )}
            >
              <span className="portal-sidebar-theme-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                {theme === "dark" ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5z" />
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                )}
              </span>
              {!collapsed ? (
                <>
                  <span className="min-w-0 flex-1 text-left font-sans text-sm font-medium">
                    Dark mode
                  </span>
                  <span
                    className="portal-theme-switch"
                    data-on={theme === "dark" ? "true" : "false"}
                    aria-hidden
                  >
                    <span className="portal-theme-switch-knob" />
                  </span>
                </>
              ) : null}
            </button>

            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className={cn(
                "portal-sidebar-logout",
                collapsed ? "justify-center px-2" : "justify-start",
              )}
            >
              <span className="portal-sidebar-logout-icon">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden
                >
                  <path d="M18 20V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14" />
                  <path d="M2 20h20" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
                </svg>
              </span>
              {!collapsed ? <span>Log out</span> : null}
            </button>
          </div>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            className="absolute right-2 top-2 rounded-lg p-1.5 text-[color:var(--sidebar-muted)] transition hover:bg-[color:var(--sidebar-hover)] hover:text-[color:var(--sidebar-text)] lg:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </aside>

        <div
          className={cn(
            "portal-content-area flex min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-out",
            sidebarOffset,
          )}
          data-backdrop={brandBackdrop ? "brand" : undefined}
          style={
            {
              ...(brandBackdrop ? {} : { background: "var(--portal-page-bg)" }),
              "--portal-sidebar-offset": collapsed ? "4.75rem" : "16rem",
            } as CSSProperties
          }
        >
          {!contentFlush ? (
            <div
              className={cn(
                "pointer-events-none sticky top-0 z-20 px-4 pb-2 md:px-6 lg:px-8",
                brandBackdrop ? "pt-3" : "pt-4",
              )}
            >
              <header className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  aria-label="Open sidebar"
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen(true)}
                  className="portal-header-icon pointer-events-auto mr-auto rounded-full p-2 lg:hidden"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                    <path d="M4 7h16M4 12h10M4 17h16" />
                  </svg>
                </button>
              </header>
            </div>
          ) : null}

          <main
            className={cn(
              "flex-1",
              contentFlush
                ? "px-4 md:px-6 lg:px-8"
                : brandBackdrop
                  ? "px-4 pb-8 pt-1 md:px-6 lg:px-8"
                  : "px-4 pb-6 pt-2 md:px-6 md:pb-8 lg:px-8 lg:pb-10",
            )}
          >
            {showPageHeader ? (
              <header className="mb-6 md:mb-8">
                <p className="portal-page-eyebrow">{pageEyebrow}</p>
                <h1 className={cn("mt-2", portalPageTitleClass)}>{title}</h1>
                {subtitle ? (
                  <p className={cn("mt-2 max-w-2xl", portalPageDescClass)}>{subtitle}</p>
                ) : null}
              </header>
            ) : (
              <h1 className="sr-only">{title}</h1>
            )}
            {children}
          </main>
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
  adviser: (
    <NavIcon>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    </NavIcon>
  ),
};
