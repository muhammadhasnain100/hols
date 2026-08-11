"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { Check, Icon } from "@/components/icons";
import { LessonsWorkspaceSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { CoursePageLayout } from "@/components/platform/provider/student/lectures/CoursePageLayout";
import { LessonContentPanel } from "@/components/platform/provider/student/lectures/LessonContentPanel";
import {
  LearningModeToggle,
  LessonLearningView,
} from "@/components/platform/provider/student/lectures/LessonLearningView";
import { ApiRequestError } from "@/lib/integrate/client";
import { gsap, registerGsap } from "@/lib/gsap";
import {
  getCachedLesson,
  getCourseBundle,
  getLesson,
  type CourseSummary,
  type LessonDetail,
} from "@/lib/integrate/provider/student/lectures";
import { prefersReducedMotion } from "@/lib/motion";
import { scrollAppToTop } from "@/lib/scroll-to-top";
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
  const stageRef = useRef<HTMLDivElement>(null);
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

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !stageRef.current || loading) return;
      const index = stageRef.current.querySelector("[data-book-index]");
      const page = stageRef.current.querySelector("[data-book-reading]");
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (index) {
        tl.fromTo(index, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: 0.5 }, 0);
      }
      if (page) {
        tl.fromTo(page, { opacity: 0, x: 20 }, { opacity: 1, x: 0, duration: 0.55 }, 0.08);
      }
    },
    { dependencies: [loading, course?.course_id], scope: stageRef },
  );

  function navigateLesson(lessonId: string) {
    setActiveLessonId(lessonId);
    scrollAppToTop();
    router.replace(buildLessonsHref(courseId, lessonId, topicId, l1Name));
  }

  function selectLesson(lessonId: string) {
    if (learningMode) {
      navigateLesson(lessonId);
      return;
    }
    setActiveLessonId(lessonId);
    scrollAppToTop();
    router.push(buildLessonsHref(courseId, lessonId, topicId, l1Name));
  }

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
        title={course ? course.title : "Lessons"}
        description=""
        courseId={courseId}
        courseNavActive="lessons"
        backHref={`/student/lectures/${courseId}`}
        backLabel="Back to cover"
        hideHero
      >
        {(topicId || l1Name) && (
          <div className="course-book-filter mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl px-4 py-3">
            <p className="text-brand-body text-[color:var(--dash-muted)]">
              Reading{" "}
              <span className="font-medium text-[color:var(--dash-text)]">{filterLabel}</span>
            </p>
            <Link
              href={`/student/lectures/${courseId}/lessons`}
              className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center gap-1 rounded-full px-4 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-muted)] transition hover:text-[color:var(--dash-text)]"
            >
              Show full volume
            </Link>
          </div>
        )}

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        {loading ? (
          <LessonsWorkspaceSkeleton />
        ) : filteredLessons.length === 0 ? (
          <div className="course-book-page rounded-2xl p-10 text-center">
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
          <div ref={stageRef} className="grid gap-4 lg:grid-cols-[minmax(220px,280px)_minmax(0,1fr)] lg:items-start">
            <aside
              data-book-index
              className="course-book-index relative order-2 flex max-h-[min(42vh,22rem)] flex-col overflow-hidden rounded-2xl lg:order-1 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-2rem)]"
            >
              <div className="course-book-index-spine pointer-events-none absolute inset-y-0 left-0 w-2.5" aria-hidden />
              <div className="relative flex shrink-0 flex-col gap-3 border-b border-[color:var(--dash-surface-border)] px-4 py-4 pl-5 sm:px-5 sm:pl-6">
                <div>
                  <p className="text-brand-caption font-semibold uppercase tracking-[0.14em] text-[color:var(--dash-faint)]">
                    Index
                  </p>
                  <h2 className="font-sans mt-1 text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)]">
                    {course?.title ?? "Lessons"}
                  </h2>
                  <p className="text-brand-caption mt-1 text-[color:var(--dash-muted)]">
                    {filteredLessons.length} page{filteredLessons.length === 1 ? "" : "s"}
                    {filterLabel ? ` · ${filterLabel}` : ""}
                  </p>
                </div>
                <LearningModeToggle
                  active={learningMode}
                  onToggle={() => setLearningMode((value) => !value)}
                  disabled={!displayLesson || detailLoading}
                />
              </div>

              <div className="relative min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-contain p-3 pl-4 [scrollbar-width:thin] sm:pl-5">
                {filteredLessons.map((lesson, index) => {
                  const selected = lesson.lesson_id === activeLessonId;
                  return (
                    <button
                      key={lesson.lesson_id}
                      type="button"
                      onClick={() => selectLesson(lesson.lesson_id)}
                      className={cn(
                        "lesson-index-row group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left",
                        selected
                          ? "bg-[color:var(--dash-soft)] shadow-[inset_3px_0_0_0_#DDE466]"
                          : "hover:bg-[color:var(--dash-soft)]",
                      )}
                      aria-current={selected ? "true" : undefined}
                    >
                      <span
                        className={cn(
                          "lesson-index-badge mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums",
                          selected
                            ? "bg-[#DDE466] text-[#152744]"
                            : "bg-[#DDE466]/15 text-[color:var(--dash-accent)]",
                        )}
                      >
                        {selected ? (
                          <Icon icon={Check} size={13} strokeWidth={2.5} />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "font-sans line-clamp-2 text-sm font-medium leading-snug text-[color:var(--dash-text)]",
                            selected && "text-[color:var(--dash-accent)]",
                          )}
                        >
                          {lesson.title}
                        </span>
                        {lesson.l2_name ? (
                          <span className="text-brand-caption mt-0.5 block line-clamp-1 text-[color:var(--dash-faint)]">
                            {lesson.l2_name}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            </aside>

            <main data-book-reading className="order-1 min-w-0 lg:order-2">
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
                <div className="course-book-page rounded-2xl p-10 text-center">
                  <p className="text-brand-body text-[color:var(--dash-faint)]">
                    Select a page from the index to begin reading.
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
