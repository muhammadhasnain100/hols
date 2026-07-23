"use client";

import { PortalShell } from "@/components/platform/provider/PortalShell";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { affiliateNav } from "@/components/platform/provider/affiliate/affiliateNav";

type DashboardPageLayoutProps = {
  children: React.ReactNode;
};

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function DashboardPageLayout({ children }: DashboardPageLayoutProps) {
  return (
    <PortalShell
      role="affiliate"
      title="Dashboard"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={affiliateNav}
    >
      <div className="dashboard-screen min-w-0 overflow-x-hidden">
        <header className="mb-4 flex items-center justify-between gap-2 sm:mb-5 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={openSidebar}
              className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M4 7h16M4 12h10M4 17h16" />
              </svg>
            </button>
            <h1 className="font-sans truncate text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl">
              Dashboard
            </h1>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              aria-label="Notifications"
              className="dashboard-icon-btn hidden h-9 w-9 items-center justify-center rounded-full sm:flex"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <WelcomeChip fallbackName="Affiliate" />
          </div>
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4 xl:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
          {children}
        </div>
      </div>
    </PortalShell>
  );
}
