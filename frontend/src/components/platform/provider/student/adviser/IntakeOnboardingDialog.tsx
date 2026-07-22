"use client";

import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import {
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
  if (!open) return null;

  const progressPercent = Math.min(100, Math.round(((showRecommendPrompt ? 7 : step) / 7) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3 py-4 sm:px-4 sm:py-6">
      <button
        type="button"
        aria-label="Close onboarding dialog"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!isSaving && !isGenerating) onClose();
        }}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Onboarding for ${patientName}`}
        className="relative z-10 flex max-h-[min(92svh,56rem)] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-[color:var(--dash-surface-border)] bg-[color:var(--portal-page-bg)] shadow-2xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[color:var(--dash-surface-border)] px-5 py-4 md:px-6">
          <div className="min-w-0">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Patient onboarding
            </p>
            <h2 className="font-sans mt-1 truncate text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)]">
              {patientName}
            </h2>
            <div className="mt-3 max-w-sm">
              <div className="mb-1.5 flex items-center justify-between gap-3 text-brand-caption text-[color:var(--dash-muted)]">
                <span>
                  {showRecommendPrompt
                    ? "Intake complete"
                    : `Stage ${Math.min(step + 1, 7)} of 7`}
                </span>
                <span className="font-semibold text-[color:var(--dash-text)]">{progressPercent}%</span>
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
            disabled={isSaving || isGenerating}
            onClick={onClose}
            className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
            aria-label="Close dialog"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid min-h-0 flex-1 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="hidden overflow-y-auto border-b border-[color:var(--dash-surface-border)] p-4 lg:block lg:border-b-0 lg:border-r">
            <p className="text-brand-caption mb-3 font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Intake progress
            </p>
            <IntakeStageList step={showRecommendPrompt ? 7 : step} inChat={false} />
          </aside>

          <div className="min-h-0 overflow-y-auto p-4 md:p-5">
            {error ? (
              <div className="mb-4">
                <AuthAlert variant="error">{error}</AuthAlert>
              </div>
            ) : null}

            <div className="mb-4 lg:hidden">
              <IntakeStageList step={showRecommendPrompt ? 7 : step} inChat={false} />
            </div>

            {isSaving ? (
              <div className="dashboard-surface rounded-2xl p-8 text-center">
                <p className="text-brand-body text-[color:var(--dash-faint)]">Saving intake…</p>
              </div>
            ) : null}

            {isGenerating ? (
              <div className="dashboard-surface rounded-2xl p-8 text-center">
                <p className="text-brand-body text-[color:var(--dash-faint)]">
                  Generating recommendation…
                </p>
              </div>
            ) : null}

            {!isSaving && !isGenerating && showRecommendPrompt ? (
              <div className="dashboard-surface rounded-2xl p-6 text-center md:p-8">
                <p className="text-brand-body text-[color:var(--dash-muted)]">
                  Intake saved for{" "}
                  <span className="font-semibold text-[color:var(--dash-text)]">{patientName}</span>.
                  Generate the recommendation card to open the consultation chat.
                </p>
                <button
                  type="button"
                  className="font-sans mt-4 inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105"
                  onClick={onGenerate}
                >
                  Generate recommendation & open chat
                </button>
              </div>
            ) : null}

            {!isSaving && !isGenerating && !showRecommendPrompt ? (
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
  );
}
