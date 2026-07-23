"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { LessonContentSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import {
  LessonQuizOverlay,
  LessonQuizResultCard,
} from "@/components/platform/provider/student/lectures/LessonQuizOverlay";
import { LessonProse } from "@/components/platform/provider/student/lectures/lessonProse";
import { gsap, registerGsap } from "@/lib/gsap";
import type { LessonDetail, LessonQuizResult } from "@/lib/integrate/provider/student/lectures";
import { prefersReducedMotion } from "@/lib/motion";

function PageSection({ title, text }: { title: string; text: string }) {
  return (
    <section data-reveal className="course-book-page-section">
      <h3 className="lesson-section-title">{title}</h3>
      <LessonProse text={text} className="mt-3" />
    </section>
  );
}

function estimateReadingMinutes(lesson: LessonDetail) {
  const text = [lesson.fact, lesson.text_content, lesson.study_bullets]
    .filter(Boolean)
    .join(" ");
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words / 200));
}

type LessonContentPanelProps = {
  lesson: LessonDetail;
  detailLoading?: boolean;
  currentIndex?: number | null;
  total?: number;
  prevLessonId?: string | null;
  nextLessonId?: string | null;
  courseId: string;
  topicId?: string;
  l1Name?: string;
};

function lessonHref(
  courseId: string,
  lessonId: string,
  topicId?: string,
  l1Name?: string,
) {
  const params = new URLSearchParams();
  if (topicId) params.set("topic_id", topicId);
  if (l1Name) params.set("l1_name", l1Name);
  const query = params.toString();
  return `/student/lectures/${courseId}/lessons/${lessonId}${query ? `?${query}` : ""}`;
}

