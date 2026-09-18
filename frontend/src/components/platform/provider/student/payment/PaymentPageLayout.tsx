"use client";

import { Icon, Menu } from "@/components/icons";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { studentNav } from "@/components/platform/provider/student/studentNav";

type PaymentPageLayoutProps = {
  title?: string;
  children: React.ReactNode;
};

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function PaymentPageLayout({ title = "Membership", children }: PaymentPageLayoutProps) {
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
        <header className="mb-4 flex h-10 min-w-0 items-center gap-2 sm:mb-5 sm:h-12 sm:gap-3 md:gap-4">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={openSidebar}
            className="dashboard-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full lg:hidden sm:h-12 sm:w-12"
          >
            <Icon icon={Menu} size={18} />
          </button>

          <h1 className="font-sans min-w-0 truncate text-xl font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl">
            {title}
          </h1>
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">{children}</div>
      </div>
    </PortalShell>
  );
}
