"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export type CourseOption = "overview" | "lessons" | "calculator" | "test-result";

type CourseOptionNavProps = {
  courseId: string;
  active: CourseOption;
};

const OPTIONS: Array<{ id: CourseOption; label: string; href: (courseId: string) => string }> = [
  { id: "overview", label: "Overview", href: (courseId) => `/student/lectures/${courseId}` },
  { id: "lessons", label: "Lessons", href: (courseId) => `/student/lectures/${courseId}/lessons` },
  { id: "calculator", label: "Calculator", href: () => "/student/calculator" },
  {
    id: "test-result",
    label: "Test result",
    href: (courseId) => `/student/lectures/${courseId}/test-result`,
  },
];

export function CourseOptionNav({ courseId, active }: CourseOptionNavProps) {
  return (
    <nav aria-label="Course sections" className="flex flex-wrap gap-2.5">
      {OPTIONS.map((option) => {
        const isActive = option.id === active;
        return (
          <Link
            key={option.id}
            href={option.href(courseId)}
            className={cn(
              "font-sans inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm font-medium tracking-[0.01em] transition",
              isActive
                ? "bg-[#DDE466] text-[#152744]"
                : "dashboard-pill-soft text-[color:var(--dash-text)] hover:brightness-[0.98]",
            )}
            aria-current={isActive ? "page" : undefined}
          >
            {option.label}
          </Link>
        );
      })}
    </nav>
  );
}
