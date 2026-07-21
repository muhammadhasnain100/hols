"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import {
  portalEmptyStateClass,
  portalInlineMetaClass,
  portalSectionDescClass,
  portalSectionEyebrowClass,
} from "@/components/platform/provider/portal-styles";
import { AdviserPageLayout } from "@/components/platform/provider/student/adviser/AdviserPageLayout";
import { CreatePatientDialog } from "@/components/platform/provider/student/adviser/CreatePatientDialog";
import { IntakeStageList, IntakeWizard } from "@/components/platform/provider/student/adviser/IntakeWizard";
import { PatientListPanel } from "@/components/platform/provider/student/adviser/PatientListPanel";
import { Button } from "@/components/ui/Button";
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
  type PatientDetail,
  type PatientSummary,
  type QuestionnaireFlow,
} from "@/lib/integrate/provider/student/chat";
import { cn } from "@/lib/utils";

function resolveStep(patient: PatientDetail): number {
  if (patient.recommendation) return 7;
  if (Object.keys(patient.intake_answers || {}).length > 0) return 7;
  return 0;
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
            setActivePatient(cached.active_patient);
            setStep(resolveStep(cached.active_patient));
          }
        }

        const payload = await getAdviserBootstrap(storedPatientId ?? undefined);
        if (cancelled) return;

        setInfo(payload.info);
        setFlow(payload.flow);
        setPatients(payload.patients);

        if (payload.active_patient && !payload.active_patient.recommendation) {
          setActivePatient(payload.active_patient);
          setStep(resolveStep(payload.active_patient));
          if (payload.active_patient_id) {
            window.sessionStorage.setItem(ACTIVE_PATIENT_STORAGE_KEY, payload.active_patient_id);
          }
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
  }, []);

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
        setActivePatient(patient);
        setStep(resolveStep(patient));
      } catch (err) {
        setActionError(err instanceof ApiRequestError ? err.message : "Could not load patient.");
      }
    },
    [patients, routeToChat],
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
        setActivePatient(patient);
        setStep(0);
        setCreateDialogOpen(false);
      } catch (err) {
        const message =
          err instanceof ApiRequestError ? err.message : "Could not create patient.";
        setCreateDialogError(message);
        setActionError(message);
      } finally {
        setIsCreating(false);
      }
    },
    [refreshPatients],
  );

  const openCreateDialog = useCallback(() => {
    setCreateDialogError(null);
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
      routeToChat(activePatient.patient_id);
    } catch (err) {
      setActionError(
        err instanceof ApiRequestError ? err.message : "Could not generate recommendation.",
      );
    } finally {
      setIsGenerating(false);
    }
  }, [activePatient, refreshPatients, routeToChat]);

  const showIntake =
    activePatient && !activePatient.recommendation && step < 7 && !isSavingIntake;
  const showRecommendPrompt =
    activePatient &&
    !activePatient.recommendation &&
    step >= 7 &&
    !isSavingIntake &&
    !isGenerating;

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

      {loadError ? (
        <AuthAlert variant="error">{loadError}</AuthAlert>
      ) : (
        <div className="grid gap-5 xl:grid-cols-[15rem_minmax(0,1fr)_15rem]">
          <PatientListPanel
            patients={patients}
            activePatientId={activePatient?.patient_id ?? null}
            onSelect={(patientId) => void selectPatient(patientId)}
            onCreate={openCreateDialog}
            isCreating={isCreating}
          />

          <div className="space-y-4">
            {actionError ? <AuthAlert variant="error">{actionError}</AuthAlert> : null}

            {!activePatient ? (
              <div className={cn("rounded-2xl border border-primary/10 bg-white p-8 text-center", portalEmptyStateClass)}>
                Select a patient or create a new one to begin intake.
              </div>
            ) : null}

            {showIntake && flow ? (
              <IntakeWizard
                flow={flow}
                step={step}
                answers={activePatient.intake_answers}
                onStepChange={setStep}
                onAnswersChange={(answers) =>
                  setActivePatient((current) =>
                    current ? { ...current, intake_answers: answers } : current,
                  )
                }
                onComplete={() => void handleIntakeComplete()}
              />
            ) : null}

            {isSavingIntake ? (
              <div className={cn("rounded-2xl border border-primary/10 bg-white p-8 text-center", portalEmptyStateClass)}>
                Saving intake…
              </div>
            ) : null}

            {showRecommendPrompt ? (
              <div className="rounded-2xl border border-primary/10 bg-white p-8 text-center">
                <p className={portalSectionDescClass}>
                  Intake saved for <span className="font-semibold">{activePatient.display_name}</span>.
                  Generate the recommendation card to open the consultation chat.
                </p>
                <Button
                  type="button"
                  className="mt-4"
                  onClick={() => void handleGenerateRecommendation()}
                  disabled={isGenerating}
                >
                  {isGenerating ? "Generating…" : "Generate recommendation & open chat"}
                </Button>
              </div>
            ) : null}

            {isGenerating ? (
              <div className={cn("rounded-2xl border border-primary/10 bg-white p-8 text-center", portalEmptyStateClass)}>
                Generating recommendation…
              </div>
            ) : null}
          </div>

          <aside className="rounded-2xl border border-primary/10 bg-white p-4 shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
            <p className={portalSectionEyebrowClass}>Intake progress</p>
            <div className="mt-3">
              <IntakeStageList
                step={step}
                inChat={Boolean(activePatient?.recommendation)}
              />
            </div>

            <div className={cn("mt-5 space-y-2 border-t border-primary/8 pt-4", portalInlineMetaClass)}>
              <div className="flex items-center justify-between gap-2">
                <span>System</span>
                <span className="font-semibold text-emerald-600">{info ? "online" : "connecting…"}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span>Knowledge base</span>
                <span>{vectors != null ? `${vectors.toLocaleString()} vectors` : "—"}</span>
              </div>
              {info ? (
                <div className="flex items-center justify-between gap-2">
                  <span>Model</span>
                  <span className="truncate text-right">{info.chat_model}</span>
                </div>
              ) : null}
            </div>
          </aside>
        </div>
      )}
    </AdviserPageLayout>
  );
}
