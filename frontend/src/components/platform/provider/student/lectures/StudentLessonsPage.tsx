"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCourse,
  listLessons,
  type CourseSummary,
  type LessonSummary,
  type PaginationMeta,
} from "@/lib/integrate/provider/student/lectures";

type StudentLessonsPageProps = {
  courseId: string;
  topicId?: string;
};

export function StudentLessonsPage({ courseId, topicId }: StudentLessonsPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [lessons, setLessons] = useState<LessonSummary[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        getCourse(courseId),
        listLessons(courseId, {
          page,
          limit: 15,
          topic_id: topicId,
        }),
      ]);
      setCourse(courseRes.course);
      setLessons(lessonsRes.items);
      setPagination(lessonsRes.pagination);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load lessons.");
    } finally {
      setLoading(false);
    }
  }, [courseId, page, topicId]);

  useEffect(() => {
    setPage(1);
  }, [topicId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <PortalShell
      role="student"
      title={course ? `Lessons · ${course.title}` : "Lessons"}
      subtitle={topicId ? "Filtered by section." : "All lessons in this course."}
      nav={studentNav}
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap gap-4 text-sm">
          <Link
            href={`/student/lectures/${courseId}`}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            ← Course overview
          </Link>
          {topicId ? (
            <Link
              href={`/student/lectures/${courseId}/lessons`}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Clear section filter
            </Link>
          ) : null}
        </div>

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        {loading ? (
          <div className="glass-panel rounded-3xl p-8 text-sm text-muted">Loading lessons…</div>
        ) : lessons.length === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-sm text-muted">No lessons found.</div>
        ) : (
          <div className="grid gap-3">
            {lessons.map((lesson) => (
              <Link
                key={lesson.lesson_id}
                href={`/student/lectures/${courseId}/lessons/${lesson.lesson_id}`}
                className="glass-panel block rounded-3xl p-5 transition hover:bg-white/80"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Lesson {lesson.order}
                      {lesson.l2_name ? ` · ${lesson.l2_name}` : ""}
                    </p>
                    <h2 className="mt-1 font-sans text-base font-semibold text-primary">
                      {lesson.title}
                    </h2>
                    {lesson.fact ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted">{lesson.fact}</p>
                    ) : null}
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    {lesson.variant_count} quizzes
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}

        {pagination && pagination.total_pages > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Page {pagination.page} of {pagination.total_pages} · {pagination.total} lessons
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={!pagination.has_previous || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={!pagination.has_next || loading}
                onClick={() => setPage((p) => p + 1)}
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
