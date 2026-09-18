"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { authFieldClass, authLabelClass } from "@/components/platform/auth/auth-styles";
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
              : "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold leading-none",
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
        <span
          className={cn(
            "min-w-0 leading-tight",
            orientation === "wrap" ? "whitespace-nowrap" : "truncate",
          )}
        >
          {label}
        </span>
      </>
    );

    const className = cn(
      "font-sans inline-flex items-center gap-1.5 rounded-lg text-left transition",
      orientation === "vertical" && "flex w-full gap-2 px-2 py-1.5 text-sm",
      orientation === "wrap" && "min-h-9 shrink-0 px-2 py-1.5 text-xs",
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
      <ol className="flex gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:grid md:grid-cols-4 md:overflow-visible md:pb-0">
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
      <fieldset className="adviser-intake-field min-w-0 space-y-2.5">
        <legend className={authLabelClass}>Choose one answer</legend>
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
      <div className="adviser-intake-field min-w-0 space-y-3">
        <p className={authLabelClass}>Match each item</p>
        {matchingLeft.map((left) => (
          <label key={left} className="grid min-w-0 gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] sm:items-center">
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
              className="dashboard-field dashboard-field-select"
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
    <label className="adviser-intake-field grid min-w-0 gap-2">
      <span className={authLabelClass}>Your answer</span>
      <input
        type="text"
        value={typeof value === "string" ? value : ""}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Type your answer…"
        className={cn(authFieldClass, "adviser-field h-12 min-h-12 px-4", disabled && "cursor-not-allowed opacity-70")}
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

  return createPortal(
    <div className="adviser-dialog-overlay fixed inset-0 z-[130] flex items-center justify-center bg-black/45 px-3 py-4 max-sm:items-end max-sm:px-0 max-sm:pb-0 max-sm:pt-[env(safe-area-inset-top)] sm:px-4 sm:py-6">
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
        className="adviser-dialog-panel adviser-onboarding-panel relative z-10 flex max-h-[min(92svh,56rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl max-sm:h-[min(94svh,56rem)] max-sm:max-h-none max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[color:var(--dash-dim)] sm:hidden" aria-hidden />

        <div className="flex shrink-0 items-start justify-between gap-2.5 border-b border-[color:var(--dash-surface-border)] px-3.5 py-3 sm:gap-4 sm:px-5 sm:py-4 md:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Lesson quiz
            </p>
            <h2
              id={quizTitleId}
              className="font-sans mt-0.5 text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:mt-1 sm:text-xl"
            >
              {lessonTitle}
            </h2>
            <div className="mt-2.5 hidden max-w-sm sm:mt-3 sm:block">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-brand-caption text-[color:var(--dash-muted)]">
                <span className="min-w-0 truncate">
                  {inQuiz && !timedOut ? (
                    <span className="inline-flex items-center gap-1.5">
                      <SidebarSvgIcon name="clock" size={13} strokeWidth={2} />
                      {formatQuizTime(quizSecondsLeft)} remaining
                    </span>
                  ) : (
                    stageLabel
                  )}
                </span>
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
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={requestLeave}
            className="adviser-onboarding-close inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50 sm:h-12 sm:w-12"
            aria-label={phase === "confirm" || timedOut ? "Close quiz" : "Leave quiz"}
          >
            <SidebarSvgIcon name="cross" size={18} strokeWidth={2.15} className="sm:hidden" />
            <SidebarSvgIcon name="cross" size={28} strokeWidth={2.15} className="hidden sm:block" />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="hidden min-h-0 overflow-y-auto border-r border-[color:var(--dash-surface-border)] p-4 lg:block">
            <p className="text-brand-caption mb-3 font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Quiz progress
            </p>
            <QuestionStageList
              variants={variants}
              currentIndex={inQuiz ? questionIndex : -1}
              maxVisited={inQuiz ? maxVisited : -1}
              answers={answers}
              onSelect={canJumpQuestions ? goToQuestion : undefined}
            />
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="adviser-onboarding-mobile-progress shrink-0 border-b border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-3.5 py-2.5 sm:px-5 sm:py-3 lg:hidden">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-brand-body min-w-0 truncate text-sm font-semibold text-[color:var(--dash-text)]">
                  {inQuiz && !timedOut
                    ? `${formatQuizTime(quizSecondsLeft)} remaining`
                    : stageLabel}
                </p>
                <span className="text-brand-caption shrink-0 font-semibold text-[color:var(--dash-muted)]">
                  {inQuiz ? `${Math.min(questionIndex + 1, total)}/${total}` : `0/${total}`}
                  <span className="ml-1.5 text-[color:var(--dash-faint)]">· {progressPercent}%</span>
                </span>
              </div>
              <div className="mb-2.5 h-1 overflow-hidden rounded-full bg-[color:var(--dash-surface)] sm:hidden">
                <div
                  className="h-full rounded-full bg-[color:var(--dash-navy)] transition-[width] duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <QuestionStageList
                variants={variants}
                currentIndex={inQuiz ? questionIndex : -1}
                maxVisited={inQuiz ? maxVisited : -1}
                answers={answers}
                orientation="wrap"
                onSelect={canJumpQuestions ? goToQuestion : undefined}
              />
            </div>

            <div
              ref={scrollRef}
              className="adviser-onboarding-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-3.5 sm:p-5 md:p-6"
            >
              {error ? (
                <div className="mb-4">
                  <AuthAlert variant="error">{error}</AuthAlert>
                </div>
              ) : null}

              {phase === "confirm" ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                      Lesson quiz · Start here
                    </p>
                    <h3 className="font-sans mt-1 text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)] md:text-xl">
                      Do you want to continue?
                    </h3>
                    <p className="text-brand-body mt-1 text-[color:var(--dash-muted)]">
                      Start the quiz for this lesson. {total} question{total === 1 ? "" : "s"} · 5
                      minutes after the countdown.
                    </p>
                  </div>
                  <div className="text-brand-body rounded-lg border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] p-4 leading-relaxed text-[color:var(--dash-muted)]">
                    You will confirm, wait for a short countdown, then answer one question at a time.
                    Leaving before you submit will discard this attempt.
                  </div>
                  <button
                    type="button"
                    onClick={startCountdown}
                    className="dashboard-navy-btn font-sans flex min-h-12 w-full items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold text-white"
                  >
                    <SidebarSvgIcon name="check" size={16} strokeWidth={2.4} />
                    Continue
                  </button>
                </div>
              ) : null}

              {phase === "countdown" ? (
                <div className="hols-auth-card rounded-xl p-5 text-center sm:p-8">
                  <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--dash-soft)]">
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
                  <button
                    type="button"
                    onClick={requestLeave}
                    className="dashboard-pill-soft font-sans mt-5 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] sm:w-auto"
                  >
                    <SidebarSvgIcon name="previous" size={14} strokeWidth={2.2} />
                    Back to lesson
                  </button>
                </div>
              ) : null}

              {phase === "quiz" && timedOut ? (
                <div className="hols-auth-card rounded-xl p-5 text-center sm:p-8">
                  <AuthAlert variant="error">
                    Time is up. You can no longer submit this quiz attempt. Go back to the lesson and
                    try again.
                  </AuthAlert>
                  <button
                    type="button"
                    onClick={onClose}
                    className="dashboard-navy-btn font-sans mt-5 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium text-white sm:w-auto"
                  >
                    Back to lesson
                  </button>
                </div>
              ) : null}

              {phase === "quiz" && !timedOut && currentVariant ? (
                <div key={currentVariant.id} className="adviser-intake-step space-y-4">
                  <div className="adviser-intake-step-meta flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-3 py-2.5">
                    <p className="text-brand-caption text-[color:var(--dash-muted)]">
                      {currentVariant.variant_type.replaceAll("_", " ")}
                    </p>
                    <p className="font-sans text-sm font-semibold tabular-nums text-[color:var(--dash-text)]">
                      {answeredCount}/{total}
                      {currentAnswered ? (
                        <span className="ml-2 inline-flex items-center gap-1 text-[color:var(--dash-navy)]">
                          <SidebarSvgIcon name="check" size={12} strokeWidth={2.6} />
                          Ready
                        </span>
                      ) : null}
                    </p>
                  </div>

                  <div>
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                      Question {questionIndex + 1} of {total}
                    </p>
                    <h3 className="font-sans mt-1 text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)] md:text-xl">
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

                  <div className="adviser-intake-nav mt-5 flex flex-col gap-2 sm:mt-6 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-2.5">
                    {questionIndex > 0 ? (
                      <button
                        type="button"
                        onClick={handleBack}
                        disabled={busy}
                        className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] sm:w-auto"
                      >
                        <SidebarSvgIcon name="previous" size={14} strokeWidth={2.2} />
                        Back
                      </button>
                    ) : (
                      <span className="hidden sm:block" />
                    )}
                    <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:items-end">
                      {!currentAnswered ? (
                        <p className="text-brand-caption text-center text-[color:var(--dash-faint)] sm:text-right">
                          Complete this question before continuing
                        </p>
                      ) : (
                        <p className="text-brand-caption hidden text-center text-[color:var(--dash-muted)] sm:block sm:text-right">
                          {lastQuestion
                            ? "Looking good — submit when ready"
                            : "Looking good — continue when ready"}
                        </p>
                      )}
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!currentAnswered || busy || (lastQuestion && !allAnswered)}
                        className="dashboard-navy-btn font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
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
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {leaveConfirmOpen ? (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/35 px-3 py-4 max-sm:items-end max-sm:px-0 max-sm:pb-0 max-sm:pt-[env(safe-area-inset-top)] sm:px-4 sm:py-6">
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
            className="adviser-dialog-panel relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-2xl max-sm:max-h-[min(90svh,28rem)] max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:pb-[env(safe-area-inset-bottom)]"
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[color:var(--dash-dim)] sm:hidden" aria-hidden />

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
                className="adviser-onboarding-close inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)] transition sm:h-12 sm:w-12"
                aria-label="Keep taking quiz"
              >
                <SidebarSvgIcon name="cross" size={18} strokeWidth={2.15} className="sm:hidden" />
                <SidebarSvgIcon name="cross" size={28} strokeWidth={2.15} className="hidden sm:block" />
              </button>
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-5 sm:py-4 md:px-6">
              <button
                type="button"
                onClick={confirmLeave}
                className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] sm:min-h-10 sm:w-auto"
              >
                Yes, cancel quiz
              </button>
              <button
                type="button"
                onClick={() => setLeaveConfirmOpen(false)}
                className="dashboard-navy-btn font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium text-white sm:min-h-10 sm:w-auto"
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
          className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] sm:w-auto"
        >
          View all test results
        </Link>
        <button
          type="button"
          onClick={onRetake}
          className="dashboard-navy-btn font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-white sm:w-auto"
        >
          <SidebarSvgIcon name="quiz" size={15} />
          Take quiz again
        </button>
      </div>
    </section>
  );
}
