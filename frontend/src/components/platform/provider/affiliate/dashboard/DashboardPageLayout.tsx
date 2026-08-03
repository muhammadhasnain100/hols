"use client";

import { Bell, Icon, Menu } from "@/components/icons";
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
              <Icon icon={Menu} size={18} />
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
              <Icon icon={Bell} size={16} />
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
