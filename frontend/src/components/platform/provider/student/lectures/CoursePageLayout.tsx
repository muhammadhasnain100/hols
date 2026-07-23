"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useMemo } from "react";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { StudentPageHeader } from "@/components/platform/provider/student/StudentPageHeader";
import {
  CourseOptionNav,
  type CourseOption,
} from "@/components/platform/provider/student/lectures/CourseOptionNav";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { cn } from "@/lib/utils";

type CalculatorApi = {
  openCalculator: () => void;
  calculatorHref: string;
};

const OpenCalculatorContext = createContext<CalculatorApi>({
  openCalculator: () => undefined,
  calculatorHref: "/student/calculator",
});

export function useOpenCourseCalculator() {
  return useContext(OpenCalculatorContext);
}

type CoursePageLayoutProps = {
  title: string;
  description: string;
  courseId?: string;
  courseNavActive?: CourseOption;
  backHref?: string;
  backLabel?: string;
  /** When true, skip the default dashboard hero (page owns its own cover). */
  hideHero?: boolean;
  heroActions?: React.ReactNode | ((api: CalculatorApi) => React.ReactNode);
  children: React.ReactNode;
};

export function CoursePageLayout({
  title,
  description,
  courseId,
  courseNavActive,
  backHref,
  backLabel,
  hideHero = false,
  heroActions,
  children,
}: CoursePageLayoutProps) {
  const router = useRouter();
  const calculatorHref = courseId
    ? `/student/lectures/${courseId}/calculator`
    : "/student/calculator";

  const openCalculator = useCallback(() => {
    router.push(calculatorHref);
  }, [calculatorHref, router]);

  const calculatorApi = useMemo(
    () => ({ openCalculator, calculatorHref }),
    [openCalculator, calculatorHref],
  );

  const resolvedHeroActions =
    typeof heroActions === "function" ? heroActions(calculatorApi) : heroActions;

  return (
    <OpenCalculatorContext.Provider value={calculatorApi}>
      <PortalShell role="student" title={title} showPageHeader={false} brandBackdrop nav={studentNav}>
        <div className="dashboard-screen min-w-0 overflow-x-hidden">
          <StudentPageHeader title="Lectures" />

          {(backHref && backLabel) || (courseId && courseNavActive) ? (
            <div className="mb-3 flex min-w-0 flex-col gap-2.5 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-center">
              {backHref && backLabel ? (
                <Link
                  href={backHref}
                  className="dashboard-pill-soft font-sans inline-flex min-h-9 w-fit shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-muted)] transition hover:text-[color:var(--dash-text)] sm:min-h-10 sm:px-4"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  {backLabel}
                </Link>
              ) : null}

              {courseId && courseNavActive ? (
                <div className="min-w-0 flex-1">
                  <CourseOptionNav courseId={courseId} active={courseNavActive} />
                </div>
              ) : null}
            </div>
          ) : null}

          {!hideHero ? (
            <section className="dashboard-hero relative min-w-0 overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                HOLS · Learning
              </p>
              <h2 className="font-sans mt-1.5 break-words text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:mt-2 sm:text-2xl md:text-[2.5rem] md:leading-none">
                {title}
              </h2>
              {description ? (
                <p className="text-brand-body mt-2 max-w-lg text-sm text-[color:var(--dash-muted)] sm:text-base">
                  {description}
                </p>
              ) : null}
              {resolvedHeroActions ? (
                <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-2.5">
                  {resolvedHeroActions}
                </div>
              ) : null}
            </section>
          ) : null}

          <div className={cn(!hideHero && "mt-4", "grid w-full min-w-0 gap-4")}>{children}</div>
        </div>
      </PortalShell>
    </OpenCalculatorContext.Provider>
  );
}
