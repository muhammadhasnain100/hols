"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
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

function formatAnswer(value: unknown) {
  if (value === null || value === undefined) return "—";
  if (typeof value === "object") {
    return Object.entries(value as Record<string, unknown>)
      .map(([key, entry]) => `${key} → ${String(entry)}`)
      .join(", ");
  }
  return String(value);
}

function variantQuestion(variant: LessonVariant) {
  const content = variant.content ?? {};
  return typeof content.question === "string" ? content.question : "Question";
}

function isVariantAnswered(variant: LessonVariant, value: unknown) {
  if (variant.variant_type === "matching") {
    const leftItems = Array.isArray(variant.content?.matchingLeft)
      ? variant.content.matchingLeft.map(String)
      : [];
    if (!value || typeof value !== "object") return false;
    return leftItems.every((left) => Boolean((value as Record<string, string>)[left]));
  }
  return value !== undefined && value !== null && String(value).trim() !== "";
}

function OptionCheck({ checked }: { checked: boolean }) {
  return (
    <span
      className={cn(
        "quiz-option-check flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition",
        checked
          ? "border-[color:var(--dash-navy)] bg-[color:var(--dash-navy)] text-white"
          : "border-[color:var(--dash-dim)] bg-transparent text-transparent",
      )}
      aria-hidden
    >
      <SidebarSvgIcon name="check" size={11} strokeWidth={2.8} />
    </span>
  );
}

const choiceCardClass = (checked: boolean) =>
  cn(
    "quiz-option-card adviser-option-card adviser-choice-card text-brand-body flex min-h-12 min-w-0 items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition active:scale-[0.99]",
    checked
      ? "is-selected"
      : "border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)] hols-option-hover",
  );

type LessonQuizOverlayProps = {
  open: boolean;
  courseId: string;
  lessonId: string;
  lessonTitle: string;
  variants: LessonVariant[];
  onClose: () => void;
  onSubmitted: (result: LessonQuizResult) => void;
};

function QuestionStageList({
  variants,
  currentIndex,
  maxVisited,
  answers,
  orientation = "vertical",
  onSelect,
}: {
  variants: LessonVariant[];
  currentIndex: number;
  maxVisited: number;
  answers: Record<string, unknown>;
  orientation?: "vertical" | "wrap";
  onSelect?: (index: number) => void;
}) {
  const renderItem = (variant: LessonVariant, index: number) => {
    const active = index === currentIndex;
    const done = isVariantAnswered(variant, answers[variant.id]);
    const canJump = Boolean(onSelect) && index <= maxVisited;
    const label = orientation === "wrap" ? `Q${index + 1}` : variantQuestion(variant);

    const content = (
      <>
        <span
          className={cn(
            orientation === "vertical"
              ? "text-brand-caption flex h-5 w-5 shrink-0 items-center justify-center rounded-md font-semibold"
              : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold leading-none",
            active && "bg-[color:var(--dash-navy)] text-white",
            !active &&
              done &&
              (orientation === "vertical"
                ? "border border-[color:var(--dash-surface-border)] text-[color:var(--dash-text)]"
                : "bg-[color:var(--dash-soft)] text-[color:var(--dash-text)]"),
            !active &&
              !done &&
              (orientation === "vertical"
                ? "bg-[color:var(--dash-soft)] text-[color:var(--dash-faint)]"
                : "bg-[color:var(--dash-surface)] text-[color:var(--dash-faint)]"),
          )}
        >
          {done && !active ? (
            <SidebarSvgIcon name="check" size={orientation === "vertical" ? 12 : 10} strokeWidth={2.7} />
          ) : (
            index + 1
          )}
        </span>
        {orientation === "vertical" ? (
          <span className="min-w-0 truncate leading-tight">{label}</span>
        ) : null}
      </>
    );

    const className = cn(
      "font-sans inline-flex items-center gap-1.5 rounded-lg text-left transition",
      orientation === "vertical" && "flex w-full gap-2 px-2 py-1.5 text-sm",
      orientation === "wrap" && "min-h-11 w-full justify-center px-1 text-xs",
      active && "bg-[color:var(--dash-soft)] font-semibold text-[color:var(--dash-text)] ring-1 ring-[color:var(--dash-surface-border)]",
      !active && done && "bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)]",
      !active && !done && "bg-[color:var(--dash-soft)] text-[color:var(--dash-faint)]",
      canJump && "cursor-pointer hover:bg-[color:var(--dash-soft)]",
      !canJump && orientation === "vertical" && !active && !done && "opacity-70",
    );

    if (canJump) {
      return (
        <li key={variant.id} title={variantQuestion(variant)}>
          <button type="button" onClick={() => onSelect?.(index)} className={className}>
            {content}
          </button>
        </li>
      );
    }

    return (
      <li key={variant.id} title={variantQuestion(variant)} className={className}>
        {content}
      </li>
    );
  };

  if (orientation === "wrap") {
    return (
      <ol
        className="grid gap-1.5"
        style={{ gridTemplateColumns: `repeat(${Math.min(variants.length, 5)}, minmax(0, 1fr))` }}
      >
        {variants.map((variant, index) => renderItem(variant, index))}
      </ol>
    );
  }

  return <ol className="space-y-1">{variants.map((variant, index) => renderItem(variant, index))}</ol>;
}

