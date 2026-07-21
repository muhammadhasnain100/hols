"use client";

import { useEffect, useState } from "react";
import {
  LessonQuizOverlay,
  LessonQuizResultCard,
} from "@/components/platform/provider/student/lectures/LessonQuizOverlay";
import { Button } from "@/components/ui/Button";
import type { LessonDetail, LessonQuizResult } from "@/lib/integrate/provider/student/lectures";

function ContentBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-primary/[0.06] bg-primary/[0.03] p-4 md:p-5">
      <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary/40">{title}</h3>
      <div className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-primary">{children}</div>
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
      <section className="rounded-2xl border border-[#8DC3E1]/35 bg-[#eef6fb] p-5 md:p-6">
        <div className="flex flex-wrap items-start gap-2">
          <span className="inline-flex h-8 items-center rounded-full bg-primary px-3 text-[12px] font-semibold text-white">
            Lesson {lesson.order}
          </span>
          {currentIndex && total ? (
            <span className="inline-flex h-8 items-center rounded-full bg-white/80 px-3 text-[12px] font-medium text-primary/70">
              {currentIndex} of {total}
            </span>
          ) : null}
          {lesson.l1_name ? (
            <span className="inline-flex h-8 items-center rounded-full bg-white/80 px-3 text-[12px] font-medium text-primary/70">
              {lesson.l1_name}
            </span>
          ) : null}
          {lesson.l2_name ? (
            <span className="inline-flex h-8 items-center rounded-full bg-white/80 px-3 text-[12px] font-medium text-primary/70">
              {lesson.l2_name}
            </span>
          ) : null}
        </div>
        <h2 className="mt-4 text-lg font-semibold tracking-tight text-primary md:text-xl">{lesson.title}</h2>
      </section>

      {detailLoading ? (
        <div className="rounded-2xl bg-white p-8 text-center shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
          <div className="mx-auto h-7 w-7 animate-pulse rounded-full bg-primary/10" />
          <p className="mt-3 text-[13px] text-primary/45">Loading lesson content…</p>
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
              <div className="rounded-2xl bg-white p-8 text-center shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
                <p className="text-[13px] text-primary/45">No lesson content available yet.</p>
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
            <section className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
              <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary/40">Practice quiz</p>
              <h3 className="mt-1 text-[15px] font-semibold text-primary">
                {lesson.variants.length} question{lesson.variants.length === 1 ? "" : "s"} · 5 minute limit
              </h3>
              <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-primary/55">
                Read the lesson first, then take the quiz when you are ready. You will confirm before the countdown
                starts and have 5 minutes to finish.
              </p>
              <div className="mt-4">
                <Button onClick={() => setQuizOpen(true)} variant="primary" size="md">
                  Take quiz
                </Button>
              </div>
            </section>
          ) : null}
        </>
      )}

      {(prevLessonId || nextLessonId) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
          <p className="text-[13px] text-primary/45">
            {currentIndex && total ? `Lesson ${currentIndex} of ${total}` : "Lesson navigation"}
          </p>
          <div className="flex gap-2">
            {prevLessonId ? (
              <Button
                href={lessonHref(courseId, prevLessonId, topicId, l1Name)}
                variant="secondary"
                size="md"
              >
                Previous
              </Button>
            ) : null}
            {nextLessonId ? (
              <Button
                href={lessonHref(courseId, nextLessonId, topicId, l1Name)}
                variant="primary"
                size="md"
              >
                Next lesson
              </Button>
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
