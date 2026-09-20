"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import {
  INTAKE_STAGES,
  IntakeStageList,
  IntakeWizard,
} from "@/components/platform/provider/student/adviser/IntakeWizard";
import { MembershipLockedButton } from "@/components/platform/provider/student/membership/MembershipGate";
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
  accessLocked?: boolean;
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
  accessLocked = false,
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
    <div className="adviser-dialog-overlay adviser-dialog-overlay--center fixed inset-0 z-[80] flex min-h-dvh items-center justify-center bg-black/45 px-[max(0.75rem,env(safe-area-inset-left))] py-[max(1rem,env(safe-area-inset-top),env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-4 sm:py-6">
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
        className="adviser-dialog-panel adviser-dialog-panel--center adviser-onboarding-panel relative z-10 flex max-h-[min(88svh,52rem)] w-full max-w-lg min-w-0 flex-col overflow-hidden rounded-2xl sm:max-w-xl lg:max-w-5xl"
      >
        <div className="flex shrink-0 items-start justify-between gap-2.5 border-b border-[color:var(--dash-surface-border)] px-3.5 py-3 sm:gap-4 sm:px-5 sm:py-4 md:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Patient onboarding
            </p>
            <h2 className="font-sans mt-0.5 truncate text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:mt-1 sm:text-xl">
              {patientName}
            </h2>
            <div className="mt-2.5 hidden max-w-sm sm:mt-3 sm:block">
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
                  className="h-full rounded-full bg-[color:var(--dash-navy)] transition-[width] duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            className="adviser-onboarding-close inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50 sm:h-12 sm:w-12"
            aria-label="Close patient onboarding"
          >
            <SidebarSvgIcon name="cross" size={24} strokeWidth={2.2} className="sm:hidden" />
            <SidebarSvgIcon name="cross" size={28} strokeWidth={2.15} className="hidden sm:block" />
          </button>
        </div>

        <div className="grid min-h-0 min-w-0 flex-1 lg:grid-cols-[15rem_minmax(0,1fr)]">
          <aside className="hidden min-h-0 overflow-y-auto border-r border-[color:var(--dash-surface-border)] p-4 lg:block">
            <p className="text-brand-caption mb-3 font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Intake progress
            </p>
            <IntakeStageList
              step={stageIndex}
              inChat={false}
              onStepSelect={
                showRecommendPrompt || busy
                  ? undefined
                  : (index) => {
                      if (index <= step) onStepChange(index);
                    }
              }
            />
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col">
            <div className="adviser-onboarding-mobile-progress min-w-0 shrink-0 border-b border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)] px-3.5 py-2.5 sm:px-5 sm:py-3 lg:hidden">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-brand-body min-w-0 truncate text-sm font-semibold text-[color:var(--dash-text)]">
                  {showRecommendPrompt
                    ? "Recommendation"
                    : INTAKE_STAGES[Math.min(stageIndex, INTAKE_STAGES.length - 1)]}
                </p>
                <span className="text-brand-caption shrink-0 font-semibold text-[color:var(--dash-muted)]">
                  {Math.min(stageIndex + 1, INTAKE_STAGES.length)}/{INTAKE_STAGES.length}
                  <span className="ml-1.5 text-[color:var(--dash-faint)]">· {progressPercent}%</span>
                </span>
              </div>
              <div className="mb-2.5 h-1 overflow-hidden rounded-full bg-[color:var(--dash-surface)] sm:hidden">
                <div
                  className="h-full rounded-full bg-[color:var(--dash-navy)] transition-[width] duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <IntakeStageList
                step={stageIndex}
                inChat={false}
                orientation="wrap"
                onStepSelect={
                  showRecommendPrompt || busy
                    ? undefined
                    : (index) => {
                        if (index <= step) onStepChange(index);
                      }
                }
              />
            </div>

            {error ? (
              <div className="shrink-0 px-3.5 pt-3 sm:px-5 sm:pt-4 md:px-6">
                <AuthAlert variant="error">{error}</AuthAlert>
              </div>
            ) : null}

            {isSaving || isGenerating || showRecommendPrompt ? (
              <div className="adviser-onboarding-scroll min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain px-3.5 py-3.5 sm:p-5 md:p-6">
                {isSaving ? (
                  <div className="hols-auth-card rounded-xl p-5 text-center sm:p-8">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--dash-soft)]">
                      <SidebarSvgIcon name="spinner" size={18} strokeWidth={2} className="animate-spin" />
                    </div>
                    <p className="text-brand-body text-[color:var(--dash-faint)]">Saving intake…</p>
                  </div>
                ) : null}

                {isGenerating ? (
                  <div className="hols-auth-card rounded-xl p-5 text-center sm:p-8">
                    <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-[color:var(--dash-soft)]">
                      <SidebarSvgIcon name="spinner" size={18} strokeWidth={2} className="animate-spin" />
                    </div>
                    <p className="text-brand-body text-[color:var(--dash-faint)]">
                      Generating recommendation…
                    </p>
                  </div>
                ) : null}

                {!busy && showRecommendPrompt ? (
                  <div className="hols-auth-card rounded-xl p-4 text-center sm:p-6 md:p-8">
                    <span className="membership-plan-icon mx-auto !h-12 !w-12" aria-hidden>
                      <SidebarSvgIcon name="check" size={22} strokeWidth={2} />
                    </span>
                    <p className="text-brand-body mt-3 text-sm text-[color:var(--dash-muted)] sm:text-base">
                      Intake saved for{" "}
                      <span className="font-semibold text-[color:var(--dash-text)]">{patientName}</span>.
                      {accessLocked
                        ? " An active membership is required to generate a recommendation and open consultation chat."
                        : " Generate the recommendation card to open the consultation chat."}
                    </p>
                    {accessLocked ? (
                      <MembershipLockedButton className="mt-4 w-full sm:w-auto">
                        Unlock to generate
                      </MembershipLockedButton>
                    ) : (
                      <button
                        type="button"
                        className="dashboard-navy-btn font-sans mt-4 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium text-white sm:min-h-10 sm:w-auto"
                        onClick={onGenerate}
                      >
                        <SidebarSvgIcon name="adviser" size={15} strokeWidth={1.9} />
                        <span className="sm:hidden">Generate & open chat</span>
                        <span className="hidden sm:inline">Generate recommendation & open chat</span>
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="flex min-h-0 min-w-0 flex-1 flex-col px-3.5 pb-3.5 pt-3 sm:px-5 sm:pb-5 sm:pt-4 md:px-6 md:pb-6">
                <IntakeWizard
                  bare
                  flow={flow}
                  step={step}
                  answers={answers}
                  onStepChange={onStepChange}
                  onAnswersChange={onAnswersChange}
                  onComplete={onComplete}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
