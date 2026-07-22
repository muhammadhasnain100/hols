"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { CoursePageLayout } from "@/components/platform/provider/student/lectures/CoursePageLayout";
import { LessonContentPanel } from "@/components/platform/provider/student/lectures/LessonContentPanel";
import {
  LearningModeToggle,
  LessonLearningView,
} from "@/components/platform/provider/student/lectures/LessonLearningView";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCachedLesson,
  getCourseBundle,
  getLesson,
  type CourseSummary,
  type LessonDetail,
} from "@/lib/integrate/provider/student/lectures";
import { cn } from "@/lib/utils";

type StudentLessonsWorkspaceProps = {
  courseId: string;
  topicId?: string;
  l1Name?: string;
  selectedLessonId?: string;
};

function lessonHasFullDetail(lesson: LessonDetail) {
  return (
    Boolean(lesson.fact || lesson.text_content || lesson.supporting_content || lesson.study_bullets) ||
    lesson.variants.length > 0
  );
}

function buildLessonsHref(courseId: string, lessonId: string, topicId?: string, l1Name?: string) {
  const params = new URLSearchParams();
  if (topicId) params.set("topic_id", topicId);
  if (l1Name) params.set("l1_name", l1Name);
  const query = params.toString();
  return `/student/lectures/${courseId}/lessons/${lessonId}${query ? `?${query}` : ""}`;
}

