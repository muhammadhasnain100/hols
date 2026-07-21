"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalCardButtonDisplay, usePortalCardButtonHover } from "@/components/platform/provider/PortalCardButton";
import { LecturesPageLayout } from "@/components/platform/provider/student/lectures/LecturesPageLayout";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  listCourses,
  type CourseSummary,
  type PaginationMeta,
} from "@/lib/integrate/provider/student/lectures";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

function shortDescription(description?: string) {
  if (!description?.trim()) return "Course details and lessons...";
  const words = description.trim().split(/\s+/).slice(0, 5);
  return `${words.join(" ")}...`;
}

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
        <div className="rounded-2xl bg-white p-10 text-center shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
          <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
          <p className="mt-3 text-[13px] text-primary/45">Loading courses…</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
          <p className="text-[13px] text-primary/45">No courses available yet.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.course_id} course={course} />
          ))}
        </div>
      )}

      {pagination && pagination.total_pages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[13px] text-primary/45">
            Page {pagination.page} of {pagination.total_pages} · {pagination.total} courses
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={!pagination.has_previous || loading}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="md"
              disabled={!pagination.has_next || loading}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </LecturesPageLayout>
  );
}

function CourseCard({ course }: { course: CourseSummary }) {
  const { onMouseEnter, onMouseLeave, containerRef, fillRef, labelRef } =
    usePortalCardButtonHover("primary");

  return (
    <Link
      href={`/student/lectures/${course.course_id}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group flex min-h-[16rem] flex-col rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(21,39,68,0.06)] transition",
        "hover:shadow-[0_4px_14px_rgba(21,39,68,0.08)]",
      )}
    >
      <div className="flex-1">
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary/40">Course</p>
        <h2 className="mt-2 text-[15px] font-semibold tracking-tight text-primary">{course.title}</h2>
        <p className="mt-2 text-[13px] leading-relaxed text-primary/45">
          {shortDescription(course.description)}
        </p>
      </div>

      <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl bg-primary/[0.04] p-3 text-center text-[11px] text-primary/45">
        <div className="rounded-xl bg-white/70 px-2 py-2">
          <dt>Topics</dt>
          <dd className="mt-1 text-base font-semibold text-primary">{course.topic_count}</dd>
        </div>
        <div className="rounded-xl bg-white/70 px-2 py-2">
          <dt>Sections</dt>
          <dd className="mt-1 text-base font-semibold text-primary">{course.section_count}</dd>
        </div>
        <div className="rounded-xl bg-white/70 px-2 py-2">
          <dt>Lessons</dt>
          <dd className="mt-1 text-base font-semibold text-primary">{course.lesson_count}</dd>
        </div>
      </dl>

      <PortalCardButtonDisplay
        variant="primary"
        className="mt-5"
        containerRef={containerRef}
        fillRef={fillRef}
        labelRef={labelRef}
      >
        Learn more
      </PortalCardButtonDisplay>
    </Link>
  );
}