export function LessonContentPanel({
  lesson,
  detailLoading = false,
  currentIndex,
  total,
  prevLessonId,
  nextLessonId,
  courseId,
  topicId,
  l1Name,
}: LessonContentPanelProps) {
  const router = useRouter();
  const [quizOpen, setQuizOpen] = useState(false);
  const [latestResult, setLatestResult] = useState<LessonQuizResult | null>(null);
  const [showTop, setShowTop] = useState(false);
  const pageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hasQuiz = lesson.variants.length > 0;
  const hasContent =
    Boolean(lesson.fact || lesson.text_content || lesson.study_bullets) || hasQuiz;
  const readingMinutes = useMemo(() => estimateReadingMinutes(lesson), [lesson]);

  useEffect(() => {
    setQuizOpen(false);
    setLatestResult(null);
  }, [lesson.lesson_id]);

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !pageRef.current) return;
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(
        pageRef.current,
        { opacity: 0, x: 18, rotateY: -4 },
        { opacity: 1, x: 0, rotateY: 0, duration: 0.45 },
      );
      const reveals = pageRef.current.querySelectorAll("[data-reveal]");
      if (reveals.length) {
        tl.fromTo(
          reveals,
          { opacity: 0, y: 22 },
          { opacity: 1, y: 0, duration: 0.5, stagger: 0.09 },
          0.18,
        );
      }
    },
    { dependencies: [lesson.lesson_id], scope: pageRef },
  );

  // Reading progress rail + floating scroll-to-top, tracked against page scroll.
  useEffect(() => {
    const article = pageRef.current;
    const bar = progressRef.current;
    if (!article) return;

    const update = () => {
      const rect = article.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const scrolled = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      const pct = total > 0 ? (scrolled / total) * 100 : rect.top <= 0 ? 100 : 0;
      if (bar) bar.style.width = `${pct}%`;
      setShowTop(window.scrollY > 480);
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [lesson.lesson_id]);

  // Reset to the top of the page when a new lesson opens.
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  }, [lesson.lesson_id]);

  // Keyboard page-turning with the arrow keys.
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (quizOpen) return;
      const target = event.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
        return;
      }
      if (event.key === "ArrowRight" && nextLessonId) {
        router.push(lessonHref(courseId, nextLessonId, topicId, l1Name));
      } else if (event.key === "ArrowLeft" && prevLessonId) {
        router.push(lessonHref(courseId, prevLessonId, topicId, l1Name));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [courseId, l1Name, nextLessonId, prevLessonId, quizOpen, router, topicId]);

  return (
    <div className="course-book-open relative min-w-0">
      <div className="course-book-open-spine pointer-events-none absolute inset-y-4 left-0 z-[1] hidden w-3 lg:block" aria-hidden />

      <div className="sticky top-0 z-[3] mb-3">
        <div className="lesson-progress-track">
          <div ref={progressRef} className="lesson-progress-fill" />
        </div>
      </div>

      <article
        ref={pageRef}
        className="course-book-page relative min-w-0 overflow-hidden rounded-2xl"
        style={{ transformOrigin: "left center" }}
      >
        <div className="course-book-page-grain pointer-events-none absolute inset-0" aria-hidden />

        <header className="relative border-b border-[color:var(--dash-surface-border)] px-5 pb-5 pt-5 sm:px-7 sm:pt-6 md:px-8">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.14em] text-[color:var(--dash-faint)]">
                Lesson {lesson.order}
                {currentIndex && total ? ` · Page ${currentIndex} of ${total}` : ""}
              </p>
              <h2 className="font-sans mt-2 max-w-[52ch] text-balance text-left text-xl font-bold leading-[1.18] tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-3xl">
                {lesson.title}
              </h2>
              {(lesson.l1_name || lesson.l2_name) ? (
                <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">
                  {[lesson.l1_name, lesson.l2_name].filter(Boolean).join(" · ")}
                </p>
              ) : null}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="lesson-read-chip">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 7v5l3 2" />
                  </svg>
                  {readingMinutes} min read
                </span>
                {hasQuiz ? (
                  <span className="lesson-read-chip">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="12" cy="12" r="9" />
                      <path d="M9.2 9.3a2.8 2.8 0 0 1 5.4 1c0 1.9-2.7 2.4-2.7 2.4" />
                      <path d="M12 17h.01" />
                    </svg>
                    {lesson.variants.length} quiz question{lesson.variants.length === 1 ? "" : "s"}
                  </span>
                ) : null}
              </div>
            </div>
            <span className="course-book-page-mark flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--dash-accent)]">
              HOLS
            </span>
          </div>
        </header>

        <div className="relative px-5 py-5 sm:px-7 sm:py-6 md:px-8 md:py-7">
          {detailLoading ? (
            <LessonContentSkeleton includeHeader={false} />
          ) : (
            <div className="grid gap-7">
              {lesson.fact ? <PageSection title="Lesson Content" text={lesson.fact} /> : null}
              {lesson.text_content ? (
                <PageSection title="Full Text" text={lesson.text_content} />
              ) : null}
              {lesson.study_bullets ? (
                <PageSection title="Study Bullets" text={lesson.study_bullets} />
              ) : null}

              {!hasContent ? (
                <p className="text-brand-body py-8 text-center text-[color:var(--dash-faint)]">
                  No lesson content available yet.
                </p>
              ) : null}

              {latestResult ? (
                <div data-reveal>
                  <LessonQuizResultCard
                    result={latestResult}
                    courseId={courseId}
                    onRetake={() => setQuizOpen(true)}
                  />
                </div>
              ) : hasQuiz ? (
                <section data-reveal className="course-book-quiz-band rounded-xl px-4 py-4 sm:px-5 sm:py-5">
                  <p className="text-brand-caption font-semibold uppercase tracking-[0.1em] text-[color:var(--dash-faint)]">
                    Practice quiz
                  </p>
                  <h3 className="font-sans mt-1 text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)]">
                    {lesson.variants.length} question{lesson.variants.length === 1 ? "" : "s"} · 5 minute
                    limit
                  </h3>
                  <p className="text-brand-body mt-2 max-w-2xl text-[color:var(--dash-muted)]">
                    Finish this page, then take the quiz when you are ready. You will confirm before the
                    countdown starts.
                  </p>
                  <button
                    type="button"
                    onClick={() => setQuizOpen(true)}
                    className="font-sans mt-4 inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105"
                  >
                    Take quiz
                  </button>
                </section>
              ) : null}
            </div>
          )}
        </div>

        {(prevLessonId || nextLessonId) && (
          <footer className="relative flex flex-col gap-3 border-t border-[color:var(--dash-surface-border)] px-5 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-7 md:px-8">
            <div className="flex items-center gap-3">
              <p className="text-brand-caption text-[color:var(--dash-faint)]">
                {currentIndex && total ? `Page ${currentIndex} / ${total}` : "Turn the page"}
              </p>
              {currentIndex && total && total <= 14 ? (
                <span className="hidden items-center gap-1 sm:flex" aria-hidden>
                  {Array.from({ length: total }).map((_, dot) => (
                    <span
                      key={dot}
                      className={
                        dot + 1 === currentIndex
                          ? "h-1.5 w-4 rounded-full bg-[#DDE466]"
                          : "h-1.5 w-1.5 rounded-full bg-[color:var(--dash-surface-border)]"
                      }
                    />
                  ))}
                </span>
              ) : null}
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              {prevLessonId ? (
                <Link
                  href={lessonHref(courseId, prevLessonId, topicId, l1Name)}
                  className="lesson-prev-cta dashboard-pill-soft font-sans inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition sm:flex-initial sm:px-5"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="m15 18-6-6 6-6" />
                  </svg>
                  <span className="sm:hidden">Prev</span>
                  <span className="hidden sm:inline">Previous page</span>
                </Link>
              ) : null}
              {nextLessonId ? (
                <Link
                  href={lessonHref(courseId, nextLessonId, topicId, l1Name)}
                  className="lesson-next-cta font-sans inline-flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-4 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 sm:flex-initial sm:px-5"
                >
                  <span className="sm:hidden">Next</span>
                  <span className="hidden sm:inline">Next page</span>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="m9 18 6-6-6-6" />
                  </svg>
                </Link>
              ) : null}
            </div>
          </footer>
        )}
      </article>

      <button
        type="button"
        onClick={() => window.scrollTo({ top: 0, behavior: prefersReducedMotion() ? "auto" : "smooth" })}
        className="lesson-to-top"
        data-visible={showTop ? "true" : "false"}
        aria-label="Back to top"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>

      <LessonQuizOverlay
        open={quizOpen}
        courseId={courseId}
        lessonId={lesson.lesson_id}
        lessonTitle={lesson.title}
        variants={lesson.variants}
        onClose={() => setQuizOpen(false)}
        onSubmitted={setLatestResult}
      />
    </div>
  );
}
