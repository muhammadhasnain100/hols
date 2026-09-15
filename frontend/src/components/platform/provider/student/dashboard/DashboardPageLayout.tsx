"use client";

import { Icon, Menu } from "@/components/icons";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { WebinarNotificationsBell } from "@/components/platform/provider/student/webinars/WebinarNotificationsBell";
import { studentNav } from "@/components/platform/provider/student/studentNav";

type DashboardPageLayoutProps = {
  children: React.ReactNode;
};

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function DashboardPageLayout({ children }: DashboardPageLayoutProps) {
  return (
    <PortalShell
      role="student"
      title="Dashboard"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={studentNav}
    >
      <div className="dashboard-screen lectures-page min-w-0 overflow-x-hidden">
        <header className="mb-3 flex h-10 min-w-0 items-center gap-2 sm:mb-4 sm:h-12 sm:gap-3 md:mb-5 md:gap-4">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={openSidebar}
            className="dashboard-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-lg lg:hidden sm:h-12 sm:w-12"
          >
            <Icon icon={Menu} size={18} />
          </button>

          <h1 className="font-sans min-w-0 truncate text-xl font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-3xl">
            Dashboard
          </h1>

          <div className="min-w-0 flex-1" aria-hidden />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <WebinarNotificationsBell buttonClassName="dashboard-icon-btn relative flex h-10 w-10 items-center justify-center rounded-lg sm:h-12 sm:w-12" />
            <WelcomeChip className="lecture-header-welcome h-10 sm:h-12" />
          </div>
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4 xl:grid-cols-[1.9fr_1fr]">{children}</div>
      </div>
    </PortalShell>
  );
}
