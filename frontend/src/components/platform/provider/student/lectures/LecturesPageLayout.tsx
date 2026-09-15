"use client";

import { Icon, Menu } from "@/components/icons";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { studentNav } from "@/components/platform/provider/student/studentNav";

type LecturesPageLayoutProps = {
  children: React.ReactNode;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
};

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function LecturesPageLayout({
  children,
  searchQuery = "",
  onSearchQueryChange,
}: LecturesPageLayoutProps) {
  return (
    <PortalShell
      role="student"
      title="Lectures"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={studentNav}
    >
      <div className="dashboard-screen lectures-page min-w-0 overflow-x-hidden">
        <header className="relative mb-3 flex min-w-0 flex-col gap-2.5 sm:mb-4 sm:min-h-12 md:mb-5">
          <div className="flex h-10 min-w-0 items-center gap-2 sm:h-12 sm:gap-3 md:gap-4">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={openSidebar}
              className="dashboard-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-lg lg:hidden sm:h-12 sm:w-12"
            >
              <Icon icon={Menu} size={18} />
            </button>

            <h1 className="font-sans min-w-0 truncate text-xl font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-3xl">
              Lectures
            </h1>

            <div className="min-w-0 flex-1" aria-hidden />

            <WelcomeChip className="lecture-header-welcome h-10 sm:h-12" />
          </div>

          {onSearchQueryChange ? (
            <label className="lecture-library-search lecture-library-search--header w-full sm:absolute sm:left-1/2 sm:top-0 sm:z-[1] sm:w-[min(100%,18rem)] sm:-translate-x-1/2 md:w-[min(100%,20rem)] lg:w-[min(100%,22rem)]">
              <span className="lecture-library-search-icon" aria-hidden>
                <SidebarSvgIcon name="search" size={18} />
              </span>
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                placeholder="Search courses…"
                className="lecture-library-search-input"
                aria-label="Search courses"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => onSearchQueryChange("")}
                  className="lecture-library-search-clear"
                  aria-label="Clear search"
                >
                  <SidebarSvgIcon name="cross" size={14} />
                </button>
              ) : null}
            </label>
          ) : null}
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">{children}</div>
      </div>
    </PortalShell>
  );
}
