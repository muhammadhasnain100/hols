"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
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
      description=""
      courseId={courseId}
      courseNavActive="test-result"
      backHref={`/student/lectures/${courseId}`}
      backLabel="Back to cover"
      hideHero
    >
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {loading ? (
        <TestResultsPageSkeleton />
      ) : (
        <div className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.9fr)_minmax(0,1fr)]">
          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            <section className="dashboard-surface min-w-0 rounded-xl p-3.5 sm:p-5 md:p-6">
              <p className="text-brand-caption inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                <SidebarSvgIcon name="quiz" size={13} />
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
              <p className="text-brand-body mt-2 inline-flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-[color:var(--dash-muted)] sm:text-base">
                <span className="inline-flex items-center gap-1.5">
                  <SidebarSvgIcon name="lectures" size={14} />
                  {summary?.lessons_quizzed ?? 0} of{" "}
                  {summary?.total_lessons ?? course?.lesson_count ?? 0} lessons quizzed
                </span>
                {summary?.passed_count != null ? (
                  <span className="inline-flex items-center gap-1.5">
                    <SidebarSvgIcon name="check" size={14} />
                    {summary.passed_count} passed
                  </span>
                ) : null}
              </p>

              <div className="mt-4 flex flex-col gap-2 sm:mt-5 sm:flex-row sm:flex-wrap sm:gap-2.5">
                <Link
                  href={`/student/lectures/${courseId}/lessons`}
                  className="font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 sm:w-auto"
                >
                  <SidebarSvgIcon name="lectures" size={15} />
                  Continue lessons
                  <SidebarSvgIcon name="next" size={15} />
                </Link>
                <OpenCalculatorButton />
              </div>
            </section>

            <section className="dashboard-surface min-w-0 rounded-xl p-3.5 sm:p-5 md:p-6">
              <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:gap-3">
                <h2 className="font-sans inline-flex items-center gap-2 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                  <SidebarSvgIcon name="quiz" size={18} />
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
                        className="dashboard-row group flex min-w-0 items-start justify-between gap-2 rounded-xl px-3 py-2.5 transition sm:items-center sm:gap-3 sm:px-3.5 sm:py-3"
                      >
                        <div className="flex min-w-0 items-start gap-2.5 sm:items-center sm:gap-3">
                          <span
                            className={cn(
                              "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold sm:mt-0",
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

                        <span className="flex shrink-0 items-center gap-1.5 sm:gap-2">
                          <span
                            className={cn(
                              "text-brand-caption inline-flex items-center gap-1 rounded-lg px-2 py-1 font-semibold sm:px-2.5",
                              item.passed
                                ? "bg-emerald-500/15 text-emerald-600"
                                : "bg-amber-500/15 text-amber-600",
                            )}
                          >
                            <SidebarSvgIcon name={item.passed ? "check" : "quiz"} size={12} />
                            {item.passed ? "Passed" : "Review"}
                          </span>
                          <SidebarSvgIcon
                            name="next"
                            size={15}
                            className="text-[color:var(--dash-dim)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--dash-muted)]"
                          />
                        </span>
                      </Link>
                    ))}
                  </div>

                  {pagination && pagination.total_pages > 1 ? (
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-brand-caption text-center text-[color:var(--dash-faint)] sm:text-left">
                        Page {pagination.page} of {pagination.total_pages}
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                        <PagerButton
                          variant="prev"
                          disabled={!pagination.has_previous || loadingResults}
                          onClick={() => setPage((current) => Math.max(1, current - 1))}
                        >
                          <SidebarSvgIcon name="previous" size={16} />
                          <span className="sm:hidden">Prev</span>
                          <span className="hidden sm:inline">Previous</span>
                        </PagerButton>
                        <PagerButton
                          variant="next"
                          disabled={!pagination.has_next || loadingResults}
                          onClick={() => setPage((current) => current + 1)}
                        >
                          <span className="sm:hidden">Next</span>
                          <span className="hidden sm:inline">Next</span>
                          <SidebarSvgIcon name="next" size={16} />
                        </PagerButton>
                      </div>
                    </div>
                  ) : null}
                </>
              ) : (
                <div className="mt-4 flex flex-col items-center gap-3 px-1 py-8 text-center">
                  <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#DDE466]/15 text-[color:var(--dash-accent)]">
                    <SidebarSvgIcon name="quiz" size={20} />
                  </span>
                  <p className="text-brand-body text-sm text-[color:var(--dash-faint)] sm:text-base">
                    No quiz results yet. Complete a lesson quiz and your score will appear here.
                  </p>
                  <Link
                    href={`/student/lectures/${courseId}/lessons`}
                    className="font-sans inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105"
                  >
                    <SidebarSvgIcon name="lectures" size={15} />
                    Start a lesson
                  </Link>
                </div>
              )}
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:gap-4 lg:sticky lg:top-4">
            <section className="dashboard-surface min-w-0 rounded-xl p-3.5 sm:p-5">
              <p className="text-brand-caption inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                <SidebarSvgIcon name="check" size={13} />
                Summary
              </p>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:mt-4 sm:gap-3">
                <SummaryRow
                  icon="quiz"
                  label="Lessons quizzed"
                  value={`${summary?.lessons_quizzed ?? 0} / ${summary?.total_lessons ?? course?.lesson_count ?? 0}`}
                />
                <SummaryRow icon="clock" label="Average score" value={`${averageScore}%`} />
                <SummaryRow
                  icon="check"
                  label="Passed quizzes"
                  value={String(summary?.passed_count ?? 0)}
                />
                <SummaryRow
                  icon="lectures"
                  label="Course lessons"
                  value={String(course?.lesson_count ?? 0)}
                />
              </div>
            </section>

            <section className="dashboard-surface min-w-0 rounded-xl p-3.5 sm:p-5">
              <p className="text-brand-caption inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                <SidebarSvgIcon name="focus" size={13} />
                Quick actions
              </p>
              <div className="mt-3 space-y-1">
                <QuickLink
                  href={`/student/lectures/${courseId}/lessons`}
                  icon="lectures"
                  label="Open lessons"
                  hint="Practice more quizzes"
                />
                <QuickLink
                  href={`/student/lectures/${courseId}`}
                  icon="roman"
                  label="Course overview"
                  hint="Topics and sections"
                />
                <QuickLink
                  href={`/student/lectures/${courseId}/calculator`}
                  icon="calculator"
                  label="Open calculator"
                  hint="Dose tools for this course"
                />
              </div>
            </section>
          </div>
        </div>
      )}
    </CoursePageLayout>
  );
}

