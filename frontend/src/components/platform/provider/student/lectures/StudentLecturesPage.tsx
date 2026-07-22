"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { LecturesPageLayout } from "@/components/platform/provider/student/lectures/LecturesPageLayout";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  listCourses,
  type CourseSummary,
  type PaginationMeta,
} from "@/lib/integrate/provider/student/lectures";

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
        <div className="dashboard-surface rounded-2xl p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-[color:var(--dash-soft)]" />
          <p className="text-brand-body mt-3 text-[color:var(--dash-faint)]">Loading courses…</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="dashboard-surface rounded-2xl p-10 text-center">
          <p className="text-brand-body text-[color:var(--dash-faint)]">No courses available yet.</p>
        </div>
      ) : (
        <div className="grid w-full grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {courses.map((course) => (
            <CourseCard key={course.course_id} course={course} />
          ))}
        </div>
      )}

      {pagination && pagination.total_pages > 1 ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-brand-caption text-[color:var(--dash-faint)]">
            Page {pagination.page} of {pagination.total_pages} · {pagination.total} courses
          </p>
          <div className="flex gap-2">
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
      className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function StatCapsule({ label, value }: { label: string; value: number }) {
  return (
    <span className="dashboard-pill-soft inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium text-[color:var(--dash-muted)]">
      <span className="font-sans font-semibold text-[color:var(--dash-text)]">{value}</span>
      {label}
    </span>
  );
}

function CourseCard({ course }: { course: CourseSummary }) {
  return (
    <Link
      href={`/student/lectures/${course.course_id}`}
      className="dashboard-surface group flex aspect-square w-full flex-col overflow-hidden rounded-2xl transition hover:border-[#DDE466]/60"
    >
      <div className="flex flex-1 flex-col items-center justify-center gap-3 px-3 pt-4 text-center">
        <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#DDE466]/20 text-[color:var(--dash-accent)]">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
        </span>

        <h2 className="font-sans line-clamp-2 px-1 text-sm font-semibold leading-snug tracking-[0.005em] text-[color:var(--dash-text)]">
          {course.title}
        </h2>

        <div className="flex flex-wrap items-center justify-center gap-1.5">
          <StatCapsule label="topics" value={course.topic_count} />
          <StatCapsule label="sections" value={course.section_count} />
          <StatCapsule label="lessons" value={course.lesson_count} />
        </div>
      </div>

      <div className="px-3 pb-3">
        <span className="font-sans inline-flex min-h-9 w-full items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-3 text-[13px] font-semibold tracking-[0.01em] text-[#152744] transition group-hover:brightness-105">
          Learn more
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
            <path d="M9 18l6-6-6-6" />
          </svg>
        </span>
      </div>
    </Link>
  );
}
