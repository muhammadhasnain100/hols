"use client";

import { Icon, Menu } from "@/components/icons";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { studentNav } from "@/components/platform/provider/student/studentNav";

type LecturesPageLayoutProps = {
  children: React.ReactNode;
};

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function LecturesPageLayout({ children }: LecturesPageLayoutProps) {
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
            <h1 className="font-sans truncate text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl">
              Lectures
            </h1>
          </div>

          <WelcomeChip />
        </header>

        <section className="dashboard-hero lecture-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
          <div className="relative z-[1] min-w-0">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
              HOLS · Learning
            </p>
            <div className="mt-1.5 flex flex-wrap items-end gap-x-2 gap-y-1 sm:mt-2">
              <h2 className="font-sans text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                Lectures
              </h2>
              <span className="mb-0.5 inline-flex rounded-full bg-[#DDE466]/25 px-2.5 py-0.5 text-brand-caption font-semibold text-[color:var(--dash-accent)]">
                Library
              </span>
            </div>
            <p className="text-brand-body mt-1.5 text-sm text-[color:var(--dash-muted)] sm:mt-2 sm:text-base">
              Choose a course and continue learning.
            </p>
          </div>
          <span className="lecture-hero-orb pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-[#DDE466]/20 blur-2xl sm:h-36 sm:w-36" aria-hidden />
          <span className="lecture-hero-orb lecture-hero-orb--delayed pointer-events-none absolute -bottom-12 left-4 h-24 w-24 rounded-full bg-[#8DC3E1]/25 blur-2xl sm:left-8 sm:h-28 sm:w-28" aria-hidden />
        </section>

        <div className="mt-3 grid w-full min-w-0 gap-3 sm:mt-4 sm:gap-4">{children}</div>
      </div>
    </PortalShell>
  );
}
