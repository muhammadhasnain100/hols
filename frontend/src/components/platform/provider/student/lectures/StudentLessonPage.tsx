"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getLesson,
  type LessonDetail,
  type LessonVariant,
} from "@/lib/integrate/provider/student/lectures";

type StudentLessonPageProps = {
  courseId: string;
  lessonId: string;
};

function VariantCard({ variant }: { variant: LessonVariant }) {
  const content = variant.content ?? {};
  const question = typeof content.question === "string" ? content.question : null;
  const answer = content.answer;
  const options = Array.isArray(content.options) ? content.options : null;
  const pairs = Array.isArray(content.matchingPairs) ? content.matchingPairs : null;

  return (
    <div className="rounded-2xl border border-border/40 bg-white/60 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">
        {variant.variant_type.replaceAll("_", " ")}
      </p>
      {question ? <p className="mt-2 text-sm font-medium text-primary">{question}</p> : null}
      {options ? (
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {options.map((option) => (
            <li key={String(option)}>• {String(option)}</li>
          ))}
        </ul>
      ) : null}
      {pairs ? (
        <ul className="mt-3 space-y-1 text-sm text-muted">
          {pairs.map((pair, index) => {
            const left =
              pair && typeof pair === "object" && "left" in pair ? String(pair.left) : "?";
            const right =
              pair && typeof pair === "object" && "right" in pair ? String(pair.right) : "?";
            return (
              <li key={`${left}-${index}`}>
                {left} → {right}
              </li>
            );
          })}
        </ul>
      ) : null}
      {answer !== undefined ? (
        <p className="mt-3 text-sm text-muted">
          <span className="font-medium text-primary">Answer:</span> {String(answer)}
        </p>
      ) : null}
    </div>
  );
}

export function StudentLessonPage({ courseId, lessonId }: StudentLessonPageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lesson, setLesson] = useState<LessonDetail | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getLesson(courseId, lessonId);
        setLesson(data.lesson);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Failed to load lesson.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [courseId, lessonId]);

  return (
    <PortalShell
      role="student"
      title={lesson ? `Lesson ${lesson.order}` : "Lesson"}
      subtitle={lesson?.l2_name ?? "Lecture detail and practice variants"}
      nav={studentNav}
    >
      <div className="grid gap-6">
        <Link
          href={`/student/lectures/${courseId}/lessons${
            lesson?.topic_id ? `?topic_id=${encodeURIComponent(lesson.topic_id)}` : ""
          }`}
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          ← Back to lessons
        </Link>

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        {loading ? (
          <div className="glass-panel rounded-3xl p-8 text-sm text-muted">Loading lesson…</div>
        ) : lesson ? (
          <>
            <section className="glass-panel rounded-3xl p-6 md:p-8">
              <h2 className="font-sans text-xl font-semibold text-primary">{lesson.title}</h2>
              {lesson.l1_name || lesson.l2_name ? (
                <p className="mt-2 text-sm text-muted">
                  {[lesson.l1_name, lesson.l2_name].filter(Boolean).join(" · ")}
                </p>
              ) : null}

              {lesson.fact ? (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">Fact</h3>
                  <p className="mt-2 text-sm leading-relaxed text-primary">{lesson.fact}</p>
                </div>
              ) : null}

              {lesson.study_bullets ? (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                    Study bullets
                  </h3>
                  <pre className="mt-2 whitespace-pre-wrap font-sans text-sm leading-relaxed text-primary">
                    {lesson.study_bullets}
                  </pre>
                </div>
              ) : null}

              {lesson.supporting_content ? (
                <div className="mt-6">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted">
                    Supporting content
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-primary">
                    {lesson.supporting_content}
                  </p>
                </div>
              ) : null}
            </section>

            <section className="glass-panel rounded-3xl p-6 md:p-8">
              <h3 className="font-sans text-lg font-semibold text-primary">
                Practice variants ({lesson.variants.length})
              </h3>
              <div className="mt-4 grid gap-3">
                {lesson.variants.map((variant) => (
                  <VariantCard key={variant.id} variant={variant} />
                ))}
              </div>
            </section>
          </>
        ) : null}
      </div>
    </PortalShell>
  );
}
