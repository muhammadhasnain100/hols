"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  LessonQuizOverlay,
  LessonQuizResultCard,
} from "@/components/platform/provider/student/lectures/LessonQuizOverlay";
import type { LessonDetail, LessonQuizResult } from "@/lib/integrate/provider/student/lectures";

function ContentBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="dashboard-surface rounded-2xl p-4 md:p-5">
      <h3 className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
        {title}
      </h3>
      <div className="text-brand-body mt-2 whitespace-pre-wrap leading-relaxed text-[color:var(--dash-text)]">
        {children}
      </div>
    </div>
  );
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
  const [quizOpen, setQuizOpen] = useState(false);
  const [latestResult, setLatestResult] = useState<LessonQuizResult | null>(null);
  const hasQuiz = lesson.variants.length > 0;
  const hasContent =
    Boolean(lesson.fact || lesson.text_content || lesson.supporting_content || lesson.study_bullets) ||
    hasQuiz;

  useEffect(() => {
    setQuizOpen(false);
    setLatestResult(null);
  }, [lesson.lesson_id]);

  return (
    <div className="grid gap-4">
      <section className="dashboard-hero relative overflow-hidden rounded-2xl p-5 md:p-6">
        <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
          Lesson {lesson.order}
          {currentIndex && total ? ` · ${currentIndex} of ${total}` : ""}
        </p>
        <h2 className="font-sans mt-2 text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-2xl md:leading-none">
          {lesson.title}
        </h2>
        {(lesson.l1_name || lesson.l2_name) ? (
          <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">
            {[lesson.l1_name, lesson.l2_name].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </section>

      {detailLoading ? (
        <div className="dashboard-surface rounded-2xl p-8 text-center">
          <div className="mx-auto h-7 w-7 animate-pulse rounded-full bg-[color:var(--dash-soft)]" />
          <p className="text-brand-body mt-3 text-[color:var(--dash-faint)]">Loading lesson content…</p>
        </div>
      ) : (
        <>
          <section className="grid gap-3">
            {lesson.fact ? <ContentBlock title="Lesson content">{lesson.fact}</ContentBlock> : null}
            {lesson.text_content ? <ContentBlock title="Full text">{lesson.text_content}</ContentBlock> : null}
            {lesson.study_bullets ? (
              <ContentBlock title="Study bullets">{lesson.study_bullets}</ContentBlock>
            ) : null}
            {lesson.supporting_content ? (
              <ContentBlock title="Supporting content">{lesson.supporting_content}</ContentBlock>
            ) : null}

            {!hasContent ? (
              <div className="dashboard-surface rounded-2xl p-8 text-center">
                <p className="text-brand-body text-[color:var(--dash-faint)]">No lesson content available yet.</p>
              </div>
            ) : null}
          </section>

          {latestResult ? (
            <LessonQuizResultCard
              result={latestResult}
              courseId={courseId}
              onRetake={() => setQuizOpen(true)}
            />
          ) : hasQuiz ? (
            <section className="dashboard-surface rounded-2xl p-5 md:p-6">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                Practice quiz
              </p>
              <h3 className="font-sans mt-1 text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)]">
                {lesson.variants.length} question{lesson.variants.length === 1 ? "" : "s"} · 5 minute limit
              </h3>
              <p className="text-brand-body mt-2 max-w-2xl text-[color:var(--dash-muted)]">
                Read the lesson first, then take the quiz when you are ready. You will confirm before the
                countdown starts and have 5 minutes to finish.
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
        </>
      )}

      {(prevLessonId || nextLessonId) && (
        <div className="dashboard-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4">
          <p className="text-brand-caption text-[color:var(--dash-faint)]">
            {currentIndex && total ? `Lesson ${currentIndex} of ${total}` : "Lesson navigation"}
          </p>
          <div className="flex gap-2">
            {prevLessonId ? (
              <Link
                href={lessonHref(courseId, prevLessonId, topicId, l1Name)}
                className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition"
              >
                Previous
              </Link>
            ) : null}
            {nextLessonId ? (
              <Link
                href={lessonHref(courseId, nextLessonId, topicId, l1Name)}
                className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105"
              >
                Next lesson
              </Link>
            ) : null}
          </div>
        </div>
      )}

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