function SummaryRow({
  icon,
  label,
  value,
}: {
  icon: "quiz" | "clock" | "check" | "lectures";
  label: string;
  value: string;
}) {
  return (
    <div className="dashboard-row flex min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2.5">
      <span className="text-brand-body inline-flex min-w-0 items-center gap-2 text-sm text-[color:var(--dash-muted)] sm:text-base">
        <SidebarSvgIcon name={icon} size={15} className="shrink-0 text-[color:var(--dash-accent)]" />
        {label}
      </span>
      <span className="font-sans shrink-0 text-sm font-semibold text-[color:var(--dash-text)]">
        {value}
      </span>
    </div>
  );
}

function QuickLink({
  href,
  icon,
  label,
  hint,
}: {
  href: string;
  icon: "lectures" | "roman" | "calculator";
  label: string;
  hint: string;
}) {
  return (
    <Link
      href={href}
      className="dashboard-row group flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 transition"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#DDE466]/15 text-[color:var(--dash-accent)]">
        <SidebarSvgIcon name={icon} size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="font-sans block text-sm font-medium text-[color:var(--dash-text)]">
          {label}
        </span>
        <span className="text-brand-caption block text-[color:var(--dash-faint)]">{hint}</span>
      </span>
      <SidebarSvgIcon
        name="next"
        size={16}
        className="shrink-0 text-[color:var(--dash-dim)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--dash-muted)]"
      />
    </Link>
  );
}

function PagerButton({
  children,
  disabled,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  variant: "prev" | "next";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium tracking-[0.01em] transition sm:w-auto sm:px-5",
        variant === "next"
          ? "bg-[#DDE466] text-[#152744] hover:brightness-105 disabled:pointer-events-none disabled:opacity-50 disabled:hover:brightness-100"
          : "dashboard-pill-soft text-[color:var(--dash-text)] disabled:pointer-events-none disabled:opacity-50",
      )}
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
      className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition sm:w-auto"
    >
      <SidebarSvgIcon name="calculator" size={15} />
      Open calculator
    </Link>
  );
}
