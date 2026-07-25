"use client";

import Link from "next/link";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { studentNav } from "@/components/platform/provider/student/studentNav";

type AdviserChatPageLayoutProps = {
  patientName: string;
  children: React.ReactNode;
};

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function AdviserChatPageLayout({ patientName, children }: AdviserChatPageLayoutProps) {
  return (
    <PortalShell
      role="student"
      title={patientName || "Patient"}
      showPageHeader={false}
      contentFlush
      nav={studentNav}
    >
      <div className="adviser-chat-screen dashboard-screen min-w-0">
        <header className="adviser-chat-header fixed inset-x-0 top-0 z-20 lg:left-[var(--portal-sidebar-offset)]">
          <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
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
              <Link
                href="/student/adviser"
                aria-label="Back to Peptide Advisor"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-[#DDE466] text-[#152744] transition hover:brightness-105"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </Link>
              <div className="min-w-0">
                <h1
                  className="font-sans truncate text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl"
                  title={patientName || undefined}
                >
                  {patientName || "Patient"}
                </h1>
              </div>
            </div>

            <WelcomeChip />
          </div>
        </header>

        <div className="adviser-chat-body min-w-0">{children}</div>
      </div>
    </PortalShell>
  );
}