export function StudentLessonsWorkspace({
  courseId,
  topicId,
  l1Name,
  selectedLessonId,
}: StudentLessonsWorkspaceProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [lessons, setLessons] = useState<LessonDetail[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | undefined>(selectedLessonId);
  const [lessonDetail, setLessonDetail] = useState<LessonDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [learningMode, setLearningMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (sessionStorage.getItem("hols-learning-mode") === "1") {
      setLearningMode(true);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (learningMode) sessionStorage.setItem("hols-learning-mode", "1");
    else sessionStorage.removeItem("hols-learning-mode");
  }, [learningMode]);

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

  const filteredLessons = useMemo(
    () =>
      [...lessons]
        .filter((lesson) => {
          if (topicId && lesson.topic_id !== topicId) return false;
          if (l1Name && lesson.l1_name !== l1Name) return false;
          return true;
        })
        .sort((a, b) => a.order - b.order),
    [l1Name, lessons, topicId],
  );

  const filterLabel = useMemo(() => {
    if (topicId) {
      const match = lessons.find((lesson) => lesson.topic_id === topicId);
      return match?.l2_name ?? "Selected section";
    }
    if (l1Name) return l1Name;
    return null;
  }, [l1Name, lessons, topicId]);

  useEffect(() => {
    if (filteredLessons.length === 0) {
      setActiveLessonId(undefined);
      return;
    }

    if (selectedLessonId && filteredLessons.some((lesson) => lesson.lesson_id === selectedLessonId)) {
      setActiveLessonId(selectedLessonId);
      return;
    }

    setActiveLessonId((current) => {
      if (current && filteredLessons.some((lesson) => lesson.lesson_id === current)) {
        return current;
      }
      return filteredLessons[0]?.lesson_id;
    });
  }, [filteredLessons, selectedLessonId]);

  const activeLesson = useMemo(
    () => filteredLessons.find((lesson) => lesson.lesson_id === activeLessonId) ?? null,
    [activeLessonId, filteredLessons],
  );

  const activeIndex = activeLesson
    ? filteredLessons.findIndex((lesson) => lesson.lesson_id === activeLesson.lesson_id)
    : -1;

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      if (!activeLessonId || !activeLesson) {
        setLessonDetail(null);
        setDetailLoading(false);
        return;
      }

      const cached = getCachedLesson(courseId, activeLessonId)?.lesson ?? null;
      if (cached && lessonHasFullDetail(cached)) {
        setLessonDetail(cached);
        setDetailLoading(false);
        return;
      }

      if (cached) {
        setLessonDetail(cached);
      } else {
        setLessonDetail(activeLesson);
      }

      setDetailLoading(true);
      try {
        const data = await getLesson(courseId, activeLessonId);
        setLessonDetail(data.lesson);
      } catch {
        setLessonDetail(activeLesson);
      } finally {
        setDetailLoading(false);
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, [activeLesson, activeLessonId, courseId]);

  function navigateLesson(lessonId: string) {
    setActiveLessonId(lessonId);
    router.replace(buildLessonsHref(courseId, lessonId, topicId, l1Name));
  }

  function selectLesson(lessonId: string) {
    if (learningMode) {
      navigateLesson(lessonId);
      return;
    }
    setActiveLessonId(lessonId);
    router.push(buildLessonsHref(courseId, lessonId, topicId, l1Name));
  }

  const heroDescription = course
    ? `${filteredLessons.length} lesson${filteredLessons.length === 1 ? "" : "s"}${filterLabel ? ` · ${filterLabel}` : ""}`
    : "Browse and open lessons.";

  const displayLesson = lessonDetail ?? activeLesson;
  const prevLesson = activeIndex > 0 ? filteredLessons[activeIndex - 1] : null;
  const nextLesson =
    activeIndex >= 0 && activeIndex < filteredLessons.length - 1
      ? filteredLessons[activeIndex + 1]
      : null;

  return (
    <>
      {learningMode && displayLesson ? (
        <LessonLearningView
          lesson={displayLesson}
          detailLoading={detailLoading}
          currentIndex={activeIndex >= 0 ? activeIndex + 1 : null}
          total={filteredLessons.length}
          onExit={() => setLearningMode(false)}
        />
      ) : null}

      <CoursePageLayout
      title={course ? `Lessons · ${course.title}` : "Lessons"}
      description={heroDescription}
      courseId={courseId}
      courseNavActive="lessons"
      backHref={`/student/lectures/${courseId}`}
      backLabel="Course overview"
      heroActions={
        <>
          <Link
            href={`/student/lectures/${courseId}`}
            className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition"
          >
            Overview
          </Link>
          <Link
            href={`/student/lectures/${courseId}/test-result`}
            className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition"
          >
            Test results
          </Link>
          <Link
            href="/student/calculator"
            className="font-sans inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105"
          >
            Calculator
          </Link>
        </>
      }
    >
      {(topicId || l1Name) && (
        <div className="dashboard-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
          <p className="text-brand-body text-[color:var(--dash-muted)]">
            Showing lessons for{" "}
            <span className="font-medium text-[color:var(--dash-text)]">{filterLabel}</span>
          </p>
          <Link
            href={`/student/lectures/${courseId}/lessons`}
            className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center gap-1 rounded-full px-4 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-muted)] transition hover:text-[color:var(--dash-text)]"
          >
            Clear filter
          </Link>
        </div>
      )}

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {loading ? (
        <div className="dashboard-surface rounded-2xl p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-[color:var(--dash-soft)]" />
          <p className="text-brand-body mt-3 text-[color:var(--dash-faint)]">Loading lessons…</p>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="dashboard-surface rounded-2xl p-10 text-center">
          <p className="text-brand-body text-[color:var(--dash-faint)]">No lessons found.</p>
          {(topicId || l1Name) && (
            <Link
              href={`/student/lectures/${courseId}/lessons`}
              className="dashboard-pill-soft font-sans mt-4 inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition"
            >
              View all lessons
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(240px,300px)_minmax(0,1fr)] lg:items-start">
          <aside className="dashboard-surface flex flex-col rounded-2xl p-5 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)]">
            <div className="flex shrink-0 items-center justify-between gap-2">
              <h2 className="font-sans text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)]">
                Lesson list
              </h2>
              <span className="text-brand-caption font-medium text-[color:var(--dash-accent)]">
                {filteredLessons.length}
              </span>
            </div>
            <p className="text-brand-caption mt-0.5 text-[color:var(--dash-faint)]">
              {filterLabel ? filterLabel : "All lessons"}
            </p>

            <div className="mt-4 shrink-0">
              <LearningModeToggle
                active={learningMode}
                onToggle={() => setLearningMode((value) => !value)}
                disabled={!displayLesson || detailLoading}
              />
            </div>

            <div className="mt-4 min-h-0 space-y-2.5 overflow-y-auto overscroll-contain [scrollbar-width:thin] lg:max-h-[calc(100dvh-14rem)]">
              {filteredLessons.map((lesson, index) => {
                const selected = lesson.lesson_id === activeLessonId;
                return (
                  <button
                    key={lesson.lesson_id}
                    type="button"
                    onClick={() => selectLesson(lesson.lesson_id)}
                    className={cn(
                      "dashboard-row flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left transition",
                      selected && "bg-[color:var(--dash-soft)]",
                    )}
                    aria-current={selected ? "true" : undefined}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span
                        className={cn(
                          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                          selected
                            ? "bg-[#DDE466] text-[#152744]"
                            : "bg-[#DDE466]/15 text-[color:var(--dash-accent)]",
                        )}
                      >
                        {index + 1}
                      </span>
                      <p className="font-sans line-clamp-2 text-sm font-medium text-[color:var(--dash-text)]">
                        {lesson.title}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="min-w-0">
            {displayLesson ? (
              <LessonContentPanel
                lesson={displayLesson}
                detailLoading={detailLoading}
                currentIndex={activeIndex >= 0 ? activeIndex + 1 : null}
                total={filteredLessons.length}
                prevLessonId={prevLesson?.lesson_id ?? null}
                nextLessonId={nextLesson?.lesson_id ?? null}
                courseId={courseId}
                topicId={topicId}
                l1Name={l1Name}
              />
            ) : (
              <div className="dashboard-surface rounded-2xl p-10 text-center">
                <p className="text-brand-body text-[color:var(--dash-faint)]">
                  Select a lesson from the list to view content.
                </p>
              </div>
            )}
          </main>
        </div>
      )}
    </CoursePageLayout>
    </>
  );
}
