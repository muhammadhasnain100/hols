"use client";

import Link from "next/link";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { StudentPageHeader } from "@/components/platform/provider/student/StudentPageHeader";
import {
  CourseOptionNav,
  type CourseOption,
} from "@/components/platform/provider/student/lectures/CourseOptionNav";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { cn } from "@/lib/utils";

type CoursePageLayoutProps = {
  title: string;
  description: string;
  courseId?: string;
  courseNavActive?: CourseOption;
  backHref?: string;
  backLabel?: string;
  heroActions?: React.ReactNode;
  children: React.ReactNode;
};

export function CoursePageLayout({
  title,
  description,
  courseId,
  courseNavActive,
  backHref,
  backLabel,
  heroActions,
  children,
}: CoursePageLayoutProps) {
  return (
    <PortalShell role="student" title={title} showPageHeader={false} brandBackdrop nav={studentNav}>
      <div className="dashboard-screen">
        <StudentPageHeader title="Lectures" />

        {(backHref && backLabel) || (courseId && courseNavActive) ? (
          <div className="mb-4 flex flex-wrap items-center gap-2.5">
            {backHref && backLabel ? (
              <Link
                href={backHref}
                className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center gap-1.5 rounded-full px-4 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-muted)] transition hover:text-[color:var(--dash-text)]"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="m15 18-6-6 6-6" />
                </svg>
                {backLabel}
              </Link>
            ) : null}

            {courseId && courseNavActive ? (
              <CourseOptionNav courseId={courseId} active={courseNavActive} />
            ) : null}
          </div>
        ) : null}

        <section className="dashboard-hero relative overflow-hidden rounded-2xl p-5 md:p-6">
          <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
            HOLS · Learning
          </p>
          <h2 className="font-sans mt-2 text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-[2.5rem] md:leading-none">
            {title}
          </h2>
          <p className="text-brand-body mt-2 max-w-lg text-[color:var(--dash-muted)]">{description}</p>
          {heroActions ? <div className="mt-5 flex flex-wrap gap-2.5">{heroActions}</div> : null}
        </section>

        <div className={cn("mt-4 grid w-full gap-4")}>{children}</div>
      </div>
    </PortalShell>
  );
}
