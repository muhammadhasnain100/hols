"use client";

import { PortalShell } from "@/components/platform/provider/PortalShell";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { studentNav } from "@/components/platform/provider/student/studentNav";

type AdviserPageLayoutProps = {
  children: React.ReactNode;
};

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function AdviserPageLayout({ children }: AdviserPageLayoutProps) {
  return (
    <PortalShell
      role="student"
      title="Peptide Advisor"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={studentNav}
    >
      <div className="dashboard-screen lectures-page adviser-page min-w-0 overflow-x-hidden">
        <header className="mb-3 flex h-11 min-w-0 items-center gap-2.5 sm:mb-4 sm:h-12 sm:gap-3 md:mb-5 md:gap-4">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={openSidebar}
            className="dashboard-icon-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-lg lg:hidden sm:h-12 sm:w-12"
          >
            <SidebarSvgIcon name="menu" size={18} strokeWidth={2} />
          </button>

          <h1 className="font-sans shrink-0 text-xl font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)] min-[400px]:text-2xl sm:text-3xl">
            <span className="sm:hidden">Advisor</span>
            <span className="hidden sm:inline">Peptide Advisor</span>
          </h1>

          <div className="min-w-0 flex-1" aria-hidden />

          <WelcomeChip className="lecture-header-welcome h-11 sm:h-12" />
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">{children}</div>
      </div>
    </PortalShell>
  );
}
