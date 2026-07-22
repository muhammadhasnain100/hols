"use client";

import { useEffect, useMemo, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { authFieldClass } from "@/components/platform/auth/auth-styles";
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
    <div className="dashboard-surface rounded-2xl p-4">
      <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
        {variant.variant_type.replaceAll("_", " ")}
      </p>
      <p className="text-brand-body mt-2 font-medium text-[color:var(--dash-text)]">{question}</p>

      {options ? (
        <div className="mt-3 space-y-2">
          {options.map((option) => (
            <label
              key={option}
              className={cn(
                "text-brand-body flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 transition",
                value === option
                  ? "border-[#DDE466] bg-[#DDE466]/15 text-[color:var(--dash-text)]"
                  : "border-[color:var(--dash-surface-border)] text-[color:var(--dash-muted)] hover:bg-[color:var(--dash-soft)]",
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
                <span className="text-brand-body text-[color:var(--dash-muted)]">{left}</span>
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
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    setPhase("confirm");
    setSecondsLeft(PRESTART_SECONDS);
    setQuizSecondsLeft(QUIZ_DURATION_SECONDS);
    setTimedOut(false);
    setAnswers({});
    setSubmitting(false);
    setError(null);
    setLeaveConfirmOpen(false);
  }, [lessonId, open]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open || phase !== "countdown" || leaveConfirmOpen) return;

    if (secondsLeft <= 0) {
      setPhase("quiz");
      return;
    }

    const timer = window.setTimeout(() => {
      setSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [leaveConfirmOpen, open, phase, secondsLeft]);

  useEffect(() => {
    if (!open || phase !== "quiz" || timedOut || leaveConfirmOpen) return;

    if (quizSecondsLeft <= 0) {
      setTimedOut(true);
      return;
    }

    const timer = window.setTimeout(() => {
      setQuizSecondsLeft((current) => current - 1);
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [leaveConfirmOpen, open, phase, quizSecondsLeft, timedOut]);

  function requestLeave() {
    if (phase === "confirm" || timedOut) {
      onClose();
      return;
    }
    setLeaveConfirmOpen(true);
  }

  function confirmLeave() {
    setLeaveConfirmOpen(false);
    onClose();
  }

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (leaveConfirmOpen) {
        setLeaveConfirmOpen(false);
        return;
      }
      if (phase === "confirm" || timedOut) {
        onClose();
        return;
      }
      setLeaveConfirmOpen(true);
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [leaveConfirmOpen, onClose, open, phase, timedOut]);

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
        className="absolute inset-0 bg-[#152744]/45 backdrop-blur-[2px]"
        onClick={requestLeave}
      />

      {phase === "confirm" ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quiz-confirm-title"
          className="relative w-full max-w-md rounded-2xl bg-[color:var(--portal-surface,#fff)] p-6 shadow-[0_20px_60px_rgba(21,39,68,0.22)]"
        >
          <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
            Lesson quiz
          </p>
          <h3
            id="quiz-confirm-title"
            className="font-sans mt-2 text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)]"
          >
            Do you want to continue?
          </h3>
          <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">
            You are about to start the quiz for{" "}
            <span className="font-medium text-[color:var(--dash-text)]">{lessonTitle}</span>. It has{" "}
            {variants.length} question{variants.length === 1 ? "" : "s"}. You will have{" "}
            <span className="font-medium text-[color:var(--dash-text)]">5 minutes</span> to complete it
            after the countdown.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPhase("countdown")}
              className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105"
            >
              Continue
            </button>
            <button
              type="button"
              onClick={onClose}
              className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {phase === "countdown" ? (
        <div
          role="dialog"
          aria-modal="true"
          className="relative w-full max-w-sm rounded-2xl bg-[color:var(--portal-surface,#fff)] p-8 text-center shadow-[0_20px_60px_rgba(21,39,68,0.22)]"
        >
          <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
            Get ready
          </p>
          <p className="font-sans mt-3 text-lg font-semibold text-[color:var(--dash-text)]">Quiz starts in</p>
          <p className="mt-4 text-5xl font-bold tabular-nums text-[color:var(--dash-text)]">
            {secondsLeft || "Go!"}
          </p>
          <p className="text-brand-body mt-4 text-[color:var(--dash-muted)]">
            Focus up — your lesson quiz is about to begin.
          </p>
          <button
            type="button"
            onClick={requestLeave}
            className="dashboard-pill-soft font-sans mt-6 inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition"
          >
            Back to lesson
          </button>
        </div>
      ) : null}

      {phase === "quiz" ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="quiz-title"
          className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-[color:var(--portal-page-bg,#f7f8fa)] shadow-[0_20px_60px_rgba(21,39,68,0.22)]"
        >
          <header className="flex items-center justify-between gap-3 border-b border-[color:var(--dash-surface-border)] bg-[color:var(--portal-surface,#fff)] px-5 py-4">
            <div className="min-w-0">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                Lesson quiz
              </p>
              <h3
                id="quiz-title"
                className="font-sans mt-0.5 truncate text-base font-semibold text-[color:var(--dash-text)]"
              >
                {lessonTitle}
              </h3>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span
                className={cn(
                  "text-brand-caption inline-flex rounded-full px-3 py-1 font-semibold tabular-nums",
                  timedOut
                    ? "bg-amber-500/15 text-amber-600"
                    : quizSecondsLeft <= 60
                      ? "bg-red-500/15 text-red-600"
                      : "bg-[color:var(--dash-soft)] text-[color:var(--dash-text)]",
                )}
              >
                {timedOut ? "Time up" : formatQuizTime(quizSecondsLeft)}
              </span>
              <button
                type="button"
                onClick={requestLeave}
                className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center justify-center rounded-full px-4 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition"
              >
                Back to lesson
              </button>
            </div>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">
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

          <footer className="border-t border-[color:var(--dash-surface-border)] bg-[color:var(--portal-surface,#fff)] px-5 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-brand-body text-[color:var(--dash-muted)]">
                {timedOut
                  ? "Quiz time has expired."
                  : `Answer all ${variants.length} question${variants.length === 1 ? "" : "s"} to submit`}
              </p>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={timedOut || !allAnswered || submitting}
                className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-50"
              >
                {submitting ? "Submitting…" : "Submit quiz"}
              </button>
            </div>
          </footer>
        </div>
      ) : null}

      {leaveConfirmOpen ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Dismiss cancel dialog"
            className="absolute inset-0 bg-[#152744]/35"
            onClick={() => setLeaveConfirmOpen(false)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="quiz-leave-title"
            className="relative w-full max-w-sm rounded-2xl bg-[color:var(--portal-surface,#fff)] p-6 shadow-[0_20px_60px_rgba(21,39,68,0.28)]"
          >
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Leave quiz
            </p>
            <h3
              id="quiz-leave-title"
              className="font-sans mt-2 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)]"
            >
              Do you want to cancel this quiz?
            </h3>
            <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">
              Your progress will not be saved. You can start the quiz again later from the lesson page.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={confirmLeave}
                className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105"
              >
                Yes, cancel quiz
              </button>
              <button
                type="button"
                onClick={() => setLeaveConfirmOpen(false)}
                className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition"
              >
                Keep taking quiz
              </button>
            </div>
          </div>
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
    <section className="dashboard-surface rounded-2xl p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
            Latest quiz result
          </p>
          <h3 className="font-sans mt-1 text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)] md:text-xl">
            {result.score_percent}% · {result.correct_count}/{result.total_questions} correct
          </h3>
          <p className="text-brand-body mt-1 text-[color:var(--dash-muted)]">
            {result.passed ? "You passed this lesson quiz." : "Review the lesson and try again when ready."}
          </p>
        </div>
        <span
          className={cn(
            "text-brand-caption inline-flex rounded-full px-3 py-1 font-semibold",
            result.passed ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600",
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
              "text-brand-body rounded-xl px-3.5 py-3",
              answer.is_correct
                ? "bg-emerald-500/10 text-[color:var(--dash-text)]"
                : "bg-amber-500/10 text-[color:var(--dash-text)]",
            )}
          >
            <span className="font-medium">{answer.question ?? "Question"}</span>
            <span className="text-[color:var(--dash-faint)]">
              {" "}
              · {answer.is_correct ? "Correct" : "Incorrect"}
            </span>
            {!answer.is_correct ? (
              <p className="mt-1 text-[color:var(--dash-faint)]">
                Correct answer: {formatAnswer(answer.correct_answer)}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onRetake}
          className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105"
        >
          Take quiz again
        </button>
        <Button href={`/student/lectures/${courseId}/test-result`} variant="secondary" size="md">
          View all test results
        </Button>
      </div>
    </section>
  );
}
