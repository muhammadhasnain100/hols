"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import {
  portalEmptyStateClass,
  portalInlineMetaClass,
  portalNavItemClass,
  portalRowValueClass,
  portalSectionDescClass,
  portalSectionEyebrowClass,
  portalSectionTitleClass,
  portalSubnavItemClass,
} from "@/components/platform/provider/portal-styles";
import { CoursePageLayout } from "@/components/platform/provider/student/lectures/CoursePageLayout";
import { LessonContentPanel } from "@/components/platform/provider/student/lectures/LessonContentPanel";
import {
  LearningModeToggle,
  LessonLearningView,
} from "@/components/platform/provider/student/lectures/LessonLearningView";
import { Button } from "@/components/ui/Button";
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
    >
      {(topicId || l1Name) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#8DC3E1]/35 bg-[#eef6fb] px-4 py-3">
          <p className={portalSectionDescClass}>
            Showing lessons for <span className="font-medium text-primary">{filterLabel}</span>
          </p>
          <Link
            href={`/student/lectures/${courseId}/lessons`}
            className={cn(
              "inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 shadow-[0_1px_3px_rgba(21,39,68,0.06)] transition hover:text-primary",
              portalSubnavItemClass,
              "text-primary/70",
            )}
          >
            Clear filter
          </Link>
        </div>
      )}

      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {loading ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
          <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
          <p className={cn("mt-3", portalEmptyStateClass)}>Loading lessons…</p>
        </div>
      ) : filteredLessons.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
          <p className={portalEmptyStateClass}>No lessons found.</p>
          {(topicId || l1Name) && (
            <Button href={`/student/lectures/${courseId}/lessons`} variant="secondary" size="md" className="mt-4">
              View all lessons
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[minmax(280px,340px)_minmax(0,1fr)] xl:items-start">
          <aside className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(21,39,68,0.06)] xl:sticky xl:top-24">
            <p className={portalSectionEyebrowClass}>Lesson list</p>
            <h2 className={portalSectionTitleClass}>{filterLabel ? filterLabel : "All lessons"}</h2>
            <p className={portalInlineMetaClass}>
              {filteredLessons.length} lesson{filteredLessons.length === 1 ? "" : "s"}
            </p>

            <div className="mt-4 max-h-[min(70vh,720px)] space-y-2 overflow-y-auto pr-1">
              {filteredLessons.map((lesson, index) => {
                const selected = lesson.lesson_id === activeLessonId;
                return (
                  <button
                    key={lesson.lesson_id}
                    type="button"
                    onClick={() => selectLesson(lesson.lesson_id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-left transition",
                      selected
                        ? "border-[#8DC3E1]/55 bg-[#eef6fb] shadow-[0_2px_10px_rgba(21,39,68,0.06)]"
                        : "border-transparent bg-primary/[0.03] hover:border-[#8DC3E1]/30 hover:bg-[#f8fcfe]",
                    )}
                    aria-current={selected ? "true" : undefined}
                  >
                    <span
                      className={cn(
                        "font-sans flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm font-semibold tracking-[0.005em]",
                        selected ? "bg-primary text-white" : "bg-white text-primary",
                      )}
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className={cn("line-clamp-2 font-semibold", portalNavItemClass)}>{lesson.title}</span>
                      <span className={cn("mt-1 block", portalInlineMetaClass)}>
                        {lesson.variant_count} quiz items
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="min-w-0">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className={portalInlineMetaClass}>
                Turn on learning mode for a focused, larger reading view.
              </p>
              <LearningModeToggle
                active={learningMode}
                onToggle={() => setLearningMode((value) => !value)}
                disabled={!displayLesson || detailLoading}
              />
            </div>

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
              <div className="rounded-2xl bg-white p-10 text-center shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
                <p className={portalEmptyStateClass}>Select a lesson from the list to view content.</p>
              </div>
            )}
          </main>
        </div>
      )}
    </CoursePageLayout>
    </>
  );
}
