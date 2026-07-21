"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { authFieldClass } from "@/components/platform/auth/auth-styles";
import {
  portalCardTitleClass,
  portalInlineMetaClass,
  portalRowCategoryClass,
  portalSectionDescClass,
  portalSectionEyebrowClass,
  portalSectionTitleClass,
  portalSubnavItemClass,
} from "@/components/platform/provider/portal-styles";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  submitLessonQuiz,
  type LessonQuizResult,
  type LessonVariant,
} from "@/lib/integrate/provider/student/lectures";
import { cn } from "@/lib/utils";

const PRESTART_SECONDS = 3;
const QUIZ_DURATION_SECONDS = 5 * 60;

function formatQuizTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

type LessonQuizOverlayProps = {
  open: boolean;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  variants: LessonVariant[];
  onClose: () => void;
  onSubmitted: (result: LessonQuizResult) => void;
};

function formatAnswer(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${key} → ${String(entry)}`)
      .join(", ");
  }
  return String(value);
}

function QuizQuestion({
  variant,
  value,
  disabled,
  onChange,
}: {
  variant: LessonVariant;
  value: unknown;
  disabled: boolean;
  onChange: (value: unknown) => void;
}) {
  const content = variant.content ?? {};
  const question = typeof content.question === "string" ? content.question : "Question";
  const options = Array.isArray(content.options) ? content.options.map(String) : null;
  const matchingLeft = Array.isArray(content.matchingLeft) ? content.matchingLeft.map(String) : null;
  const matchingOptions = Array.isArray(content.matchingOptions)
    ? content.matchingOptions.map(String)
    : null;

  return (
    <div className="rounded-xl border border-primary/[0.06] bg-white p-4 shadow-[0_1px_3px_rgba(21,39,68,0.04)]">
      <p className={portalRowCategoryClass}>{variant.variant_type.replaceAll("_", " ")}</p>
      <p className={cn("mt-2 font-medium", portalSectionDescClass)}>{question}</p>

      {options ? (
        <div className="mt-3 space-y-2">
          {options.map((option) => (
            <label
              key={option}
              className={cn(
                "text-brand-body flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2 transition",
                value === option
                  ? "border-primary bg-primary/[0.05] text-primary"
                  : "border-primary/[0.08] text-primary/70 hover:border-primary/20",
                disabled && "cursor-not-allowed opacity-70",
              )}
            >
              <input
                type="radio"
                name={variant.id}
                value={option}
                checked={value === option}
                disabled={disabled}
                onChange={() => onChange(option)}
              />
              <span>{option}</span>
            </label>
          ))}
        </div>
      ) : null}

      {matchingLeft && matchingOptions ? (
        <div className="mt-3 space-y-2">
          {matchingLeft.map((left) => {
            const current = typeof value === "object" && value ? (value as Record<string, string>) : {};
            return (
              <div key={left} className="grid gap-2 sm:grid-cols-[1fr_1fr] sm:items-center">
                <span className={portalSectionDescClass}>{left}</span>
                <select
                  value={current[left] ?? ""}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...current,
                      [left]: event.target.value,
                    })
                  }
                  className={cn(authFieldClass, "rounded-xl px-4 py-2")}
                >
                  <option value="">Select match</option>
                  {matchingOptions.map((option) => (
                    <option key={`${left}-${option}`} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            );
          })}
        </div>
      ) : null}

      {!options && !matchingLeft ? (
        <input
          type="text"
          value={typeof value === "string" ? value : ""}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Type your answer"
          className={cn(authFieldClass, "mt-3 w-full rounded-xl px-4 py-2")}
        />
      ) : null}
    </div>
  );
}

export function LessonQuizOverlay({
  open,
  courseId,
  lessonId,
  lessonTitle,
  variants,
  onClose,
  onSubmitted,
}: LessonQuizOverlayProps) {
  const [phase, setPhase] = useState<"confirm" | "countdown" | "quiz">("confirm");
  const [secondsLeft, setSecondsLeft] = useState(PRESTART_SECONDS);
  const [quizSecondsLeft, setQuizSecondsLeft] = useState(QUIZ_DURATION_SECONDS);
  const [timedOut, setTimedOut] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setPhase("confirm");
    setSecondsLeft(PRESTART_SECONDS);
    setQuizSecondsLeft(QUIZ_DURATION_SECONDS);
    setTimedOut(false);
    setAnswers({});
    setSubmitting(false);
    setError(null);
  }, [lessonId, open]);

  useEffect(() => {
    if (!open || phase !== "countdown") return;

    if (secondsLeft <= 0) {
      setPhase("quiz");
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [open, phase, secondsLeft]);

  useEffect(() => {
    if (!open || phase !== "quiz" || timedOut) return;

    if (quizSecondsLeft <= 0) {
      setTimedOut(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setQuizSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [open, phase, quizSecondsLeft, timedOut]);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && phase === "confirm") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose, open, phase]);

  const allAnswered = useMemo(
    () =>
      variants.every((variant) => {
        const value = answers[variant.id];
        if (variant.variant_type === "matching") {
          const leftItems = Array.isArray(variant.content?.matchingLeft)
            ? variant.content.matchingLeft.map(String)
            : [];
          if (!value || typeof value !== "object") return false;
          return leftItems.every((left) => Boolean((value as Record<string, string>)[left]));
        }
        return value !== undefined && value !== null && String(value).trim() !== "";
      }),
    [answers, variants],
  );

  async function handleSubmit() {
    if (timedOut) return;

    setSubmitting(true);
    setError(null);
    try {
      const payload = await submitLessonQuiz(courseId, lessonId, {
        answers: variants.map((variant) => ({
          variant_id: variant.id,
          answer: answers[variant.id],
        })),
      });
      onSubmitted(payload);
      onClose();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to submit quiz.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close quiz"
        className="absolute inset-0 bg-primary/40 backdrop-blur-[2px]"
        onClick={phase === "confirm" ? onClose : undefined}
      />

      {phase === "confirm" ? (
        <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-[0_20px_60px_rgba(21,39,68,0.18)]">
          <p className={portalSectionEyebrowClass}>Lesson quiz</p>
          <h3 className={cn("mt-2", portalCardTitleClass)}>Do you want to continue?</h3>
          <p className={cn("mt-2", portalSectionDescClass)}>
            You are about to start the quiz for <span className="font-medium text-primary">{lessonTitle}</span>.
            It has {variants.length} question{variants.length === 1 ? "" : "s"}. You will have{" "}
            <span className="font-medium text-primary">5 minutes</span> to complete it after the countdown.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <Button onClick={() => setPhase("countdown")} variant="primary" size="md">
              Continue
            </Button>
            <Button onClick={onClose} variant="secondary" size="md">
              Cancel
            </Button>
          </div>
        </div>
      ) : null}

      {phase === "countdown" ? (
        <div className="relative w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-[0_20px_60px_rgba(21,39,68,0.18)]">
          <p className={portalSectionEyebrowClass}>Get ready</p>
          <p className={cn("mt-3 font-medium", portalSectionTitleClass)}>Quiz starts in</p>
          <p className="mt-4 text-5xl font-bold tabular-nums text-primary">{secondsLeft || "Go!"}</p>
          <p className={cn("mt-4", portalSectionDescClass)}>Focus up — your lesson quiz is about to begin.</p>
        </div>
      ) : null}

      {phase === "quiz" ? (
        <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[#f7f9fc] shadow-[0_20px_60px_rgba(21,39,68,0.18)]">
          <header className="flex items-center justify-between gap-3 border-b border-primary/[0.08] bg-white px-5 py-4">
            <div>
              <p className={portalSectionEyebrowClass}>Lesson quiz</p>
              <h3 className={portalSectionTitleClass}>{lessonTitle}</h3>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "text-brand-caption inline-flex rounded-full px-3 py-1 font-semibold tabular-nums",
                  timedOut
                    ? "bg-amber-100 text-amber-700"
                    : quizSecondsLeft <= 60
                      ? "bg-red-100 text-red-700"
                      : "bg-primary/[0.06] text-primary",
                )}
              >
                {timedOut ? "Time up" : formatQuizTime(quizSecondsLeft)}
              </span>
              <Button onClick={onClose} variant="secondary" size="sm">
                Back to lesson
              </Button>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4">
            {timedOut ? (
              <div className="mb-4">
                <AuthAlert variant="error">
                  Time is up. You can no longer submit this quiz attempt. Go back to the lesson and try again.
                </AuthAlert>
              </div>
            ) : null}

            {error ? (
              <div className="mb-4">
                <AuthAlert variant="error">{error}</AuthAlert>
              </div>
            ) : null}

            <div className="grid gap-3">
              {variants.map((variant) => (
                <QuizQuestion
                  key={variant.id}
                  variant={variant}
                  value={answers[variant.id]}
                  disabled={submitting || timedOut}
                  onChange={(value) =>
                    setAnswers((current) => ({
                      ...current,
                      [variant.id]: value,
                    }))
                  }
                />
              ))}
            </div>
          </div>

          <footer className="border-t border-primary/[0.08] bg-white px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className={portalSectionDescClass}>
                {timedOut
                  ? "Quiz time has expired."
                  : `Answer all ${variants.length} question${variants.length === 1 ? "" : "s"} to submit`}
              </p>
              <Button
                onClick={() => void handleSubmit()}
                variant="primary"
                size="md"
                disabled={timedOut || !allAnswered || submitting}
              >
                {submitting ? "Submitting…" : "Submit quiz"}
              </Button>
            </div>
          </footer>
        </div>
      ) : null}
    </div>
  );
}

type LessonQuizResultCardProps = {
  result: LessonQuizResult;
  courseId: string;
  onRetake: () => void;
};

export function LessonQuizResultCard({ result, courseId, onRetake }: LessonQuizResultCardProps) {
  return (
    <section className="rounded-2xl border border-primary/[0.08] bg-white p-5 shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className={portalSectionEyebrowClass}>Latest quiz result</p>
          <h3 className={cn("mt-1", portalCardTitleClass)}>
            {result.score_percent}% · {result.correct_count}/{result.total_questions} correct
          </h3>
          <p className={cn("mt-1", portalSectionDescClass)}>
            {result.passed ? "You passed this lesson quiz." : "Review the lesson and try again when ready."}
          </p>
        </div>
        <span
          className={cn(
            "text-brand-caption inline-flex rounded-full px-3 py-1 font-semibold",
            result.passed ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
          )}
        >
          {result.passed ? "Passed" : "Needs review"}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {result.answers.map((answer) => (
          <div
            key={answer.variant_id}
            className={cn(
              "text-brand-body rounded-xl border px-3 py-2",
              answer.is_correct
                ? "border-emerald-200 bg-emerald-50/70 text-primary"
                : "border-amber-200 bg-amber-50/70 text-primary",
            )}
          >
            <span className="font-medium">{answer.question ?? "Question"}</span>
            <span className="text-primary/55"> · {answer.is_correct ? "Correct" : "Incorrect"}</span>
            {!answer.is_correct ? (
              <p className="mt-1 text-primary/55">Correct answer: {formatAnswer(answer.correct_answer)}</p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={onRetake} variant="primary" size="md">
          Take quiz again
        </Button>
        <Button href={`/student/lectures/${courseId}/test-result`} variant="secondary" size="md">
          View all test results
        </Button>
      </div>
    </section>
  );
}
