"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { ChevronRight, Icon } from "@/components/icons";
import {
  PortalCardButtonDisplay,
  usePortalCardButtonHover,
} from "@/components/platform/provider/PortalCardButton";
import { CourseCoverArt } from "@/components/platform/provider/student/lectures/CourseCoverArt";
import { LecturesPageLayout } from "@/components/platform/provider/student/lectures/LecturesPageLayout";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  listCourses,
  type CourseSummary,
  type PaginationMeta,
} from "@/lib/integrate/provider/student/lectures";
import { cn } from "@/lib/utils";

export function StudentLecturesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCourses({ page, limit: 12 });
      setCourses(data.items);
      setPagination(data.pagination);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load courses.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  return (
    <LecturesPageLayout>
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {loading ? (
        <div
          className="lecture-course-grid grid w-full min-w-0 max-w-full grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 lg:grid-cols-3"
          aria-busy="true"
          aria-label="Loading courses"
        >
          {Array.from({ length: 8 }, (_, index) => (
            <CourseCardSkeleton key={index} index={index} />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="dashboard-surface rounded-2xl p-8 text-center sm:p-10">
          <p className="text-brand-body text-[color:var(--dash-faint)]">No courses available yet.</p>
        </div>
      ) : (
        <div className="lecture-course-grid grid w-full min-w-0 max-w-full grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {courses.map((course, index) => (
            <CourseCard key={course.course_id} course={course} index={index} />
          ))}
        </div>
      )}

      {pagination && pagination.total_pages > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-brand-caption text-center text-[color:var(--dash-faint)] sm:text-left">
            Page {pagination.page} of {pagination.total_pages} · {pagination.total} courses
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
            <PagerButton
              disabled={!pagination.has_previous || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </PagerButton>
            <PagerButton
              disabled={!pagination.has_next || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </PagerButton>
          </div>
        </div>
      ) : null}
    </LecturesPageLayout>
  );
}

function PagerButton({
  children,
  disabled,
  onClick,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center rounded-full px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 sm:w-auto"
    >
      {children}
    </button>
  );
}

function StatColumn({ label, value }: { label: string; value: number }) {
  return (
    <div className="lecture-stat-column flex flex-col items-center justify-center gap-px py-1">
      <span className="lecture-stat-value font-sans leading-none tracking-tight">
        {value}
      </span>
      <span className="lecture-stat-label font-medium uppercase">
        {label}
      </span>
    </div>
  );
}

function CourseCardSkeleton({ index }: { index: number }) {
  return (
    <div
      style={{ animationDelay: `${Math.min(index, 7) * 45}ms` }}
      className="lecture-course-card lecture-course-skeleton flex aspect-[3/4] w-full min-h-0 flex-col overflow-hidden rounded-[28px]"
      aria-hidden
    >
      <span className="lecture-skeleton-block mx-0 min-h-0 flex-[1.65] rounded-none" />
      <div className="lecture-course-card-glass flex shrink-0 flex-col px-4 pt-3 pb-4">
        <div className="lecture-course-stats grid grid-cols-3 overflow-hidden">
          <span className="lecture-skeleton-block h-7 w-full rounded-none" />
          <span className="lecture-skeleton-block h-7 w-full rounded-none" />
          <span className="lecture-skeleton-block h-7 w-full rounded-none" />
        </div>
        <span className="lecture-skeleton-block mt-2.5 block h-11 w-full rounded-full" />
      </div>
    </div>
  );
}

function CourseCard({ course, index }: { course: CourseSummary; index: number }) {
  const featured = index === 0;
  const { containerRef, fillRef, labelRef, onMouseEnter, onMouseLeave } =
    usePortalCardButtonHover("glass");

  return (
    <Link
      href={`/student/lectures/${course.course_id}`}
      style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
      data-featured={featured ? "true" : undefined}
      className={cn(
        "lecture-course-card group relative flex aspect-[3/4] w-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden rounded-[28px]",
      )}
    >
      <span className="lecture-course-card-shine pointer-events-none absolute inset-0 z-[3]" aria-hidden />
      <span className="lecture-course-card-sweep pointer-events-none absolute inset-0 z-[3]" aria-hidden />
      <span className="lecture-course-card-spotlight pointer-events-none absolute inset-0 z-[3]" aria-hidden />

      <div className="lecture-course-card-media relative z-[1] min-h-0 flex-[1.65] overflow-hidden">
        <CourseCoverArt courseId={course.course_id} title={course.title} variant="card" />
      </div>

      <div className="lecture-course-card-glass relative z-[2] flex shrink-0 flex-col px-4 pt-3 pb-4">
        <h2 className="sr-only">{course.title}</h2>

        <div className="lecture-course-stats">
          <StatColumn label="Topics" value={course.topic_count} />
          <StatColumn label="Sections" value={course.section_count} />
          <StatColumn label="Lessons" value={course.lesson_count} />
        </div>

        <PortalCardButtonDisplay
          variant="glass"
          size="md"
          className="mt-2.5"
          containerRef={containerRef}
          fillRef={fillRef}
          labelRef={labelRef}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          Learn more
          <Icon
            icon={ChevronRight}
            size={14}
            strokeWidth={2.2}
            className="transition-transform duration-300 ease-out group-hover/cta:translate-x-0.5"
          />
        </PortalCardButtonDisplay>
      </div>
    </Link>
  );
}