function QuizQuestion({
  variant,
  disabled,
  value,
  onChange,
}: {
  variant: LessonVariant;
  disabled: boolean;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const content = variant.content ?? {};
  const options = Array.isArray(content.options) ? content.options.map(String) : null;
  const matchingLeft = Array.isArray(content.matchingLeft) ? content.matchingLeft.map(String) : null;
  const matchingOptions = Array.isArray(content.matchingOptions)
    ? content.matchingOptions.map(String)
    : null;

  if (options) {
    return (
      <fieldset className="min-w-0 space-y-2.5">
        <legend className="dashboard-field-label">Choose one answer</legend>
        <div className={cn("grid min-w-0 gap-2", options.length <= 3 ? "grid-cols-1" : "grid-cols-1")}>
          {options.map((option) => {
            const checked = value === option;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={checked}
                disabled={disabled}
                onClick={() => onChange(option)}
                className={choiceCardClass(checked)}
              >
                <OptionCheck checked={checked} />
                <span
                  className={cn(
                    "min-w-0 flex-1 break-words leading-snug",
                    checked && "font-semibold text-[color:var(--dash-text)]",
                  )}
                >
                  {option}
                </span>
              </button>
            );
          })}
        </div>
      </fieldset>
    );
  }

  if (matchingLeft && matchingOptions) {
    const current = typeof value === "object" && value ? (value as Record<string, string>) : {};
    return (
      <div className="min-w-0 space-y-3">
        <p className="dashboard-field-label">Match each item</p>
        {matchingLeft.map((left) => (
          <label key={left} className="grid min-w-0 gap-1.5">
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
              className="dashboard-field dashboard-field-select min-h-11 w-full min-w-0"
            >
              <option value="">Select match</option>
              {matchingOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        ))}
      </div>
    );
  }

  return (
    <label className="grid min-w-0 gap-2">
      <span className="dashboard-field-label">Your answer</span>
      <input
        type="text"
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type your answer…"
        className={cn("dashboard-field min-h-11", disabled && "cursor-not-allowed opacity-70")}
      />
    </label>
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
  const quizTitleId = useId();
  const leaveTitleId = useId();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"confirm" | "countdown" | "quiz">("confirm");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [maxVisited, setMaxVisited] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(PRESTART_SECONDS);
  const [quizSecondsLeft, setQuizSecondsLeft] = useState(QUIZ_DURATION_SECONDS);
  const [timedOut, setTimedOut] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leaveConfirmOpen, setLeaveConfirmOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  const total = variants.length;
  const currentVariant = variants[questionIndex] ?? variants[0];
  const currentAnswered = currentVariant
    ? isVariantAnswered(currentVariant, answers[currentVariant.id])
    : false;
  const answeredCount = useMemo(
    () => variants.filter((variant) => isVariantAnswered(variant, answers[variant.id])).length,
    [answers, variants],
  );
  const allAnswered = answeredCount === total && total > 0;
  const lastQuestion = questionIndex >= total - 1;
  const busy = submitting;
  const inQuiz = phase === "quiz";

  const progressPercent = useMemo(() => {
    if (timedOut) return 100;
    if (phase === "confirm" || phase === "countdown" || total === 0) return 0;
    return Math.min(100, Math.round(((questionIndex + 1) / total) * 100));
  }, [phase, questionIndex, timedOut, total]);

  const stageLabel =
    phase === "confirm"
      ? "Ready to start"
      : phase === "countdown"
        ? "Get ready"
        : timedOut
          ? "Time up"
          : `Question ${Math.min(questionIndex + 1, Math.max(total, 1))} of ${total}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setPhase("confirm");
    setQuestionIndex(0);
    setMaxVisited(0);
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
    scrollRef.current?.scrollTo({ top: 0 });
  }, [phase, questionIndex]);

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

  function goToQuestion(index: number) {
    if (timedOut || submitting) return;
    if (index < 0 || index >= total) return;
    if (index > maxVisited) return;
    setQuestionIndex(index);
    setError(null);
  }

  function handleBack() {
    if (questionIndex > 0) goToQuestion(questionIndex - 1);
  }

  function handleNext() {
    if (!currentAnswered || timedOut) return;
    if (!lastQuestion) {
      const next = questionIndex + 1;
      setMaxVisited((current) => Math.max(current, next));
      setQuestionIndex(next);
      setError(null);
      return;
    }
    void handleSubmit();
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

  async function handleSubmit() {
    if (timedOut || !allAnswered) return;

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

  const countdownLabel = secondsLeft > 0 ? String(secondsLeft) : "Go!";
  const canJumpQuestions = inQuiz && !timedOut && !busy;
  const heading =
    phase === "confirm"
      ? "Do you want to continue?"
      : phase === "countdown"
        ? "Get ready"
        : timedOut
          ? "Time is up"
          : `Question ${Math.min(questionIndex + 1, Math.max(total, 1))} of ${total}`;
  const description =
    phase === "confirm"
      ? `${total} question${total === 1 ? "" : "s"} · 5 minutes after the countdown.`
      : phase === "countdown"
        ? "The quiz starts after this short countdown."
        : timedOut
          ? "This attempt is closed. You can start again from the lesson."
          : `${formatQuizTime(quizSecondsLeft)} remaining`;

  const footerButtonClass =
    "font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium sm:min-h-10 sm:w-auto";

  return createPortal(
    <div className="adviser-dialog-overlay adviser-dialog-overlay--center fixed inset-0 z-[130] flex min-h-dvh items-center justify-center bg-black/45 px-[max(0.75rem,env(safe-area-inset-left))] py-[max(1rem,env(safe-area-inset-top),env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-4 sm:py-6">
      <button
        type="button"
        aria-label="Close quiz"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!busy) requestLeave();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={quizTitleId}
        className="adviser-dialog-panel adviser-dialog-panel--center relative z-10 flex max-h-[min(88svh,40rem)] w-full max-w-lg min-w-0 flex-col overflow-hidden rounded-2xl sm:max-w-xl lg:max-h-[min(88svh,48rem)] lg:max-w-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 md:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Lesson quiz
            </p>
            <h2
              id={quizTitleId}
              className="font-sans mt-1 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl"
            >
              {heading}
            </h2>
            <p className="text-brand-body mt-1 text-sm text-[color:var(--dash-muted)] sm:text-base">
              {description}
            </p>
            {phase === "confirm" && lessonTitle ? (
              <p
                title={lessonTitle}
                className="text-brand-caption mt-1 line-clamp-2 break-words text-[color:var(--dash-faint)]"
              >
                {lessonTitle}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={requestLeave}
            className="adviser-onboarding-close inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50 sm:h-12 sm:w-12"
            aria-label={phase === "confirm" || timedOut ? "Close quiz" : "Leave quiz"}
          >
            <SidebarSvgIcon name="cross" size={24} strokeWidth={2.2} className="sm:hidden" />
            <SidebarSvgIcon name="cross" size={28} strokeWidth={2.15} className="hidden sm:block" />
          </button>
        </div>

        {inQuiz && !timedOut ? (
          <div className="hidden shrink-0 px-4 pt-3 sm:block sm:px-5 md:px-6">
            <div className="mb-1.5 flex items-center justify-between gap-3 text-brand-caption text-[color:var(--dash-muted)]">
              <span className="min-w-0 truncate">{stageLabel}</span>
              <span className="shrink-0 font-semibold text-[color:var(--dash-text)]">
                {progressPercent}%
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--dash-soft)]">
              <div
                className="h-full rounded-full bg-[color:var(--dash-navy)] transition-[width] duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}

        <div
          ref={scrollRef}
          className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5 md:px-6"
        >
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          {phase === "confirm" ? (
            <div className="space-y-3 rounded-xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] p-4">
              <p className="text-brand-body leading-relaxed text-[color:var(--dash-muted)]">
                You will confirm, wait for a short countdown, then answer one question at a time.
                Leaving before you submit will discard this attempt.
              </p>
            </div>
          ) : null}

          {phase === "countdown" ? (
            <div className="flex flex-col items-center justify-center px-2 py-6 text-center sm:py-8">
              <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-lg bg-[color:var(--dash-soft)]">
                <SidebarSvgIcon
                  name={secondsLeft > 0 ? "clock" : "focus"}
                  size={18}
                  strokeWidth={2}
                />
              </div>
              <p
                className="font-sans text-6xl font-bold tabular-nums leading-none tracking-tight text-[color:var(--dash-text)] sm:text-7xl"
                aria-live="polite"
              >
                {countdownLabel}
              </p>
              <p className="text-brand-body mt-4 text-[color:var(--dash-faint)]">
                Focus up — your lesson quiz is about to begin.
              </p>
            </div>
          ) : null}

          {phase === "quiz" && timedOut ? (
            <AuthAlert variant="error">
              Time is up. You can no longer submit this quiz attempt. Go back to the lesson and try
              again.
            </AuthAlert>
          ) : null}

          {phase === "quiz" && !timedOut && currentVariant ? (
            <div key={currentVariant.id} className="space-y-4">
              {total > 1 ? (
                <QuestionStageList
                  variants={variants}
                  currentIndex={questionIndex}
                  maxVisited={maxVisited}
                  answers={answers}
                  orientation="wrap"
                  onSelect={canJumpQuestions ? goToQuestion : undefined}
                />
              ) : null}

              <div>
                <p className="dashboard-field-label">
                  {currentVariant.variant_type.replaceAll("_", " ")}
                  {currentAnswered ? " · Ready" : ""}
                </p>
                <h3 className="font-sans mt-1 break-words text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                  {variantQuestion(currentVariant)}
                </h3>
              </div>

              <QuizQuestion
                variant={currentVariant}
                disabled={busy}
                value={answers[currentVariant.id]}
                onChange={(value) =>
                  setAnswers((current) => ({
                    ...current,
                    [currentVariant.id]: value,
                  }))
                }
              />

              {!currentAnswered ? (
                <p className="text-brand-caption text-[color:var(--dash-faint)]">
                  Complete this question before continuing
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-5 sm:py-4 md:px-6">
          {phase === "confirm" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className={cn("dashboard-pill-soft text-[color:var(--dash-text)]", footerButtonClass)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={startCountdown}
                className={cn("dashboard-navy-btn font-semibold text-white", footerButtonClass)}
              >
                Continue
                <SidebarSvgIcon name="next" size={14} strokeWidth={2.2} />
              </button>
            </>
          ) : null}

          {phase === "countdown" || timedOut ? (
            <button
              type="button"
              onClick={timedOut ? onClose : requestLeave}
              className={cn(
                timedOut
                  ? "dashboard-navy-btn font-semibold text-white"
                  : "dashboard-pill-soft text-[color:var(--dash-text)]",
                footerButtonClass,
              )}
            >
              <SidebarSvgIcon name="previous" size={14} strokeWidth={2.2} />
              Back to lesson
            </button>
          ) : null}

          {inQuiz && !timedOut ? (
            <>
              {questionIndex > 0 ? (
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={busy}
                  className={cn(
                    "dashboard-pill-soft text-[color:var(--dash-text)] disabled:pointer-events-none disabled:opacity-50",
                    footerButtonClass,
                  )}
                >
                  <SidebarSvgIcon name="previous" size={14} strokeWidth={2.2} />
                  Back
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleNext}
                disabled={!currentAnswered || busy || (lastQuestion && !allAnswered)}
                className={cn(
                  "dashboard-navy-btn font-semibold text-white disabled:pointer-events-none disabled:opacity-45",
                  footerButtonClass,
                )}
              >
                {submitting ? (
                  <>
                    <SidebarSvgIcon name="spinner" size={16} className="animate-spin" />
                    Submitting…
                  </>
                ) : lastQuestion ? (
                  <>
                    <SidebarSvgIcon name="check" size={14} strokeWidth={2.2} />
                    Submit quiz
                  </>
                ) : (
                  <>
                    Continue
                    <SidebarSvgIcon name="next" size={14} strokeWidth={2.2} />
                  </>
                )}
              </button>
            </>
          ) : null}
        </div>
      </div>

      {leaveConfirmOpen ? (
        <div className="adviser-dialog-overlay adviser-dialog-overlay--center absolute inset-0 z-20 flex items-center justify-center bg-black/35 px-[max(0.75rem,env(safe-area-inset-left))] py-[max(1rem,env(safe-area-inset-top),env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-4 sm:py-6">
          <button
            type="button"
            aria-label="Dismiss leave dialog"
            className="absolute inset-0 cursor-default"
            onClick={() => setLeaveConfirmOpen(false)}
          />
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={leaveTitleId}
            className="adviser-dialog-panel adviser-dialog-panel--center relative z-10 flex max-h-[min(88svh,28rem)] w-full max-w-md min-w-0 flex-col overflow-hidden rounded-2xl"
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 md:px-6">
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
              <button
                type="button"
                onClick={() => setLeaveConfirmOpen(false)}
                className="adviser-onboarding-close inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)] transition sm:h-12 sm:w-12"
                aria-label="Keep taking quiz"
              >
                <SidebarSvgIcon name="cross" size={24} strokeWidth={2.2} className="sm:hidden" />
                <SidebarSvgIcon name="cross" size={28} strokeWidth={2.15} className="hidden sm:block" />
              </button>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-5 sm:py-4 md:px-6">
              <button
                type="button"
                onClick={confirmLeave}
                className={cn("dashboard-pill-soft text-[color:var(--dash-text)]", footerButtonClass)}
              >
                Yes, cancel quiz
              </button>
              <button
                type="button"
                onClick={() => setLeaveConfirmOpen(false)}
                className={cn("dashboard-navy-btn font-semibold text-white", footerButtonClass)}
              >
                Keep taking quiz
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
    <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5 md:p-6">
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
        <span className="dashboard-pill-soft text-brand-caption inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold text-[color:var(--dash-text)]">
          <SidebarSvgIcon name={result.passed ? "check" : "quiz"} size={13} />
          {result.passed ? "Passed" : "Needs review"}
        </span>
      </div>

      <div className="mt-4 space-y-2">
        {result.answers.map((answer) => (
          <div
            key={answer.variant_id}
            className="text-brand-body hols-option-hover flex items-start gap-2 rounded-xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-3.5 py-3"
          >
            <span className="dashboard-tool-icon mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg">
              <SidebarSvgIcon name={answer.is_correct ? "check" : "cross"} size={14} />
            </span>
            <div className="min-w-0">
              <span className="font-medium text-[color:var(--dash-text)]">{answer.question ?? "Question"}</span>
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
        <Link
          href={`/student/lectures/${courseId}/test-result`}
          className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] sm:min-h-10 sm:w-auto"
        >
          View all test results
        </Link>
        <button
          type="button"
          onClick={onRetake}
          className="dashboard-navy-btn font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-white sm:min-h-10 sm:w-auto"
        >
          <SidebarSvgIcon name="quiz" size={15} />
          Take quiz again
        </button>
      </div>
    </section>
  );
}
