"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type CourseOption = "overview" | "lessons" | "calculator" | "test-result";

type CourseOptionNavProps = {
  courseId: string;
  active: CourseOption;
};

const OPTIONS: Array<{
  id: CourseOption;
  label: string;
  shortLabel: string;
  href: (courseId: string) => string;
}> = [
  {
    id: "overview",
    label: "Overview",
    shortLabel: "Overview",
    href: (courseId) => `/student/lectures/${courseId}`,
  },
  {
    id: "lessons",
    label: "Lessons",
    shortLabel: "Lessons",
    href: (courseId) => `/student/lectures/${courseId}/lessons`,
  },
  {
    id: "calculator",
    label: "Calculator",
    shortLabel: "Calc",
    href: (courseId) => `/student/lectures/${courseId}/calculator`,
  },
  {
    id: "test-result",
    label: "Test result",
    shortLabel: "Results",
    href: (courseId) => `/student/lectures/${courseId}/test-result`,
  },
];

const optionClass = (isActive: boolean) =>
  cn(
    "font-sans inline-flex min-h-9 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-xs font-medium tracking-[0.01em] transition sm:min-h-10 sm:px-4 sm:text-sm",
    isActive
      ? "bg-[#DDE466] text-[#152744]"
      : "dashboard-pill-soft text-[color:var(--dash-text)] hover:brightness-[0.98]",
  );

export function CourseOptionNav({ courseId, active }: CourseOptionNavProps) {
  return (
    <nav
      aria-label="Course sections"
      className="flex max-w-full gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] sm:flex-wrap sm:gap-2.5 sm:overflow-visible [&::-webkit-scrollbar]:hidden"
    >
      {OPTIONS.map((option) => {
        const isActive = option.id === active;
        return (
          <Link
            key={option.id}
            href={option.href(courseId)}
            className={optionClass(isActive)}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="sm:hidden">{option.shortLabel}</span>
            <span className="hidden sm:inline">{option.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
