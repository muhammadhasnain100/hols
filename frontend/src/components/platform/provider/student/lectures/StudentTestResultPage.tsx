"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { CoursePageLayout } from "@/components/platform/provider/student/lectures/CoursePageLayout";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCourse,
  getCourseTestResults,
  type CourseSummary,
  type CourseTestResultsData,
  type PaginationMeta,
} from "@/lib/integrate/provider/student/lectures";
import { cn } from "@/lib/utils";

type StudentTestResultPageProps = {
  courseId: string;
};

const RESULTS_PAGE_SIZE = 10;

function lessonHref(courseId: string, lessonId: string) {
  return `/student/lectures/${courseId}/lessons/${lessonId}`;
}

export function StudentTestResultPage({ courseId }: StudentTestResultPageProps) {
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [results, setResults] = useState<CourseTestResultsData | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loadingCourse, setLoadingCourse] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourse() {
      setLoadingCourse(true);
      setError(null);
      try {
        const courseData = await getCourse(courseId);
        setCourse(courseData.course);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Failed to load course.");
      } finally {
        setLoadingCourse(false);
      }
    }
    void loadCourse();
  }, [courseId]);

  const loadResults = useCallback(async () => {
    setLoadingResults(true);
    setError(null);
    try {
      const testResults = await getCourseTestResults(courseId, {
        page,
        limit: RESULTS_PAGE_SIZE,
      });
      setResults(testResults);
      setPagination(testResults.pagination);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load test results.");
    } finally {
      setLoadingResults(false);
    }
  }, [courseId, page]);

  useEffect(() => {
    void loadResults();
  }, [loadResults]);

  useEffect(() => {
    setPage(1);
  }, [courseId]);

  const summary = results?.summary;
  const loading = loadingCourse || (loadingResults && !results);

  return (
    <CoursePageLayout
      title={course ? `Test result · ${course.title}` : "Test result"}
      description="Quiz scores saved from completed lesson quizzes."
      courseId={courseId}
      courseNavActive="test-result"
      backHref={`/student/lectures/${courseId}`}
      backLabel="Course overview"
    >
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
          <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
          <p className="mt-3 text-[13px] text-primary/45">Loading results…</p>
        </div>
      ) : (
        <>
          <section className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(21,39,68,0.06)] md:p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary/40">
              Result summary
            </p>
            <h2 className="mt-1 text-[15px] font-semibold text-primary">
              {course?.title ?? "Course"} quiz progress
            </h2>

            <dl className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl bg-primary/[0.04] p-4">
                <dt className="text-[13px] text-primary/45">Lessons quizzed</dt>
                <dd className="mt-1 text-2xl font-semibold text-primary">
                  {summary?.lessons_quizzed ?? 0}
                  <span className="text-base font-medium text-primary/45">
                    {" "}
                    / {summary?.total_lessons ?? course?.lesson_count ?? 0}
                  </span>
                </dd>
              </div>
              <div className="rounded-2xl bg-primary/[0.04] p-4">
                <dt className="text-[13px] text-primary/45">Average score</dt>
                <dd className="mt-1 text-2xl font-semibold text-primary">
                  {summary?.average_score ?? 0}%
                </dd>
              </div>
              <div className="rounded-2xl bg-primary/[0.04] p-4">
                <dt className="text-[13px] text-primary/45">Passed quizzes</dt>
                <dd className="mt-1 text-2xl font-semibold text-primary">{summary?.passed_count ?? 0}</dd>
              </div>
              <div className="rounded-2xl bg-primary/[0.04] p-4">
                <dt className="text-[13px] text-primary/45">Course lessons</dt>
                <dd className="mt-1 text-2xl font-semibold text-primary">{course?.lesson_count ?? 0}</dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button href={`/student/lectures/${courseId}/lessons`} variant="primary" size="md">
                Continue lessons
              </Button>
              <Button href="/student/calculator" variant="secondary" size="md">
                Open calculator
              </Button>
            </div>
          </section>

          <section className="mt-4 rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(21,39,68,0.06)] md:p-6">
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary/40">
              Lesson results
            </p>
            <h3 className="mt-1 text-[15px] font-semibold text-primary">Saved quiz attempts</h3>

            {loadingResults ? (
              <div className="mt-4 rounded-2xl bg-primary/[0.03] p-6 text-center">
                <div className="mx-auto h-6 w-6 animate-pulse rounded-full bg-primary/10" />
                <p className="mt-3 text-[13px] text-primary/45">Loading lesson results…</p>
              </div>
            ) : results?.items.length ? (
              <>
                <div className="mt-4 overflow-x-auto">
                  <table className="min-w-full text-left text-[13px]">
                    <thead className="text-primary/45">
                      <tr>
                        <th className="pb-3 pr-4 font-medium">Lesson</th>
                        <th className="pb-3 pr-4 font-medium">Score</th>
                        <th className="pb-3 pr-4 font-medium">Correct</th>
                        <th className="pb-3 pr-4 font-medium">Status</th>
                        <th className="pb-3 font-medium">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.items.map((item) => (
                        <tr key={item.lesson_id} className="border-t border-primary/[0.06]">
                          <td className="py-3 pr-4">
                            <p className="font-medium text-primary">{item.lesson_title}</p>
                            <p className="text-[12px] text-primary/45">Lesson {item.lesson_order}</p>
                          </td>
                          <td className="py-3 pr-4 font-medium text-primary">{item.score_percent}%</td>
                          <td className="py-3 pr-4 text-primary/70">
                            {item.correct_count}/{item.total_questions}
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold",
                                item.passed
                                  ? "bg-emerald-100 text-emerald-700"
                                  : "bg-amber-100 text-amber-700",
                              )}
                            >
                              {item.passed ? "Passed" : "Review"}
                            </span>
                          </td>
                          <td className="py-3">
                            <Button href={lessonHref(courseId, item.lesson_id)} variant="secondary" size="sm">
                              Open lesson
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {pagination && pagination.total_pages > 1 ? (
                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-primary/[0.06] pt-4">
                    <p className="text-[13px] text-primary/45">
                      Page {pagination.page} of {pagination.total_pages} · {pagination.total} results
                    </p>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        disabled={!pagination.has_previous || loadingResults}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                      >
                        Previous
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        disabled={!pagination.has_next || loadingResults}
                        onClick={() => setPage((current) => current + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                ) : pagination ? (
                  <p className="mt-4 text-[13px] text-primary/45">
                    Showing {results.items.length} of {pagination.total} result
                    {pagination.total === 1 ? "" : "s"}
                  </p>
                ) : null}
              </>
            ) : (
              <div className="mt-4 rounded-2xl bg-primary/[0.03] p-6 text-[13px] text-primary/55">
                No quiz results yet. Open a lesson, complete the quiz at the bottom, and your score
                will appear here.
              </div>
            )}
          </section>
        </>
      )}
    </CoursePageLayout>
  );
}
