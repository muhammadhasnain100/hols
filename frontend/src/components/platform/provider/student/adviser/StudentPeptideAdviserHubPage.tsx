"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { AdviserPageLayout } from "@/components/platform/provider/student/adviser/AdviserPageLayout";
import { CreatePatientDialog } from "@/components/platform/provider/student/adviser/CreatePatientDialog";
import { IntakeOnboardingDialog } from "@/components/platform/provider/student/adviser/IntakeOnboardingDialog";
import { INTAKE_STAGES } from "@/components/platform/provider/student/adviser/IntakeWizard";
import { PatientListPanel } from "@/components/platform/provider/student/adviser/PatientListPanel";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  ACTIVE_PATIENT_STORAGE_KEY,
  createPatient,
  getAdviserBootstrap,
  getCachedAdviserBootstrap,
  getChatHealth,
  getPatient,
  listPatients,
  recommendPatient,
  savePatientIntake,
  type ChatInfo,
  type IntakeAnswers,
  type PatientDetail,
  type PatientSummary,
  type QuestionnaireFlow,
} from "@/lib/integrate/provider/student/chat";

function hasValue(value: unknown) {
  if (Array.isArray(value)) return value.length > 0;
  return value !== "" && value != null;
}

/** Infer the current intake stage from saved answers. */
export function resolveStep(patient: PatientDetail): number {
  if (patient.recommendation || patient.evaluation) return 7;

  const answers = patient.intake_answers || {};
  if (!answers.consent) return 0;
  if (
    !["age", "sex", "pregnancy", "height_cm", "weight_kg", "activity"].every((key) =>
      hasValue(answers[key]),
    )
  ) {
    return 1;
  }
  if (
    !["cancer", "mtc_men2", "peptide_allergy", "medications"].every((key) => hasValue(answers[key])) ||
    !hasValue(answers.conditions)
  ) {
    return 2;
  }
  if (!hasValue(answers.primary_goal)) return 3;
  // Branch step is complete once any branch-related progress or history fields exist,
  // or if preferences already started — otherwise stay on deep dive.
  if (
    !["injection_tolerance", "complexity", "timeline"].some((key) => hasValue(answers[key])) &&
    !hasValue(answers.prior_peptides) &&
    !hasValue(answers.labs)
  ) {
    return 4;
  }
  if (!["injection_tolerance", "complexity", "timeline"].every((key) => hasValue(answers[key]))) {
    // If preferences incomplete, they may still be on history (5) or preferences (6)
    if (!hasValue(answers.prior_peptides) && !hasValue(answers.labs) && !hasValue(answers.injection_tolerance)) {
      return 5;
    }
    return 6;
  }
  return 7;
}

function progressLabel(patient: PatientSummary, answersStep?: number) {
  if (patient.has_recommendation) {
    return `${patient.message_count} messages · Open chat`;
  }
  if (patient.status === "draft") {
    const step = answersStep ?? 0;
    const stage = INTAKE_STAGES[Math.min(step, INTAKE_STAGES.length - 1)];
    return `Onboarding · ${stage}`;
  }
  return patient.primary_goal || "Draft intake";
}

function chatRouteForPatient(patientId: string) {
  return `/student/adviser/chat/${patientId}`;
}

