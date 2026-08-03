"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { Icon, Loader2, X } from "@/components/icons";
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

function DialogCloseButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
      aria-label={label}
    >
      <Icon icon={X} size={16} strokeWidth={2} />
    </button>
  );
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
    <div className="rounded-2xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] p-3.5 sm:p-4">
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
                "text-brand-body flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition",
                value === option
                  ? "border-[#DDE466] bg-[#DDE466]/15 text-[color:var(--dash-text)]"
                  : "border-[color:var(--dash-surface-border)] bg-[color:var(--dash-surface,#fff)] text-[color:var(--dash-muted)] hover:bg-[color:var(--dash-soft)]",
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
                className="shrink-0"
              />
              <span className="min-w-0 break-words">{option}</span>
            </label>
          ))}
        </div>
      ) : null}

      {matchingLeft && matchingOptions ? (
        <div className="mt-3 space-y-2.5">
          {matchingLeft.map((left) => {
            const current = typeof value === "object" && value ? (value as Record<string, string>) : {};
            return (
              <div key={left} className="grid gap-2 sm:grid-cols-[1fr_1fr] sm:items-center">
                <span className="text-brand-body min-w-0 break-words text-[color:var(--dash-muted)]">{left}</span>
                <select
                  value={current[left] ?? ""}
                  disabled={disabled}
                  onChange={(event) =>
                    onChange({
                      ...current,
                      [left]: event.target.value,
                    })
                  }
                  className="dashboard-field dashboard-field-select h-11 w-full min-w-0"
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
          className="dashboard-field mt-3 w-full"
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
  const confirmTitleId = useId();
  const quizTitleId = useId();
  const leaveTitleId = useId();
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

  if (!open || typeof document === "undefined") return null;

  const overlayClass =
    "adviser-dialog-overlay fixed inset-0 z-[130] flex items-center justify-center bg-black/45 px-3 py-4 sm:px-4 sm:py-6 max-sm:items-end max-sm:px-0 max-sm:py-0";

  const sheetPanelClass =
    "adviser-dialog-panel relative z-10 flex w-full flex-col overflow-hidden rounded-2xl max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:pb-[env(safe-area-inset-bottom)]";

  return createPortal(
    <div className={overlayClass}>
      <button
        type="button"
        aria-label="Close quiz"
        className="absolute inset-0 cursor-default"
        onClick={requestLeave}
      />

      {phase === "confirm" ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={confirmTitleId}
          className={cn(sheetPanelClass, "max-w-md")}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[color:var(--dash-dim)] sm:hidden" aria-hidden />

          <div className="flex items-start justify-between gap-3 border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 md:px-6">
            <div className="min-w-0">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                Lesson quiz
              </p>
              <h2
                id={confirmTitleId}
                className="font-sans mt-1 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl"
              >
                Do you want to continue?
              </h2>
              <p className="text-brand-body mt-1 text-sm text-[color:var(--dash-muted)] sm:text-base">
                Start the quiz for{" "}
                <span className="font-medium text-[color:var(--dash-text)]">{lessonTitle}</span>.{" "}
                {variants.length} question{variants.length === 1 ? "" : "s"} ·{" "}
                <span className="font-medium text-[color:var(--dash-text)]">5 minutes</span> after
                the countdown.
              </p>
            </div>
            <DialogCloseButton onClick={onClose} label="Close quiz dialog" />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-5 sm:py-4 md:px-6">
            <button
              type="button"
              onClick={onClose}
              className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => setPhase("countdown")}
              className="font-sans inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 active:scale-[0.98] sm:w-auto"
            >
              Continue
            </button>
          </div>
        </div>
      ) : null}

      {phase === "countdown" ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Quiz countdown"
          className={cn(sheetPanelClass, "max-w-sm")}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[color:var(--dash-dim)] sm:hidden" aria-hidden />

          <div className="flex items-start justify-between gap-3 border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="min-w-0">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                Get ready
              </p>
              <h2 className="font-sans mt-1 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)]">
                Quiz starts in
              </h2>
            </div>
            <DialogCloseButton onClick={requestLeave} label="Cancel quiz countdown" />
          </div>

          <div className="px-4 py-8 text-center sm:px-5 sm:py-10">
            <p className="text-5xl font-bold tabular-nums text-[color:var(--dash-text)] sm:text-6xl">
              {secondsLeft || "Go!"}
            </p>
            <p className="text-brand-body mt-4 text-[color:var(--dash-muted)]">
              Focus up — your lesson quiz is about to begin.
            </p>
          </div>

          <div className="border-t border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:px-5 sm:py-4">
            <button
              type="button"
              onClick={requestLeave}
              className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:w-auto sm:mx-auto"
            >
              Back to lesson
            </button>
          </div>
        </div>
      ) : null}

      {phase === "quiz" ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={quizTitleId}
          className={cn(
            sheetPanelClass,
            "max-h-[min(92svh,56rem)] max-w-3xl max-sm:h-[min(96svh,56rem)] max-sm:max-h-none",
          )}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[color:var(--dash-dim)] sm:hidden" aria-hidden />

          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 md:px-6">
            <div className="min-w-0 flex-1">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                Lesson quiz
              </p>
              <h2
                id={quizTitleId}
                className="font-sans mt-1 truncate text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl"
              >
                {lessonTitle}
              </h2>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
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
                <span className="text-brand-caption text-[color:var(--dash-muted)]">
                  {variants.length} question{variants.length === 1 ? "" : "s"}
                </span>
              </div>
            </div>
            <DialogCloseButton onClick={requestLeave} label="Leave quiz" />
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5 md:px-6">
            {timedOut ? (
              <AuthAlert variant="error">
                Time is up. You can no longer submit this quiz attempt. Go back to the lesson and try
                again.
              </AuthAlert>
            ) : null}

            {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

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

          <footer className="flex shrink-0 flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3 sm:px-5 sm:py-4 md:px-6">
            <p className="text-brand-body text-center text-sm text-[color:var(--dash-muted)] sm:text-left sm:text-base">
              {timedOut
                ? "Quiz time has expired."
                : `Answer all ${variants.length} question${variants.length === 1 ? "" : "s"} to submit`}
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-2.5">
              <button
                type="button"
                onClick={requestLeave}
                className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:w-auto"
              >
                Back to lesson
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={timedOut || !allAnswered || submitting}
                className="font-sans inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Icon icon={Loader2} size={16} className="animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  "Submit quiz"
                )}
              </button>
            </div>
          </footer>
        </div>
      ) : null}

      {leaveConfirmOpen ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 px-3 py-4 sm:px-4 sm:py-6 max-sm:items-end max-sm:px-0 max-sm:py-0">
          <button
            type="button"
            aria-label="Dismiss cancel dialog"
            className="absolute inset-0 cursor-default"
            onClick={() => setLeaveConfirmOpen(false)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={leaveTitleId}
            className={cn(sheetPanelClass, "max-w-md")}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[color:var(--dash-dim)] sm:hidden" aria-hidden />

            <div className="flex items-start justify-between gap-3 border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 md:px-6">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                  Leave quiz
                </p>
                <h2
                  id={leaveTitleId}
                  className="font-sans mt-1 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl"
                >
                  Do you want to cancel this quiz?
                </h2>
                <p className="text-brand-body mt-1 text-sm text-[color:var(--dash-muted)] sm:text-base">
                  Your progress will not be saved. You can start the quiz again later from the lesson
                  page.
                </p>
              </div>
              <DialogCloseButton
                onClick={() => setLeaveConfirmOpen(false)}
                label="Keep taking quiz"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-5 sm:py-4 md:px-6">
              <button
                type="button"
                onClick={() => setLeaveConfirmOpen(false)}
                className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:w-auto"
              >
                Keep taking quiz
              </button>
              <button
                type="button"
                onClick={confirmLeave}
                className="font-sans inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 active:scale-[0.98] sm:w-auto"
              >
                Yes, cancel quiz
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>,
    document.body,
  );
}

type LessonQuizResultCardProps = {
  result: LessonQuizResult;
  courseId: string;
  onRetake: () => void;
};

export function LessonQuizResultCard({ result, courseId, onRetake }: LessonQuizResultCardProps) {
  return (
    <section className="dashboard-surface rounded-2xl p-4 sm:p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
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

      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:flex-wrap">
        <Button href={`/student/lectures/${courseId}/test-result`} variant="secondary" size="md">
          View all test results
        </Button>
        <button
          type="button"
          onClick={onRetake}
          className="font-sans inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 sm:w-auto"
        >
          Take quiz again
        </button>
      </div>
    </section>
  );
}
