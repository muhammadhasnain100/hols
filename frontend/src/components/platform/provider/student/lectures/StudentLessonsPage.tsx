"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { CourseOptionNav } from "@/components/platform/provider/student/lectures/CourseOptionNav";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCachedLesson,
  getCourseBundle,
  getLesson,
  type CourseSummary,
  type LessonDetail,
} from "@/lib/integrate/provider/student/lectures";

type StudentLessonsPageProps = {
  courseId: string;
  topicId?: string;
  l1Name?: string;
};

export function StudentLessonsPage({ courseId, topicId, l1Name }: StudentLessonsPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [lessons, setLessons] = useState<LessonDetail[]>([]);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [lessonDetailLoading, setLessonDetailLoading] = useState(false);
  const [page, setPage] = useState(1);
  const filteredLessons = useMemo(
    () =>
      lessons.filter((lesson) => {
        if (topicId && lesson.topic_id !== topicId) return false;
        if (l1Name && lesson.l1_name !== l1Name) return false;
        return true;
      }),
    [l1Name, lessons, topicId],
  );
  const totalLessons = filteredLessons.length;
  const currentLesson = filteredLessons[Math.max(0, page - 1)] ?? null;
  const currentLessonId = currentLesson?.lesson_id ?? null;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await getCourseBundle(courseId);
      setCourse(bundle.course);
      setLessons(bundle.lessons);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load lessons.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!currentLessonId) {
        setLessonDetail(null);
        setLessonDetailLoading(false);
        return;
      }

      const cached = getCachedLesson(courseId, currentLessonId)?.lesson ?? null;
      if (cached) {
        setLessonDetail(cached);
        const hasFullDetail =
          Boolean(cached.fact || cached.text_content || cached.supporting_content || cached.study_bullets) ||
          cached.variants.length > 0;
        if (hasFullDetail) {
          setLessonDetailLoading(false);
          return;
        }
      }

      setLessonDetailLoading(true);
      try {
        const data = await getLesson(courseId, currentLessonId);
        setLessonDetail(data.lesson);
      } catch {
        setLessonDetail(null);
      } finally {
        setLessonDetailLoading(false);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [courseId, currentLessonId]);

  return (
    <PortalShell
      role="student"
      title={course ? `Lessons · ${course.title}` : "Lessons"}
      subtitle={topicId || l1Name ? "Filtered lessons." : "One lesson at a time."}
      nav={studentNav}
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link
            href={`/student/lectures/${courseId}`}
            className="font-medium text-primary underline-offset-2 hover:underline"
          >
            ← Course overview
          </Link>
          {topicId || l1Name ? (
            <Link
              href={`/student/lectures/${courseId}/lessons`}
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Clear section filter
            </Link>
          ) : null}
        </div>

        <CourseOptionNav courseId={courseId} active="lessons" />

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        {loading ? (
          <div className="glass-panel rounded-3xl p-8 text-sm text-muted">Loading lessons…</div>
        ) : totalLessons === 0 ? (
          <div className="glass-panel rounded-3xl p-8 text-sm text-muted">No lessons found.</div>
        ) : currentLesson ? (
          <div className="grid gap-4">
            {(() => {
              const lesson = currentLesson;
              const fullLesson =
                lessonDetail?.lesson_id === currentLesson.lesson_id ? lessonDetail : currentLesson;

              return (
              <article key={lesson.lesson_id} className="glass-panel rounded-3xl p-6 md:p-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                  <div className="max-w-3xl">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted">
                      Lesson {lesson.order}
                      {fullLesson.l1_name ? ` · ${fullLesson.l1_name}` : ""}
                      {fullLesson.l2_name ? ` · ${fullLesson.l2_name}` : ""}
                    </p>
                    <h2 className="mt-2 font-sans text-2xl font-semibold text-primary">
                      {fullLesson.title}
                    </h2>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
                      <span className="rounded-full bg-primary/10 px-3 py-1 font-medium text-primary">
                        {fullLesson.variant_count} quiz items
                      </span>
                      <span className="rounded-full bg-black/[0.04] px-3 py-1">
                        Lesson {page} of {totalLessons}
                      </span>
                    </div>
                  </div>

                  <Button
                    href={`/student/lectures/${courseId}/lessons/${lesson.lesson_id}`}
                    variant="primary"
                    size="md"
                    className="md:shrink-0"
                  >
                    View Lesson
                  </Button>
                </div>

                <div className="mt-6 grid gap-5">
                  {lessonDetailLoading ? (
                    <p className="text-sm text-muted">Loading full lesson content…</p>
                  ) : null}

                  {fullLesson.fact ? (
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                        Lesson content
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-primary">
                        {fullLesson.fact}
                      </p>
                    </section>
                  ) : null}

                  {"text_content" in fullLesson && fullLesson.text_content ? (
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                        Full text
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-primary">
                        {fullLesson.text_content}
                      </p>
                    </section>
                  ) : null}

                  {fullLesson.supporting_content ? (
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                        Supporting content
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-primary">
                        {fullLesson.supporting_content}
                      </p>
                    </section>
                  ) : null}

                  {fullLesson.study_bullets ? (
                    <section>
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                        Study bullets
                      </h3>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-primary">
                        {fullLesson.study_bullets}
                      </p>
                    </section>
                  ) : null}

                  {!lessonDetailLoading &&
                  !fullLesson.fact &&
                  !("text_content" in fullLesson && fullLesson.text_content) &&
                  !fullLesson.supporting_content &&
                  !fullLesson.study_bullets ? (
                    <p className="text-sm text-muted">No lesson content available yet.</p>
                  ) : null}
                </div>
              </article>
              );
            })()}
          </div>
        ) : null}

        {totalLessons > 1 ? (
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted">
              Lesson {page} of {totalLessons}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={page <= 1 || loading}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous Lesson
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="md"
                disabled={page >= totalLessons || loading}
                onClick={() => setPage((p) => Math.min(totalLessons, p + 1))}
              >
                Next Lesson
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </PortalShell>
  );
}
