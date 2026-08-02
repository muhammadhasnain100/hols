"use client";

import { Icon, Menu } from "@/components/icons";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { studentNav } from "@/components/platform/provider/student/studentNav";

type CalculatorPageLayoutProps = {
  children: React.ReactNode;
};

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function CalculatorPageLayout({ children }: CalculatorPageLayoutProps) {
  return (
    <PortalShell
      role="student"
      title="Calculator"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={studentNav}
    >
      <div className="dashboard-screen min-w-0 overflow-x-hidden">
        <header className="mb-3 flex items-center justify-between gap-2 sm:mb-5 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={openSidebar}
              className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full lg:hidden"
            >
              <Icon icon={Menu} size={18} />
            </button>
            <h1 className="font-sans truncate text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl">
              Calculator
            </h1>
          </div>

          <WelcomeChip />
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">{children}</div>
      </div>
    </PortalShell>
  );
}
