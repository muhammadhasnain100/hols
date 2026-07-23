"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
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
import { parsePortalTheme, PORTAL_THEME_KEY } from "@/components/platform/provider/portal-theme";
import {
  getPortalThemeMemory,
  getPortalThemeSnapshot,
  setPortalThemeMemory,
  subscribePortalTheme,
  writePortalTheme,
} from "@/components/platform/provider/portal-theme-store";
import { useServerPortalTheme } from "@/components/platform/provider/PortalThemeProvider";
import { cn } from "@/lib/utils";

const COLLAPSED_KEY = "hols-portal-sidebar-collapsed";

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
  const serverTheme = useServerPortalTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // Cookie/SSR theme for first paint; localStorage/memory for client navigations.
  const getServerSnapshot = useCallback(() => serverTheme, [serverTheme]);
  const theme = useSyncExternalStore(
    subscribePortalTheme,
    getPortalThemeSnapshot,
    getServerSnapshot,
  );
  const [flyoutHref, setFlyoutHref] = useState<string | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(() => new Set());
  const [navQuery, setNavQuery] = useState("");
  const [isDesktop, setIsDesktop] = useState(false);

  // Collapsed icon-rail only applies on desktop; mobile drawer is always full.
  const compact = collapsed && isDesktop;

  const sidebarOffset = collapsed
    ? "lg:ml-[4.75rem]"
    : "lg:ml-[16rem]";
  const pageEyebrow = eyebrow ?? roleEyebrow(role);

  const filteredNav = useMemo(() => {
    const q = navQuery.trim().toLowerCase();
    if (!q) return nav;
    return nav
      .map((item) => {
        const labelMatch = item.label.toLowerCase().includes(q);
        const matchedChildren = item.children?.filter((child) =>
          child.label.toLowerCase().includes(q),
        );
        if (labelMatch) return item;
        if (matchedChildren && matchedChildren.length > 0) {
          return { ...item, children: matchedChildren };
        }
        return null;
      })
      .filter((item): item is PortalNavItem => item !== null);
  }, [nav, navQuery]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const sync = () => setIsDesktop(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const storedCollapsed = localStorage.getItem(COLLAPSED_KEY);
      if (storedCollapsed !== null) setCollapsed(storedCollapsed === "true");

      const storedTheme = parsePortalTheme(localStorage.getItem(PORTAL_THEME_KEY));
      const nextTheme = storedTheme ?? serverTheme;
      const htmlTheme = parsePortalTheme(document.documentElement.getAttribute("data-portal-theme"));
      if (nextTheme !== serverTheme || htmlTheme !== nextTheme || getPortalThemeMemory() !== nextTheme) {
        writePortalTheme(nextTheme);
      } else {
        setPortalThemeMemory(nextTheme);
      }

      // Never restore an open mobile drawer — start closed on small screens.
      setMobileOpen(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [serverTheme]);

  const toggleTheme = useCallback(() => {
    writePortalTheme(theme === "light" ? "dark" : "light");
  }, [theme]);

  useEffect(() => {
    localStorage.setItem(COLLAPSED_KEY, String(collapsed));
    if (collapsed) setExpandedGroups(new Set());
  }, [collapsed]);

  useEffect(() => {
    if (!mobileOpen || isDesktop) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen, isDesktop]);

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
    // Only color top-level items (e.g. Payment). Child routes stay unstyled.
    const active = opts?.child ? false : isNavItemActive(pathname, item);
    const showIcon = !opts?.inFlyout && !opts?.child;

    return (
      <Link
        key={opts?.child?.href ?? item.href}
        href={href}
        onClick={closeMobile}
        className={cn(
          "portal-nav-item group relative flex items-center transition-colors duration-200",
          portalNavItemClass,
          opts?.inFlyout ? "h-10 gap-2.5 rounded-xl px-3" : compact ? "h-11 justify-center rounded-xl px-0" : "h-11 gap-3 rounded-xl px-3.5",
          active && "is-active",
        )}
      >
        {showIcon ? item.icon : null}
        {(!compact || opts?.inFlyout) && <span className="truncate">{label}</span>}
        {!opts?.inFlyout && !compact && item.children?.length ? (
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
      className="portal-shell min-h-svh overflow-x-hidden text-primary"
      data-theme={theme}
      suppressHydrationWarning
      data-role={role}
      data-backdrop={brandBackdrop ? "brand" : undefined}
      style={brandBackdrop ? undefined : { background: "var(--portal-page-bg)" }}
    >
      <div className="flex min-h-svh">
        {mobileOpen ? (
          <button
            type="button"
            aria-label="Close sidebar backdrop"
            className="fixed inset-0 z-30 bg-black/45 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        ) : null}

        <aside
          aria-hidden={!mobileOpen && !isDesktop}
          className={cn(
            "portal-sidebar-glass portal-sidebar-flush fixed inset-y-0 left-0 z-40 flex w-[min(17.5rem,88vw)] shrink-0 flex-col overflow-hidden pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] transition-all duration-300 ease-out",
            compact ? "lg:w-[4.75rem]" : "lg:w-[16rem]",
            mobileOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0 lg:shadow-none",
          )}
        >
          <div
            className={cn(
              "flex shrink-0 flex-col gap-3",
              compact ? "items-center px-2 pb-3 pt-4" : "px-3 pb-3 pt-4",
            )}
          >
            <div
              className={cn(
                "flex items-center",
                compact ? "h-10 justify-center" : "h-10 px-2 pr-10 lg:pr-2",
              )}
            >
              <HeroLogo
                variant={theme === "dark" ? "light" : "dark"}
                compact={compact}
                linked={false}
                className={cn(compact ? "h-7 w-7" : "h-7 max-w-[8.5rem]")}
              />
            </div>

            {compact ? (
              <button
                type="button"
                className="portal-sidebar-search-collapsed"
                aria-label="Expand sidebar to search"
                title="Search"
                onClick={() => setCollapsed(false)}
              >
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
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
              </button>
            ) : (
              <label className="portal-sidebar-search">
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.9"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                  aria-hidden
                >
                  <circle cx="11" cy="11" r="7" />
                  <path d="M20 20l-3.5-3.5" />
                </svg>
                <input
                  type="search"
                  value={navQuery}
                  onChange={(event) => setNavQuery(event.target.value)}
                  placeholder="Search menu…"
                  className="portal-sidebar-search-input"
                  aria-label="Search navigation"
                />
              </label>
            )}
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

          <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden overscroll-contain px-3 pb-3" aria-label="Portal navigation">
            {filteredNav.length === 0 ? (
              <p className="px-3 py-4 text-center text-brand-caption text-[color:var(--sidebar-muted)]">
                No matches
              </p>
            ) : null}
            {filteredNav.map((item) => {
              const hasChildren = (item.children?.length ?? 0) > 0;
              const groupOpen = Boolean(navQuery.trim()) || expandedGroups.has(item.href);
              const active = isNavItemActive(pathname, item);

              return (
                <div
                  key={item.href}
                  className="relative"
                  onMouseEnter={() => {
                    if (compact) setFlyoutHref(item.href);
                  }}
                  onMouseLeave={() => {
                    if (compact) setFlyoutHref((current) => (current === item.href ? null : current));
                  }}
                >
                  {hasChildren && !compact ? (
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

                  {!compact && hasChildren && groupOpen ? (
                    <div className="relative ml-5 mt-0.5 space-y-0.5 border-l border-[color:var(--sidebar-divider)] pl-3">
                      {item.children!.map((child) => renderNavLink(item, { inFlyout: true, child }))}
                    </div>
                  ) : null}

                  {compact && flyoutHref === item.href ? (
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
              onClick={handleLogout}
              aria-label="Log out"
              title="Log out"
              className={cn(
                "portal-sidebar-logout",
                compact ? "justify-center px-2" : "justify-start",
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
                  <path d="M10 17H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h4" />
                  <path d="M15 16l4-4-4-4" />
                  <path d="M19 12H10" />
                </svg>
              </span>
              {!compact ? <span>Log out</span> : null}
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className={cn(
                "portal-sidebar-theme flex w-full items-center rounded-xl transition",
                compact ? "justify-center p-2" : "gap-3 px-2.5 py-2",
              )}
            >
              <span className="portal-sidebar-theme-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-lg">
                {theme === "dark" ? (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <path d="M12 3a6.5 6.5 0 0 0 8.5 8.5A8 8 0 1 1 12 3z" />
                  </svg>
                ) : (
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                  </svg>
                )}
              </span>
              {!compact ? (
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
          </div>

          <button
            type="button"
            aria-label="Close sidebar"
            onClick={() => setMobileOpen(false)}
            className="absolute right-2 top-[max(0.5rem,env(safe-area-inset-top))] rounded-lg p-2 text-[color:var(--sidebar-muted)] transition hover:bg-[color:var(--sidebar-hover)] hover:text-[color:var(--sidebar-text)] lg:hidden"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </aside>

        <div
          className={cn(
            "portal-content-area flex min-w-0 flex-1 flex-col overflow-x-hidden transition-[margin] duration-300 ease-out",
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
                "pointer-events-none sticky top-0 z-20 px-3 pb-2 sm:px-4 md:px-6 lg:px-8",
                brandBackdrop ? "pt-3" : "pt-4",
              )}
            >
              <header className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  aria-label="Open sidebar"
                  aria-expanded={mobileOpen}
                  onClick={() => setMobileOpen(true)}
                  className="portal-header-icon pointer-events-auto mr-auto min-h-10 min-w-10 rounded-full p-2 lg:hidden"
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
              "flex-1 min-w-0",
              contentFlush
                ? "px-3 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-4 md:px-6 lg:px-8"
                : brandBackdrop
                  ? "px-3 pb-8 pt-1 sm:px-4 md:px-6 lg:px-8"
                  : "px-3 pb-6 pt-2 sm:px-4 md:px-6 md:pb-8 lg:px-8 lg:pb-10",
            )}
          >
            {showPageHeader ? (
              <header className="mb-5 md:mb-8">
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
