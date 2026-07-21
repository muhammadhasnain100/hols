"use client";

import Link from "next/link";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import {
  portalPageDescClass,
  portalPageTitleClass,
  portalUnitLabelClass,
} from "@/components/platform/provider/portal-styles";
import {
  CourseOptionNav,
  type CourseOption,
} from "@/components/platform/provider/student/lectures/CourseOptionNav";
import { ProfileLearningVisual } from "@/components/platform/provider/student/profile/ProfileLearningVisual";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { cn } from "@/lib/utils";

type CoursePageLayoutProps = {
  title: string;
  description: string;
  courseId?: string;
  courseNavActive?: CourseOption;
  backHref?: string;
  backLabel?: string;
  children: React.ReactNode;
};

export function CoursePageLayout({
  title,
  description,
  courseId,
  courseNavActive,
  backHref,
  backLabel,
  children,
}: CoursePageLayoutProps) {
  return (
    <PortalShell role="student" title={title} showPageHeader={false} nav={studentNav}>
      <div className="portal-guide-card mb-2 rounded-[1.75rem]">
        <div className="px-6 py-4 md:px-9 md:py-5 lg:px-10">
          {backHref && backLabel ? (
            <Link
              href={backHref}
              className={cn(
                "portal-back-link mb-4 inline-flex items-center gap-2 rounded-xl bg-white/70 px-3.5 py-2 shadow-[0_1px_3px_rgba(21,39,68,0.06)] transition hover:bg-white hover:text-primary",
                portalUnitLabelClass,
              )}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="m15 18-6-6 6-6" />
              </svg>
              {backLabel}
            </Link>
          ) : null}

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
            <header className="min-w-0 flex-1">
              <p className="portal-page-eyebrow">HOLS · Learning</p>
              <h1 className={cn("mt-2", portalPageTitleClass)}>{title}</h1>
              <p className={cn("mt-2 max-w-lg", portalPageDescClass)}>{description}</p>
            </header>

            <ProfileLearningVisual className="mx-auto sm:mx-0 sm:justify-self-end" />
          </div>
        </div>

        <div className="px-4 pb-4 md:px-5 md:pb-5 lg:px-6 lg:pb-6">
          <div className="profile-guide-body rounded-2xl px-5 pb-6 pt-5 md:px-7 md:pb-8 md:pt-6 lg:px-8 lg:pb-9">
            {courseId && courseNavActive ? <CourseOptionNav courseId={courseId} active={courseNavActive} /> : null}

            <div className={cn("grid w-full gap-5 md:gap-6", courseId && courseNavActive && "mt-5 md:mt-6")}>
              {children}
            </div>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
