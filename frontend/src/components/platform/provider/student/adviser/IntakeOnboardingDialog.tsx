"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { Check, Icon, X } from "@/components/icons";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import {
  INTAKE_STAGES,
  IntakeStageList,
  IntakeWizard,
} from "@/components/platform/provider/student/adviser/IntakeWizard";
import type {
  IntakeAnswers,
  QuestionnaireFlow,
} from "@/lib/integrate/provider/student/chat";

type IntakeOnboardingDialogProps = {
  open: boolean;
  patientName: string;
  flow: QuestionnaireFlow;
  step: number;
  answers: IntakeAnswers;
  isSaving?: boolean;
  isGenerating?: boolean;
  error?: string | null;
  showRecommendPrompt?: boolean;
  onClose: () => void;
  onStepChange: (step: number) => void;
  onAnswersChange: (answers: IntakeAnswers) => void;
  onComplete: () => void;
  onGenerate: () => void;
};

export function IntakeOnboardingDialog({
  open,
  patientName,
  flow,
  step,
  answers,
  isSaving = false,
  isGenerating = false,
  error = null,
  showRecommendPrompt = false,
  onClose,
  onStepChange,
  onAnswersChange,
  onComplete,
  onGenerate,
}: IntakeOnboardingDialogProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSaving && !isGenerating) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isGenerating, isSaving, onClose, open]);

  if (!open || typeof document === "undefined") return null;

  const progressPercent = Math.min(100, Math.round(((showRecommendPrompt ? 7 : step) / 7) * 100));
  const busy = isSaving || isGenerating;
  const stageIndex = showRecommendPrompt ? 7 : step;

  return createPortal(
    <div className="adviser-dialog-overlay fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-3 py-4 sm:px-4 sm:py-6 max-sm:items-end max-sm:px-0 max-sm:py-0">
      <button
        type="button"
        aria-label="Close onboarding dialog"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!busy) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Onboarding for ${patientName}`}
        className="adviser-dialog-panel relative z-10 flex max-h-[min(92svh,56rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl max-sm:h-[min(96svh,56rem)] max-sm:max-h-none max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:pb-[env(safe-area-inset-bottom)]"
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[color:var(--dash-dim)] sm:hidden" aria-hidden />

        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 md:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Patient onboarding
            </p>
            <h2 className="font-sans mt-1 truncate text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl">
              {patientName}
            </h2>
            <div className="mt-3 max-w-sm">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-brand-caption text-[color:var(--dash-muted)]">
                <span className="truncate">
                  {showRecommendPrompt
                    ? "Intake complete"
                    : `Stage ${Math.min(step + 1, 7)} of 7`}
                </span>
                <span className="shrink-0 font-semibold text-[color:var(--dash-text)]">
                  {progressPercent}%
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-[color:var(--dash-soft)]">
                <div
                  className="h-full rounded-full bg-[#DDE466] transition-[width] duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
            aria-label="Close dialog"
          >
            <Icon icon={X} size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="hidden min-h-0 overflow-y-auto border-r border-[color:var(--dash-surface-border)] p-4 lg:block">
            <p className="text-brand-caption mb-3 font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Intake progress
            </p>
            <IntakeStageList step={stageIndex} inChat={false} />
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="shrink-0 border-b border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-4 py-3 sm:px-5 lg:hidden">
              <p className="text-brand-caption mb-2 font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                Intake progress
              </p>
              <p className="text-brand-body mb-2.5 text-sm font-semibold text-[color:var(--dash-text)]">
                {showRecommendPrompt
                  ? "Recommendation"
                  : INTAKE_STAGES[Math.min(stageIndex, INTAKE_STAGES.length - 1)]}
                <span className="ml-2 font-medium text-[color:var(--dash-muted)]">
                  · {Math.min(stageIndex + 1, INTAKE_STAGES.length)}/{INTAKE_STAGES.length}
                </span>
              </p>
              <IntakeStageList step={stageIndex} inChat={false} orientation="wrap" />
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-5 md:p-6">
              {error ? (
                <div className="mb-4">
                  <AuthAlert variant="error">{error}</AuthAlert>
                </div>
              ) : null}

              {isSaving ? (
                <div className="dashboard-surface rounded-2xl p-6 text-center sm:p-8">
                  <div className="mx-auto mb-3 h-8 w-8 animate-pulse rounded-full bg-[color:var(--dash-soft)]" />
                  <p className="text-brand-body text-[color:var(--dash-faint)]">Saving intake…</p>
                </div>
              ) : null}

              {isGenerating ? (
                <div className="dashboard-surface rounded-2xl p-6 text-center sm:p-8">
                  <div className="mx-auto mb-3 h-8 w-8 animate-pulse rounded-full bg-[color:var(--dash-soft)]" />
                  <p className="text-brand-body text-[color:var(--dash-faint)]">
                    Generating recommendation…
                  </p>
                </div>
              ) : null}

              {!busy && showRecommendPrompt ? (
                <div className="dashboard-surface rounded-2xl p-4 text-center sm:p-6 md:p-8">
                  <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#DDE466]/25 text-[color:var(--dash-accent)]">
                    <Icon icon={Check} size={22} strokeWidth={1.8} />
                  </span>
                  <p className="text-brand-body mt-3 text-sm text-[color:var(--dash-muted)] sm:text-base">
                    Intake saved for{" "}
                    <span className="font-semibold text-[color:var(--dash-text)]">{patientName}</span>.
                    Generate the recommendation card to open the consultation chat.
                  </p>
                  <button
                    type="button"
                    className="font-sans mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:w-auto"
                    onClick={onGenerate}
                  >
                    Generate recommendation & open chat
                  </button>
                </div>
              ) : null}

              {!busy && !showRecommendPrompt ? (
                <IntakeWizard
                  bare
                  flow={flow}
                  step={step}
                  answers={answers}
                  onStepChange={onStepChange}
                  onAnswersChange={onAnswersChange}
                  onComplete={onComplete}
                />
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
