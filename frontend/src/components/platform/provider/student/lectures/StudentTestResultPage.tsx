"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import {
  TestResultRowsSkeleton,
  TestResultsPageSkeleton,
} from "@/components/platform/provider/student/DashboardSkeletons";
import {
  CoursePageLayout,
  useOpenCourseCalculator,
} from "@/components/platform/provider/student/lectures/CoursePageLayout";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCourse,
  getCourseTestResults,
  type CourseSummary,
  type CourseTestResultsData,
  type PaginationMeta,
} from "@/lib/integrate/provider/student/lectures";
import { ChevronRight, Icon } from "@/components/icons";
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
  const averageScore = summary?.average_score ?? 0;

  return (
    <CoursePageLayout
      title={course ? `Test result · ${course.title}` : "Test result"}
      description="Quiz scores saved from completed lesson quizzes."
      courseId={courseId}
      courseNavActive="test-result"
    >
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {loading ? (
        <TestResultsPageSkeleton />
      ) : (
        <div className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            <section className="dashboard-surface min-w-0 rounded-2xl p-3.5 sm:p-5 md:p-6">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                Quiz progress
              </p>
              <div className="mt-2 flex flex-wrap items-end gap-2">
                <span className="font-sans text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-[2.25rem] md:leading-none">
                  {averageScore}%
                </span>
                <span className="mb-0.5 text-brand-caption font-medium text-[color:var(--dash-faint)] sm:mb-1">
                  average score
                </span>
              </div>
              <p className="text-brand-body mt-2 text-sm text-[color:var(--dash-muted)] sm:text-base">
                {summary?.lessons_quizzed ?? 0} of{" "}
                {summary?.total_lessons ?? course?.lesson_count ?? 0} lessons quizzed
                {summary?.passed_count != null ? ` · ${summary.passed_count} passed` : ""}
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-2.5">
                <Link
                  href={`/student/lectures/${courseId}/lessons`}
                  className="font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 sm:w-auto"
                >
                  Continue lessons
                </Link>
                <OpenCalculatorButton />
              </div>
            </section>

            <section className="dashboard-surface min-w-0 rounded-2xl p-3.5 sm:p-5 md:p-6">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:gap-3">
                <h2 className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                  Saved quiz attempts
                </h2>
                {pagination ? (
                  <span className="text-brand-caption font-medium text-[color:var(--dash-accent)]">
                    {pagination.total} result{pagination.total === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>

              {loadingResults ? (
                <TestResultRowsSkeleton />
              ) : results?.items.length ? (
                <>
                  <div className="mt-3 space-y-2 sm:mt-4 sm:space-y-2.5">
                    {results.items.map((item) => (
                      <Link
                        key={item.lesson_id}
                        href={lessonHref(courseId, item.lesson_id)}
                        className="dashboard-row flex min-w-0 items-start justify-between gap-2 rounded-xl px-3 py-2.5 transition sm:items-center sm:gap-3 sm:px-3.5 sm:py-3"
                      >
                        <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
                          <span
                            className={cn(
                              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold sm:mt-0",
                              item.passed
                                ? "bg-emerald-500/15 text-emerald-600"
                                : "bg-amber-500/15 text-amber-600",
                            )}
                          >
                            {item.score_percent}%
                          </span>
                          <div className="min-w-0">
                            <p className="font-sans line-clamp-2 text-sm font-medium text-[color:var(--dash-text)] sm:truncate">
                              {item.lesson_title}
                            </p>
                            <p className="text-brand-caption mt-0.5 text-[color:var(--dash-faint)]">
                              Lesson {item.lesson_order} · {item.correct_count}/{item.total_questions}{" "}
                              correct
                            </p>
                          </div>
                        </div>

                        <span
                          className={cn(
                            "text-brand-caption shrink-0 rounded-full px-2 py-1 font-semibold sm:px-2.5",
                            item.passed
                              ? "bg-emerald-500/15 text-emerald-600"
                              : "bg-amber-500/15 text-amber-600",
                          )}
                        >
                          {item.passed ? "Passed" : "Review"}
                        </span>
                      </Link>
                    ))}
                  </div>

                  {pagination && pagination.total_pages > 1 ? (
                    <div className="mt-4 flex items-center justify-between gap-2">
                      <PagerButton
                        disabled={!pagination.has_previous || loadingResults}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                      >
                        Previous
                      </PagerButton>
                      <p className="text-brand-caption text-center text-[color:var(--dash-faint)]">
                        Page {pagination.page} of {pagination.total_pages}
                      </p>
                      <PagerButton
                        disabled={!pagination.has_next || loadingResults}
                        onClick={() => setPage((current) => current + 1)}
                      >
                        Next
                      </PagerButton>
                    </div>
                  ) : null}
                </>
              ) : (
                <p className="text-brand-body mt-4 px-1 py-6 text-center text-sm text-[color:var(--dash-faint)] sm:text-base">
                  No quiz results yet. Complete a lesson quiz and your score will appear here.
                </p>
              )}
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:sticky lg:top-4">
            <section className="dashboard-surface min-w-0 rounded-2xl p-3.5 sm:p-5">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                Summary
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:mt-4 sm:gap-3">
                <SummaryRow
                  label="Lessons quizzed"
                  value={`${summary?.lessons_quizzed ?? 0} / ${summary?.total_lessons ?? course?.lesson_count ?? 0}`}
                />
                <SummaryRow label="Average score" value={`${averageScore}%`} />
                <SummaryRow label="Passed quizzes" value={String(summary?.passed_count ?? 0)} />
                <SummaryRow label="Course lessons" value={String(course?.lesson_count ?? 0)} />
              </div>
            </section>

            <section className="dashboard-surface min-w-0 rounded-2xl p-3.5 sm:p-5">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                Quick actions
              </p>
              <div className="mt-3 space-y-1">
                <QuickLink
                  href={`/student/lectures/${courseId}/lessons`}
                  label="Open lessons"
                  hint="Practice more quizzes"
                />
                <QuickLink
                  href={`/student/lectures/${courseId}`}
                  label="Course overview"
                  hint="Topics and sections"
                />
              </div>
            </section>
          </div>
        </div>
      )}
    </CoursePageLayout>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="dashboard-row flex min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2.5">
      <span className="text-brand-body min-w-0 text-sm text-[color:var(--dash-muted)] sm:text-base">
        {label}
      </span>
      <span className="font-sans shrink-0 text-sm font-semibold text-[color:var(--dash-text)]">
        {value}
      </span>
    </div>
  );
}

function QuickLink({ href, label, hint }: { href: string; label: string; hint: string }) {
  return (
    <Link
      href={href}
      className="dashboard-row group flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 transition"
    >
      <span className="min-w-0 flex-1">
        <span className="font-sans block text-sm font-medium text-[color:var(--dash-text)]">
          {label}
        </span>
        <span className="text-brand-caption block text-[color:var(--dash-faint)]">{hint}</span>
      </span>
      <Icon
        icon={ChevronRight}
        size={16}
        strokeWidth={1.8}
        className="shrink-0 text-[color:var(--dash-dim)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--dash-muted)]"
      />
    </Link>
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
      className="dashboard-pill-soft font-sans inline-flex min-h-9 min-w-[4.5rem] items-center justify-center rounded-full px-3 text-sm font-medium text-[color:var(--dash-text)] transition sm:px-4 disabled:pointer-events-none disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function OpenCalculatorButton() {
  const { calculatorHref } = useOpenCourseCalculator();
  return (
    <Link
      href={calculatorHref}
      className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition sm:w-auto"
    >
      Open calculator
    </Link>
  );
}