export function StudentPeptideAdviserHubPage() {
  const router = useRouter();
  const [flow, setFlow] = useState<QuestionnaireFlow | null>(null);
  const [info, setInfo] = useState<ChatInfo | null>(null);
  const [vectors, setVectors] = useState<number | null>(null);
  const [patients, setPatients] = useState<PatientSummary[]>([]);
  const [activePatient, setActivePatient] = useState<PatientDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [isSavingIntake, setIsSavingIntake] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createDialogError, setCreateDialogError] = useState<string | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const refreshPatients = useCallback(async () => {
    const result = await listPatients();
    setPatients(result.patients);
    return result.patients;
  }, []);

  const routeToChat = useCallback(
    (patientId: string) => {
      window.sessionStorage.setItem(ACTIVE_PATIENT_STORAGE_KEY, patientId);
      router.push(chatRouteForPatient(patientId));
    },
    [router],
  );

  const openOnboarding = useCallback((patient: PatientDetail) => {
    setActivePatient(patient);
    setStep(resolveStep(patient));
    setOnboardingOpen(true);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const storedPatientId = window.sessionStorage.getItem(ACTIVE_PATIENT_STORAGE_KEY);
        const cached = getCachedAdviserBootstrap(storedPatientId ?? undefined);
        if (cached && !cancelled) {
          setInfo(cached.info);
          setFlow(cached.flow);
          setPatients(cached.patients);
          if (cached.active_patient && !cached.active_patient.recommendation) {
            openOnboarding(cached.active_patient);
          }
        }

        const payload = await getAdviserBootstrap(storedPatientId ?? undefined);
        if (cancelled) return;

        setInfo(payload.info);
        setFlow(payload.flow);
        setPatients(payload.patients);

        if (payload.active_patient && !payload.active_patient.recommendation) {
          if (payload.active_patient_id) {
            window.sessionStorage.setItem(ACTIVE_PATIENT_STORAGE_KEY, payload.active_patient_id);
          }
          openOnboarding(payload.active_patient);
        }
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiRequestError
            ? err.message
            : "Could not connect to the peptide adviser service.",
        );
      }
    }

    void bootstrap();

    void getChatHealth()
      .then((health) => {
        if (!cancelled) setVectors(health.vectors);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [openOnboarding]);

  const selectPatient = useCallback(
    async (patientId: string) => {
      setActionError(null);
      const summary = patients.find((patient) => patient.patient_id === patientId);
      if (summary?.has_recommendation) {
        routeToChat(patientId);
        return;
      }

      window.sessionStorage.setItem(ACTIVE_PATIENT_STORAGE_KEY, patientId);
      try {
        const patient = await getPatient(patientId);
        openOnboarding(patient);
      } catch (err) {
        setActionError(err instanceof ApiRequestError ? err.message : "Could not load patient.");
      }
    },
    [openOnboarding, patients, routeToChat],
  );

  const handleCreatePatient = useCallback(
    async (displayName: string) => {
      setCreateDialogError(null);
      setActionError(null);
      setIsCreating(true);
      try {
        const patient = await createPatient(displayName);
        window.sessionStorage.setItem(ACTIVE_PATIENT_STORAGE_KEY, patient.patient_id);
        await refreshPatients();
        setCreateDialogOpen(false);
        openOnboarding(patient);
      } catch (err) {
        const message =
          err instanceof ApiRequestError ? err.message : "Could not create patient.";
        setCreateDialogError(message);
        setActionError(message);
      } finally {
        setIsCreating(false);
      }
    },
    [openOnboarding, refreshPatients],
  );

  const openCreateDialog = useCallback(() => {
    setCreateDialogError(null);
    setOnboardingOpen(false);
    setCreateDialogOpen(true);
  }, []);

  const handleIntakeComplete = useCallback(async () => {
    if (!activePatient) return;

    setActionError(null);
    setIsSavingIntake(true);
    try {
      const updated = await savePatientIntake(activePatient.patient_id, {
        answers: activePatient.intake_answers,
        display_name: activePatient.display_name,
      });
      setActivePatient(updated);
      await refreshPatients();
      setStep(7);
    } catch (err) {
      setActionError(err instanceof ApiRequestError ? err.message : "Could not save intake.");
    } finally {
      setIsSavingIntake(false);
    }
  }, [activePatient, refreshPatients]);

  const handleGenerateRecommendation = useCallback(async () => {
    if (!activePatient) return;

    setActionError(null);
    setIsGenerating(true);
    try {
      await recommendPatient(activePatient.patient_id);
      await refreshPatients();
      setOnboardingOpen(false);
      routeToChat(activePatient.patient_id);
    } catch (err) {
      setActionError(
        err instanceof ApiRequestError ? err.message : "Could not generate recommendation.",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [activePatient, refreshPatients, routeToChat]);

  const showRecommendPrompt =
    Boolean(activePatient) &&
    !activePatient?.recommendation &&
    step >= 7 &&
    !isSavingIntake &&
    !isGenerating;

  const closeOnboarding = useCallback(() => {
    if (isSavingIntake || isGenerating) return;
    setOnboardingOpen(false);
  }, [isGenerating, isSavingIntake]);

  return (
    <AdviserPageLayout>
      <CreatePatientDialog
        open={createDialogOpen}
        defaultName={`Patient ${patients.length + 1}`}
        isSubmitting={isCreating}
        error={createDialogError}
        onClose={() => {
          if (!isCreating) setCreateDialogOpen(false);
        }}
        onSubmit={(displayName) => void handleCreatePatient(displayName)}
      />

      {flow && activePatient && onboardingOpen ? (
        <IntakeOnboardingDialog
          open={onboardingOpen}
          patientName={activePatient.display_name}
          flow={flow}
          step={step}
          answers={activePatient.intake_answers}
          isSaving={isSavingIntake}
          isGenerating={isGenerating}
          error={actionError}
          showRecommendPrompt={showRecommendPrompt}
          onClose={closeOnboarding}
          onStepChange={setStep}
          onAnswersChange={(answers: IntakeAnswers) =>
            setActivePatient((current) =>
              current ? { ...current, intake_answers: answers } : current,
            )
          }
          onComplete={() => void handleIntakeComplete()}
          onGenerate={() => void handleGenerateRecommendation()}
        />
      ) : null}

      {loadError ? (
        <AuthAlert variant="error">{loadError}</AuthAlert>
      ) : (
        <>
          <section className="dashboard-hero relative overflow-hidden rounded-2xl p-5 md:p-6">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
              Clinical adviser
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <span className="font-sans text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-[2.25rem] md:leading-none">
                Peptide adviser
              </span>
              <span className="mb-1 text-brand-caption font-medium text-[color:var(--dash-faint)]">
                {info ? "System online" : "Connecting…"}
              </span>
            </div>
            <p className="text-brand-body mt-2 max-w-2xl text-[color:var(--dash-muted)]">
              Create a patient to start structured intake. Onboarding progress opens in a popup —
              patients with a recommendation open directly in chat.
            </p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={openCreateDialog}
                disabled={isCreating}
                className="font-sans inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-60"
              >
                {isCreating ? "Creating…" : "New patient"}
              </button>
              {activePatient && !activePatient.recommendation ? (
                <button
                  type="button"
                  onClick={() => setOnboardingOpen(true)}
                  className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center gap-1.5 rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition"
                >
                  Continue onboarding · {activePatient.display_name}
                </button>
              ) : null}
            </div>
          </section>

          {actionError && !onboardingOpen ? <AuthAlert variant="error">{actionError}</AuthAlert> : null}

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(16rem,0.8fr)]">
            <PatientListPanel
              patients={patients}
              activePatientId={activePatient?.patient_id ?? null}
              onSelect={(patientId) => void selectPatient(patientId)}
              onCreate={openCreateDialog}
              isCreating={isCreating}
              progressLabelFor={(patient) =>
                progressLabel(
                  patient,
                  activePatient?.patient_id === patient.patient_id ? step : undefined,
                )
              }
            />

            <aside className="dashboard-surface rounded-2xl p-5">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                System status
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between gap-2 text-brand-caption text-[color:var(--dash-muted)]">
                  <span>Service</span>
                  <span className="font-semibold text-emerald-600">
                    {info ? "Online" : "Connecting…"}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2 text-brand-caption text-[color:var(--dash-muted)]">
                  <span>Knowledge base</span>
                  <span>{vectors != null ? `${vectors.toLocaleString()} vectors` : "—"}</span>
                </div>
                {info ? (
                  <div className="flex items-center justify-between gap-2 text-brand-caption text-[color:var(--dash-muted)]">
                    <span>Model</span>
                    <span className="truncate text-right text-[color:var(--dash-text)]">
                      {info.chat_model}
                    </span>
                  </div>
                ) : null}
              </div>

              <div className="mt-5 rounded-xl bg-[color:var(--dash-soft)] px-3.5 py-3">
                <p className="text-brand-caption text-[color:var(--dash-muted)]">
                  Select a draft patient to resume onboarding in the popup, or open a completed
                  case to continue in chat.
                </p>
              </div>
            </aside>
          </div>
        </>
      )}
    </AdviserPageLayout>
  );
}
