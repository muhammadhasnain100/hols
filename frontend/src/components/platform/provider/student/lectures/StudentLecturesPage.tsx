"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { ChevronLeft, ChevronRight, Icon } from "@/components/icons";
import { useServerPortalTheme } from "@/components/platform/provider/PortalThemeProvider";
import {
  getPortalThemeSnapshot,
  subscribePortalTheme,
} from "@/components/platform/provider/portal-theme-store";
import { CourseCoverArt } from "@/components/platform/provider/student/lectures/CourseCoverArt";
import { tidyCoverTitle } from "@/components/platform/provider/student/lectures/courseCover";
import { filterVisibleLectureCourses } from "@/components/platform/provider/student/lectures/hiddenCourses";
import { LecturesPageLayout } from "@/components/platform/provider/student/lectures/LecturesPageLayout";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  listCourses,
  type CourseSummary,
  type PaginationMeta,
} from "@/lib/integrate/provider/student/lectures";
import { scrollAppToTopSoon } from "@/lib/scroll-to-top";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

function tidySearchText(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function courseMatchesSearch(course: CourseSummary, query: string) {
  const needle = tidySearchText(query);
  if (!needle) return true;

  const title = tidySearchText(course.title ?? "");
  if (!title) return false;

  if (title === needle || title.startsWith(needle) || title.includes(` ${needle}`)) {
    return true;
  }

  const titleTokens = title.split(" ").filter(Boolean);
  const needleTokens = needle.split(" ").filter(Boolean);
  if (needleTokens.length === 0) return true;

  return needleTokens.every((token) =>
    titleTokens.some((titleToken) => titleToken === token || titleToken.startsWith(token)),
  );
}

export function StudentLecturesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [allCourses, setAllCourses] = useState<CourseSummary[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);

  const trimmedSearch = searchQuery.trim();
  const isSearching = trimmedSearch.length > 0;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCourses({ page, limit: PAGE_SIZE });
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

  useEffect(() => {
    scrollAppToTopSoon();
  }, [page]);

  useEffect(() => {
    if (!isSearching) return;

    let cancelled = false;

    void listCourses({ page: 1, limit: 100 })
      .then((data) => {
        if (!cancelled) setAllCourses(data.items);
      })
      .catch(() => {
        if (!cancelled) setAllCourses(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isSearching]);

  const visibleCourses = useMemo(() => {
    const source = isSearching ? allCourses ?? courses : courses;
    const availableCourses = filterVisibleLectureCourses(source);

    if (!isSearching) return availableCourses;

    return availableCourses.filter((course) => courseMatchesSearch(course, trimmedSearch));
  }, [allCourses, courses, isSearching, trimmedSearch]);

  return (
    <LecturesPageLayout searchQuery={searchQuery} onSearchQueryChange={setSearchQuery}>
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {isSearching && !loading ? (
        <p className="text-brand-caption text-[color:var(--dash-faint)]">
          {visibleCourses.length === 1
            ? "1 course found"
            : `${visibleCourses.length} courses found`}
        </p>
      ) : null}

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
      ) : visibleCourses.length === 0 ? (
        <div className="dashboard-surface rounded-2xl p-8 text-center sm:p-10">
          <p className="text-brand-body text-[color:var(--dash-faint)]">
            {isSearching ? "No courses match your search." : "No courses available yet."}
          </p>
        </div>
      ) : (
        <div className="lecture-course-grid grid w-full min-w-0 max-w-full grid-cols-1 gap-4 min-[420px]:grid-cols-2 sm:gap-5 lg:grid-cols-3">
          {visibleCourses.map((course, index) => (
            <CourseCard key={course.course_id} course={course} index={index} />
          ))}
        </div>
      )}

      {!isSearching && pagination && pagination.total_pages > 1 ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <p className="text-brand-caption text-center text-[color:var(--dash-faint)] sm:text-left">
            Page {pagination.page} of {pagination.total_pages} · {pagination.total} courses
          </p>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
            <PagerButton
              variant="prev"
              disabled={!pagination.has_previous || loading}
              onClick={() => {
                scrollAppToTopSoon();
                setPage((prev) => Math.max(1, prev - 1));
              }}
            >
              <Icon icon={ChevronLeft} size={15} strokeWidth={2} />
              <span className="sm:hidden">Prev</span>
              <span className="hidden sm:inline">Previous page</span>
            </PagerButton>
            <PagerButton
              variant="next"
              disabled={!pagination.has_next || loading}
              onClick={() => {
                scrollAppToTopSoon();
                setPage((prev) => prev + 1);
              }}
            >
              <span className="sm:hidden">Next</span>
              <span className="hidden sm:inline">Next page</span>
              <Icon icon={ChevronRight} size={15} strokeWidth={2} />
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
  variant,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  variant: "prev" | "next";
}) {
  // Match lesson reading page: Previous = soft pill, Next = lemon CTA
  const className =
    variant === "next"
      ? "lesson-next-cta font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-4 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-50 disabled:hover:brightness-100 sm:w-auto sm:px-5"
      : "lesson-prev-cta dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50 sm:w-auto sm:px-5";

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

function StatColumn({ label, value }: { label: string; value: number }) {
  return (
    <div className="lecture-stat-column flex flex-col items-center justify-center gap-px py-1">
      <span className="lecture-stat-value font-sans leading-none tracking-tight">{value}</span>
      <span className="lecture-stat-label font-medium uppercase">{label}</span>
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
  // Keep theme subscription so dark/light card chrome stays in sync.
  const serverTheme = useServerPortalTheme();
  useSyncExternalStore(subscribePortalTheme, getPortalThemeSnapshot, () => serverTheme);

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
        <h2 className="lecture-course-card-title font-sans">{tidyCoverTitle(course.title)}</h2>

        <div className="lecture-course-stats">
          <StatColumn label="Topics" value={course.topic_count} />
          <StatColumn label="Sections" value={course.section_count} />
          <StatColumn label="Lessons" value={course.lesson_count} />
        </div>

        <span className="lecture-course-card-cta font-sans mt-2.5 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105">
          Learn more
          <Icon
            icon={ChevronRight}
            size={14}
            strokeWidth={2.2}
            className="transition-transform duration-300 ease-out group-hover:translate-x-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
