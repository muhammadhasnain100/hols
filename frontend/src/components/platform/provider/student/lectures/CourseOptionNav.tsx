"use client";

import Link from "next/link";
import { portalSubnavItemClass } from "@/components/platform/provider/portal-styles";
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
    <nav
      aria-label="Course sections"
      className="flex flex-wrap gap-1.5 rounded-2xl bg-primary/[0.04] p-1.5"
    >
      {OPTIONS.map((option) => {
        const isActive = option.id === active;
        return (
          <Link
            key={option.id}
            href={option.href(courseId)}
            className={cn(
              portalSubnavItemClass,
              "rounded-xl px-4 py-2 transition",
              isActive
                ? "bg-white text-primary shadow-[0_1px_3px_rgba(21,39,68,0.08)]"
                : "text-primary/50 hover:bg-white/70 hover:text-primary",
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
