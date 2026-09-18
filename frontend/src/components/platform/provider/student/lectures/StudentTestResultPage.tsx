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

function formatWhen(value?: string) {
  if (!value) return "";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
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
  const lessonsQuizzed = summary?.lessons_quizzed ?? 0;
  const totalLessons = summary?.total_lessons ?? course?.lesson_count ?? 0;
  const passedCount = summary?.passed_count ?? 0;
  const progress = totalLessons > 0 ? Math.min(100, Math.round((lessonsQuizzed / totalLessons) * 100)) : 0;

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
        <div className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.85fr)]">
          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            <section className="dashboard-glass-card min-w-0 overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                Quiz progress
              </p>
              {course?.title ? (
                <h2
                  title={course.title}
                  className="font-sans mt-2 text-left text-xl font-bold leading-snug tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl"
                >
                  {course.title}
                </h2>
              ) : null}

              <div className="mt-3 flex flex-wrap items-end gap-2">
                <span className="font-sans text-3xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-[2.25rem] md:leading-none">
                  {averageScore}%
                </span>
                <span className="mb-1 text-brand-caption font-medium text-[color:var(--dash-faint)]">
                  average score
                </span>
              </div>

              <div className="mt-4">
                <div
                  className="h-2 overflow-hidden rounded-full bg-[color:var(--dash-soft)]"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progress}
                  aria-label={`${progress}% of lessons quizzed`}
                >
                  <div
                    className="h-full rounded-full bg-[color:var(--dash-navy)]"
                    style={{ width: `${Math.min(100, Math.max(progress ? 4 : 0, progress))}%` }}
                  />
                </div>
                <p className="text-brand-caption mt-2 text-[color:var(--dash-muted)]">
                  {lessonsQuizzed} of {totalLessons} lessons quizzed
                  {passedCount ? ` · ${passedCount} passed` : ""}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
                <MetricTile label="Quizzed" value={`${lessonsQuizzed}/${totalLessons}`} />
                <MetricTile label="Average" value={`${averageScore}%`} />
                <MetricTile label="Passed" value={String(passedCount)} />
                <MetricTile label="Lessons" value={String(course?.lesson_count ?? 0)} />
              </div>

              <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-2.5">
                <Link
                  href={`/student/lectures/${courseId}/lessons`}
                  className="dashboard-navy-btn font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-white sm:w-auto"
                >
                  Continue lessons
                  <SidebarSvgIcon name="next" size={15} />
                </Link>
                <OpenCalculatorButton />
              </div>
            </section>

            <section className="dashboard-glass-card min-w-0 overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6">
              <div className="flex min-w-0 flex-wrap items-end justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                    Saved attempts
                  </h2>
                  <p className="text-brand-caption mt-1 text-[color:var(--dash-muted)]">
                    Open a lesson to review the quiz.
                  </p>
                </div>
                {pagination ? (
                  <span className="text-brand-caption font-medium tabular-nums text-[color:var(--dash-faint)]">
                    {pagination.total} result{pagination.total === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>

              {loadingResults ? (
                <TestResultRowsSkeleton />
              ) : results?.items.length ? (
                <>
                  <div className="mt-4 space-y-1">
                    {results.items.map((item) => {
                      const when = formatWhen(item.updated_at);
                      return (
                        <Link
                          key={item.lesson_id}
                          href={lessonHref(courseId, item.lesson_id)}
                          className="dashboard-row hols-option-hover flex min-w-0 items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 sm:px-3.5 sm:py-3"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="dashboard-tool-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums text-[color:var(--dash-text)]">
                              {item.score_percent}%
                            </span>
                            <div className="min-w-0">
                              <p
                                title={item.lesson_title}
                                className="font-sans truncate text-sm font-medium text-[color:var(--dash-text)]"
                              >
                                {item.lesson_title}
                              </p>
                              <p className="text-brand-caption mt-0.5 truncate text-[color:var(--dash-faint)]">
                                Lesson {item.lesson_order} · {item.correct_count}/{item.total_questions}{" "}
                                correct{when ? ` · ${when}` : ""}
                              </p>
                            </div>
                          </div>

                          <span className="flex shrink-0 items-center gap-2">
                            <span className="dashboard-pill-soft text-brand-caption inline-flex items-center rounded-full px-2.5 py-1 font-semibold text-[color:var(--dash-text)]">
                              {item.passed ? "Passed" : "Review"}
                            </span>
                            <SidebarSvgIcon
                              name="next"
                              size={15}
                              className="hidden text-[color:var(--dash-dim)] sm:block"
                            />
                          </span>
                        </Link>
                      );
                    })}
                  </div>

                  {pagination && pagination.total_pages > 1 ? (
                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
                <div className="mt-6 flex flex-col items-center px-2 py-8 text-center sm:py-10">
                  <span className="dashboard-tool-icon flex h-14 w-14 items-center justify-center rounded-full text-[color:var(--dash-text)]">
                    <SidebarSvgIcon name="quiz" size={22} strokeWidth={1.85} />
                  </span>
                  <p className="font-sans mt-4 text-base font-semibold text-[color:var(--dash-text)] sm:text-lg">
                    No quiz results yet
                  </p>
                  <p className="text-brand-body mt-1.5 max-w-sm text-[color:var(--dash-muted)]">
                    Complete a lesson quiz and your score will show up here.
                  </p>
                  <Link
                    href={`/student/lectures/${courseId}/lessons`}
                    className="dashboard-navy-btn font-sans mt-5 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-white"
                  >
                    Start a lesson
                    <SidebarSvgIcon name="next" size={15} />
                  </Link>
                </div>
              )}
            </section>
          </div>

          <aside className="dashboard-glass-card h-fit min-w-0 rounded-2xl p-4 sm:p-5 md:p-6 lg:sticky lg:top-4">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Next steps
            </p>

            <div className="mt-4 space-y-2.5">
              <StatRow icon="quiz" label="Lessons quizzed" value={`${lessonsQuizzed} / ${totalLessons}`} />
              <StatRow icon="clock" label="Average score" value={`${averageScore}%`} />
              <StatRow icon="check" label="Passed quizzes" value={String(passedCount)} />
            </div>

            <div className="my-5 h-px bg-[color:var(--dash-surface-border)]" />

            <div className="flex flex-col gap-2">
              <Link
                href={`/student/lectures/${courseId}/lessons`}
                className="dashboard-navy-btn font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium tracking-[0.01em] text-white"
              >
                Open lessons
                <SidebarSvgIcon name="next" size={14} />
              </Link>
              <Link
                href={`/student/lectures/${courseId}`}
                className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)]"
              >
                Course overview
              </Link>
              <OpenCalculatorButton fullWidth />
            </div>
          </aside>
        </div>
      )}
    </CoursePageLayout>
  );
}

function MetricTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[color:var(--dash-soft)] px-3 py-3 sm:px-3.5">
      <p className="text-brand-caption text-[color:var(--dash-faint)]">{label}</p>
      <p className="font-sans mt-1 truncate text-lg font-semibold text-[color:var(--dash-text)]">{value}</p>
    </div>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: "quiz" | "clock" | "check";
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-3.5 py-3">
      <span className="dashboard-tool-icon flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)]">
        <SidebarSvgIcon name={icon} size={15} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-brand-caption text-[color:var(--dash-faint)]">{label}</p>
        <p className="font-sans truncate text-sm font-semibold text-[color:var(--dash-text)]">{value}</p>
      </div>
    </div>
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
  const className =
    variant === "next"
      ? "lesson-next-cta dashboard-navy-btn font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-white transition disabled:pointer-events-none disabled:opacity-50 disabled:hover:brightness-100 sm:w-auto"
      : "lesson-prev-cta dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50 sm:w-auto";

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function OpenCalculatorButton({ fullWidth = false }: { fullWidth?: boolean }) {
  const { calculatorHref } = useOpenCourseCalculator();
  return (
    <Link
      href={calculatorHref}
      className={cn(
        "dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)]",
        fullWidth ? "w-full" : "w-full sm:w-auto",
      )}
    >
      <SidebarSvgIcon name="calculator" size={15} />
      Open calculator
    </Link>
  );
}
