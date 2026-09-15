"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { authFieldClass } from "@/components/platform/auth/auth-styles";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
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
      className="quiz-dialog-close inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)] transition hover:bg-[#DDE466]/25 hover:text-[#152744]"
      aria-label={label}
    >
      <SidebarSvgIcon name="cross" size={28} strokeWidth={2.2} />
    </button>
  );
}

function QuizEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-brand-caption inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
      <SidebarSvgIcon name="quiz" size={13} />
      {children}
    </p>
  );
}

function QuizMatchSelect({
  value,
  disabled,
  options,
  onChange,
}: {
  value: string;
  disabled: boolean;
  options: string[];
  onChange: (value: string) => void;
}) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (rootRef.current?.contains(event.target as Node)) return;
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="quiz-match-select relative min-w-0">
      <button
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        className={cn(
          authFieldClass,
          "quiz-field-select flex h-11 min-h-11 w-full min-w-0 items-center justify-between gap-2 px-4 py-0 pr-11 text-left",
          open && "border-[#DDE466]",
          disabled && "cursor-not-allowed opacity-70",
        )}
      >
        <span
          className={cn(
            "min-w-0 truncate",
            value ? "text-[color:var(--dash-text)]" : "text-[color:var(--dash-faint)]",
          )}
        >
          {value || "Select match"}
        </span>
      </button>
      <span
        className="quiz-select-chevron pointer-events-none absolute inset-y-0 right-0 flex w-11 items-center justify-center"
        aria-hidden
      >
        <SidebarSvgIcon
          name={open ? "chevron-up" : "chevron-down"}
          size={16}
          strokeWidth={2.35}
        />
      </span>

      {open ? (
        <ul
          id={listId}
          role="listbox"
          className="quiz-select-menu absolute left-0 right-0 top-[calc(100%+0.35rem)] z-30 overflow-hidden rounded-lg p-1.5"
        >
          <li role="option" aria-selected={!value}>
            <button
              type="button"
              onClick={() => {
                onChange("");
                setOpen(false);
              }}
              className={cn(
                "quiz-select-option font-sans flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm transition",
                !value
                  ? "is-selected"
                  : "text-[color:var(--dash-muted)]",
              )}
            >
              <span>Select match</span>
            </button>
          </li>
          {options.map((option) => {
            const isSelected = option === value;
            return (
              <li key={option} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "quiz-select-option font-sans flex w-full items-center justify-between gap-2 rounded-md px-3 py-2.5 text-left text-sm transition",
                    isSelected ? "is-selected" : "text-[color:var(--dash-text)]",
                  )}
                >
                  <span className="min-w-0 break-words">{option}</span>
                  {isSelected ? (
                    <SidebarSvgIcon name="check" size={14} strokeWidth={2.2} className="shrink-0" />
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}

function QuizQuestion({
  variant,
  index,
  value,
  disabled,
  onChange,
}: {
  variant: LessonVariant;
  index: number;
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
    <div className="quiz-question-card rounded-xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] p-3.5 sm:p-4">
      <div className="flex items-center gap-2">
        <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-lg bg-[#DDE466]/35 px-2 text-xs font-bold tabular-nums text-[#152744]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
          {variant.variant_type.replaceAll("_", " ")}
        </p>
      </div>
      <p className="text-brand-body mt-2.5 font-medium text-[color:var(--dash-text)]">{question}</p>

      {options ? (
        <div className="mt-3 space-y-2">
          {options.map((option) => {
            const isSelected = value === option;
            return (
              <button
                key={option}
                type="button"
                disabled={disabled}
                onClick={() => onChange(option)}
                className={cn(
                  "quiz-option-card text-brand-body flex w-full cursor-pointer items-center gap-2.5 rounded-lg border bg-white px-3 py-2.5 text-left shadow-none outline-none",
                  isSelected
                    ? "is-selected border-transparent text-[color:var(--sidebar-active-fg,#6f7a1c)]"
                    : "border-primary/10 text-[color:var(--dash-muted)]",
                  disabled && "cursor-not-allowed opacity-70",
                )}
              >
                <span
                  className={cn(
                    "quiz-option-check flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
                    isSelected
                      ? "border-[color:var(--sidebar-active-fg,#6f7a1c)] text-[color:var(--sidebar-active-fg,#6f7a1c)]"
                      : "border-primary/20 bg-white text-transparent",
                  )}
                  aria-hidden
                >
                  <SidebarSvgIcon name="check" size={12} strokeWidth={2.4} />
                </span>
                <span className="min-w-0 break-words">{option}</span>
              </button>
            );
          })}
        </div>
      ) : null}

      {matchingLeft && matchingOptions ? (
        <div className="mt-3 space-y-2.5">
          {matchingLeft.map((left) => {
            const current = typeof value === "object" && value ? (value as Record<string, string>) : {};
            return (
              <div key={left} className="grid gap-2 sm:grid-cols-[1fr_1fr] sm:items-center">
                <span className="text-brand-body min-w-0 break-words text-[color:var(--dash-muted)]">{left}</span>
                <QuizMatchSelect
                  value={current[left] ?? ""}
                  disabled={disabled}
                  options={matchingOptions}
                  onChange={(next) =>
                    onChange({
                      ...current,
                      [left]: next,
                    })
                  }
                />
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
          className={cn(
            authFieldClass,
            "quiz-answer-field mt-3 px-4",
            disabled && "cursor-not-allowed opacity-70",
          )}
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

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
      const timer = window.setTimeout(() => {
        setPhase("quiz");
      }, 650);
      return () => window.clearTimeout(timer);
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

  function startCountdown() {
    setSecondsLeft(PRESTART_SECONDS);
    setPhase("countdown");
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

  if (!open || !mounted) return null;

  const overlayClass =
    "adviser-dialog-overlay quiz-dialog-overlay fixed inset-0 z-[130] flex items-center justify-center bg-black/60 px-3 py-4 backdrop-blur-sm sm:px-4 sm:py-6 max-sm:items-end max-sm:px-0 max-sm:py-0";

  const sheetPanelClass =
    "adviser-dialog-panel quiz-dialog-panel relative z-10 flex w-full flex-col overflow-hidden max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:pb-[env(safe-area-inset-bottom)]";

  const countdownLabel = secondsLeft > 0 ? String(secondsLeft) : "Go!";

  return createPortal(
    <div className={overlayClass} role="presentation">
      <button
        type="button"
        aria-label="Close quiz"
        className="absolute inset-0 z-0 cursor-default"
        onClick={requestLeave}
      />
      <div className="pointer-events-none absolute inset-0 z-0 bg-black/20" aria-hidden />

      {phase === "confirm" ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={confirmTitleId}
          className={cn(sheetPanelClass, "max-w-md")}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-lg bg-[color:var(--dash-dim)] sm:hidden" aria-hidden />

          <div className="border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:px-5 sm:py-4 md:px-6">
            <div className="flex min-h-11 items-center justify-between gap-3">
              <QuizEyebrow>Lesson quiz</QuizEyebrow>
              <DialogCloseButton onClick={onClose} label="Close quiz dialog" />
            </div>
            <h2
              id={confirmTitleId}
              className="font-sans mt-2 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl"
            >
              Do you want to continue?
            </h2>
            <p className="text-brand-body mt-1 text-sm text-[color:var(--dash-muted)] sm:text-base">
              Start the quiz for{" "}
              <span className="font-medium text-[color:var(--dash-text)]">{lessonTitle}</span>.{" "}
              {variants.length} question{variants.length === 1 ? "" : "s"} ·{" "}
              <span className="inline-flex items-center gap-1 font-medium text-[color:var(--dash-text)]">
                <SidebarSvgIcon name="clock" size={14} strokeWidth={2} />
                5 minutes
              </span>{" "}
              after the countdown.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-5 sm:py-4 md:px-6">
            <button
              type="button"
              onClick={onClose}
              className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={startCountdown}
              className="font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 active:scale-[0.98] sm:w-auto"
            >
              <SidebarSvgIcon name="next" size={15} />
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
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-lg bg-[color:var(--dash-dim)] sm:hidden" aria-hidden />

          <div className="border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex min-h-11 items-center justify-between gap-3">
              <QuizEyebrow>Get ready</QuizEyebrow>
              <DialogCloseButton onClick={requestLeave} label="Cancel quiz countdown" />
            </div>
            <h2 className="font-sans mt-2 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)]">
              Quiz starts in
            </h2>
          </div>

          <div className="px-4 py-8 text-center sm:px-5 sm:py-10">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[#DDE466]/25 text-[color:var(--dash-accent)]">
              <SidebarSvgIcon name={secondsLeft > 0 ? "clock" : "focus"} size={24} strokeWidth={2} />
            </div>
            <p
              className="font-sans text-6xl font-bold tabular-nums leading-none tracking-tight text-[color:var(--dash-text)] sm:text-7xl"
              aria-live="polite"
            >
              {countdownLabel}
            </p>
            <p className="text-brand-body mt-4 inline-flex items-center justify-center gap-1.5 text-[color:var(--dash-muted)]">
              <SidebarSvgIcon name="focus" size={14} />
              Focus up — your lesson quiz is about to begin.
            </p>
          </div>

          <div className="border-t border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:px-5 sm:py-4">
            <button
              type="button"
              onClick={requestLeave}
              className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:mx-auto sm:w-auto"
            >
              <SidebarSvgIcon name="previous" size={15} />
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
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-lg bg-[color:var(--dash-dim)] sm:hidden" aria-hidden />

          <header className="shrink-0 border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:px-5 sm:py-4 md:px-6">
            <div className="flex min-h-11 items-center justify-between gap-3">
              <QuizEyebrow>Lesson quiz</QuizEyebrow>
              <DialogCloseButton onClick={requestLeave} label="Leave quiz" />
            </div>
            <h2
              id={quizTitleId}
              className="font-sans mt-2 truncate text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl"
            >
              {lessonTitle}
            </h2>
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <span
                className={cn(
                  "text-brand-caption inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 font-semibold tabular-nums",
                  timedOut
                    ? "bg-amber-500/15 text-amber-600"
                    : quizSecondsLeft <= 60
                      ? "bg-red-500/15 text-red-600"
                      : "bg-[color:var(--dash-soft)] text-[color:var(--dash-text)]",
                )}
              >
                <SidebarSvgIcon name="clock" size={14} strokeWidth={2} />
                {timedOut ? "Time up" : formatQuizTime(quizSecondsLeft)}
              </span>
              <span className="text-brand-caption inline-flex items-center gap-1.5 text-[color:var(--dash-muted)]">
                <SidebarSvgIcon name="quiz" size={13} />
                {variants.length} question{variants.length === 1 ? "" : "s"}
              </span>
            </div>
          </header>

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5 md:px-6">
            {timedOut ? (
              <AuthAlert variant="error">
                Time is up. You can no longer submit this quiz attempt. Go back to the lesson and try
                again.
              </AuthAlert>
            ) : null}

            {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

            {variants.map((variant, index) => (
              <QuizQuestion
                key={variant.id}
                variant={variant}
                index={index}
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
                className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:w-auto"
              >
                <SidebarSvgIcon name="previous" size={15} />
                Back to lesson
              </button>
              <button
                type="button"
                onClick={() => void handleSubmit()}
                disabled={timedOut || !allAnswered || submitting}
                className="font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <SidebarSvgIcon name="spinner" size={16} className="animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  <>
                    <SidebarSvgIcon name="check" size={15} />
                    Submit quiz
                  </>
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
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-lg bg-[color:var(--dash-dim)] sm:hidden" aria-hidden />

            <div className="border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:px-5 sm:py-4 md:px-6">
              <div className="flex min-h-11 items-center justify-between gap-3">
                <QuizEyebrow>Leave quiz</QuizEyebrow>
                <DialogCloseButton
                  onClick={() => setLeaveConfirmOpen(false)}
                  label="Keep taking quiz"
                />
              </div>
              <h2
                id={leaveTitleId}
                className="font-sans mt-2 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl"
              >
                Do you want to cancel this quiz?
              </h2>
              <p className="text-brand-body mt-1 text-sm text-[color:var(--dash-muted)] sm:text-base">
                Your progress will not be saved. You can start the quiz again later from the lesson
                page.
              </p>
            </div>

            <div className="flex flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-5 sm:py-4 md:px-6">
              <button
                type="button"
                onClick={() => setLeaveConfirmOpen(false)}
                className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:w-auto"
              >
                <SidebarSvgIcon name="previous" size={15} />
                Keep taking quiz
              </button>
              <button
                type="button"
                onClick={confirmLeave}
                className="font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 active:scale-[0.98] sm:w-auto"
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
          <p className="text-brand-caption inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
            <SidebarSvgIcon name="quiz" size={13} />
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
            "text-brand-caption inline-flex items-center gap-1.5 rounded-lg px-3 py-1 font-semibold",
            result.passed ? "bg-emerald-500/15 text-emerald-600" : "bg-amber-500/15 text-amber-600",
          )}
        >
          <SidebarSvgIcon name={result.passed ? "check" : "quiz"} size={13} />
          {result.passed ? "Passed" : "Needs review"}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {result.answers.map((answer) => (
          <div
            key={answer.variant_id}
            className={cn(
              "text-brand-body flex items-start gap-2 rounded-xl px-3.5 py-3",
              answer.is_correct
                ? "bg-emerald-500/10 text-[color:var(--dash-text)]"
                : "bg-amber-500/10 text-[color:var(--dash-text)]",
            )}
          >
            <SidebarSvgIcon
              name={answer.is_correct ? "check" : "cross"}
              size={14}
              className={cn(
                "mt-0.5 shrink-0",
                answer.is_correct ? "text-emerald-600" : "text-amber-600",
              )}
            />
            <div className="min-w-0">
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
          className="font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 sm:w-auto"
        >
          <SidebarSvgIcon name="quiz" size={15} />
          Take quiz again
        </button>
      </div>
    </section>
  );
}
