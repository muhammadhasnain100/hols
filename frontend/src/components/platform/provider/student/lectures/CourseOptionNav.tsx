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
  { id: "calculator", label: "Peptide Calculator", href: () => "/student/calculator" },
  {
    id: "test-result",
    label: "Test Result",
    href: (courseId) => `/student/lectures/${courseId}/test-result`,
  },
];

export function CourseOptionNav({ courseId, active }: CourseOptionNavProps) {
  return (
    <nav
      aria-label="Course sections"
      className="grid overflow-hidden rounded-2xl border border-black/[0.06] bg-[#E8EEF2] text-sm font-semibold text-primary/70 sm:grid-cols-4"
    >
      {OPTIONS.map((option) => {
        const isActive = option.id === active;
        return (
          <Link
            key={option.id}
            href={option.href(courseId)}
            className={cn(
              "px-4 py-3 text-center transition hover:bg-white/70 hover:text-primary",
              isActive && "bg-primary text-white hover:bg-primary hover:text-white",
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
