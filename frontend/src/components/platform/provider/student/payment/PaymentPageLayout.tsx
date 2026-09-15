"use client";

import { PortalShell } from "@/components/platform/provider/PortalShell";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { PaymentSubnav } from "@/components/platform/provider/student/payment/PaymentSubnav";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { studentNav } from "@/components/platform/provider/student/studentNav";

type PaymentPageLayoutProps = {
  title: string;
  children: React.ReactNode;
};

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function PaymentPageLayout({ title, children }: PaymentPageLayoutProps) {
  return (
    <PortalShell
      role="student"
      title={title}
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={studentNav}
    >
      <div className="dashboard-screen lectures-page payment-page min-w-0 overflow-x-hidden">
        <header className="mb-3 flex h-11 min-w-0 items-center gap-2.5 sm:mb-4 sm:h-12 sm:gap-3 md:mb-5 md:gap-4">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={openSidebar}
            className="dashboard-icon-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-lg lg:hidden sm:h-12 sm:w-12"
          >
            <SidebarSvgIcon name="menu" size={18} strokeWidth={2} />
          </button>

          <h1 className="font-sans shrink-0 text-3xl font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)]">
            {title}
          </h1>

          <div className="min-w-0 flex-1" aria-hidden />

          <WelcomeChip className="lecture-header-welcome h-11 sm:h-12" />
        </header>

        <div className="mb-3 min-w-0 sm:mb-4">
          <PaymentSubnav />
        </div>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">{children}</div>
      </div>
    </PortalShell>
  );
}
