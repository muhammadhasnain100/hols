"use client";

import { PortalShell } from "@/components/platform/provider/PortalShell";
import { StudentPageHeader } from "@/components/platform/provider/student/StudentPageHeader";
import { studentNav } from "@/components/platform/provider/student/studentNav";

type LecturesPageLayoutProps = {
  children: React.ReactNode;
};

export function LecturesPageLayout({ children }: LecturesPageLayoutProps) {
  return (
    <PortalShell role="student" title="Lectures" showPageHeader={false} nav={studentNav}>
      <div className="dashboard-screen">
        <StudentPageHeader title="Lectures" />

        <section className="dashboard-hero relative overflow-hidden rounded-2xl p-5 md:p-6">
          <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
            HOLS · Learning
          </p>
          <h2 className="font-sans mt-2 text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-[2rem] md:leading-none">
            Lectures
          </h2>
          <p className="text-brand-body mt-2 max-w-lg text-[color:var(--dash-muted)]">
            Choose a course and continue learning.
          </p>
        </section>

        <div className="mt-4 grid w-full gap-3">{children}</div>
      </div>
    </PortalShell>
  );
}
