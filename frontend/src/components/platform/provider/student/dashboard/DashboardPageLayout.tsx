"use client";

import { PortalShell } from "@/components/platform/provider/PortalShell";
import { DashboardHeroVisual } from "@/components/platform/provider/student/dashboard/DashboardHeroVisual";
import { studentNav } from "@/components/platform/provider/student/studentNav";

type DashboardPageLayoutProps = {
  displayName: string;
  children: React.ReactNode;
};

export function DashboardPageLayout({ displayName, children }: DashboardPageLayoutProps) {
  return (
    <PortalShell role="student" title="Dashboard" showPageHeader={false} nav={studentNav}>
      <div className="portal-guide-card mb-2 rounded-[1.75rem]">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:px-9 md:py-5 lg:px-10">
          <header className="min-w-0 flex-1">
            <p className="portal-page-eyebrow">HOLS · Dashboard</p>
            <h1 className="mt-1 text-xl font-bold leading-tight tracking-tight text-primary md:text-[1.65rem]">
              Welcome back, {displayName}
            </h1>
            <p className="mt-1 max-w-lg text-[13px] leading-snug text-muted md:text-sm">
              Overview of your membership, learning, and account.
            </p>
          </header>

          <DashboardHeroVisual className="mx-auto sm:mx-0 sm:justify-self-end" />
        </div>

        <div className="px-4 pb-4 md:px-5 md:pb-5 lg:px-6 lg:pb-6">
          <div className="profile-guide-body rounded-2xl px-5 pb-6 pt-5 md:px-7 md:pb-8 md:pt-6 lg:px-8 lg:pb-9">
            <div className="grid w-full gap-6 md:gap-8">{children}</div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
