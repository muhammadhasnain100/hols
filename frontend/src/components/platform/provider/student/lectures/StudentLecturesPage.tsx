"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  listCourses,
  type CourseSummary,
  type PaginationMeta,
} from "@/lib/integrate/provider/student/lectures";

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
    <PortalShell
      role="student"
      title="Lectures"
      subtitle="Choose a course and continue learning."
      nav={studentNav}
    >
      <div className="grid gap-6">
        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        {loading ? (
          <div className="glass-panel rounded-3xl p-8 text-sm text-muted">Loading courses…</div>
        ) : courses.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-sm text-muted">No courses available yet.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <article
                key={course.course_id}
                className="glass-panel flex min-h-[17rem] flex-col rounded-3xl p-6 transition hover:-translate-y-0.5 hover:bg-white/80"
              >
                <div className="flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/35">
                    Lecture
                  </p>
                  <h2 className="mt-3 font-sans text-lg font-semibold text-primary">
                    {course.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {shortDescription(course.description)}
                  </p>
                </div>

                <dl className="mt-5 grid grid-cols-3 gap-2 rounded-2xl bg-primary/[0.04] p-3 text-center text-[11px] text-muted">
                  <div className="rounded-xl bg-white/60 px-2 py-2">
                    <dt>Topics</dt>
                    <dd className="mt-1 text-base font-semibold text-primary">
                      {course.topic_count}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-white/60 px-2 py-2">
                    <dt>Sections</dt>
                    <dd className="mt-1 text-base font-semibold text-primary">
                      {course.section_count}
                    </dd>
                  </div>
                  <div className="rounded-xl bg-white/60 px-2 py-2">
                    <dt>Lessons</dt>
                    <dd className="mt-1 text-base font-semibold text-primary">
                      {course.lesson_count}
                    </dd>
                  </div>
                </dl>

                <Button
                  href={`/student/lectures/${course.course_id}`}
                  variant="primary"
                  size="md"
                  className="mt-5 w-full"
                >
                  Learn More
                </Button>
              </article>
            ))}
          </div>
        )}

        {pagination && pagination.total_pages > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
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
      </div>
    </PortalShell>
  );
}
