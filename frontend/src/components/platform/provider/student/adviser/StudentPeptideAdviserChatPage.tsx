"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { portalEmptyStateClass } from "@/components/platform/provider/portal-styles";
import { AdviserChatPageLayout } from "@/components/platform/provider/student/adviser/AdviserChatPageLayout";
import { AdviserChatPanel } from "@/components/platform/provider/student/adviser/AdviserChatPanel";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  ACTIVE_PATIENT_STORAGE_KEY,
  getCachedPatient,
  getPatient,
  type PatientDetail,
} from "@/lib/integrate/provider/student/chat";
import { cn } from "@/lib/utils";

type StudentPeptideAdviserChatPageProps = {
  patientId: string;
};

export function StudentPeptideAdviserChatPage({ patientId }: StudentPeptideAdviserChatPageProps) {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientDetail | null>(() =>
    getCachedPatient(patientId, true),
  );
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    window.sessionStorage.setItem(ACTIVE_PATIENT_STORAGE_KEY, patientId);
  }, [patientId]);

  useEffect(() => {
    let cancelled = false;

    async function loadPatient() {
      try {
        const cached = getCachedPatient(patientId, true);
        if (cached && !cancelled) {
          setPatient(cached);
          if (!cached.recommendation) {
            router.replace("/student/adviser");
            return;
          }
        }

        const detail = await getPatient(patientId, { includeMessages: true });
        if (cancelled) return;

        if (!detail.recommendation) {
          router.replace("/student/adviser");
          return;
        }

        setPatient(detail);
      } catch (err) {
        if (cancelled) return;
        setLoadError(
          err instanceof ApiRequestError ? err.message : "Could not load consultation chat.",
        );
      }
    }

    void loadPatient();

    return () => {
      cancelled = true;
    };
  }, [patientId, router]);

  const handlePatientChange = useCallback((updated: PatientDetail) => {
    setPatient((current) =>
      current
        ? {
            ...current,
            message_count: updated.message_count,
            updated_at: updated.updated_at,
            status: updated.status,
          }
        : updated,
    );
  }, []);

  if (loadError) {
    return (
      <AdviserChatPageLayout patientName="Consultation chat">
        <AuthAlert variant="error">{loadError}</AuthAlert>
      </AdviserChatPageLayout>
    );
  }

  if (!patient) {
    return (
      <AdviserChatPageLayout patientName="Consultation chat">
        <div className={cn("rounded-2xl border border-primary/10 bg-white p-8 text-center", portalEmptyStateClass)}>
          Loading chat…
        </div>
      </AdviserChatPageLayout>
    );
  }

  return (
    <AdviserChatPageLayout patientName={patient.display_name}>
      <AdviserChatPanel
        key={patient.patient_id}
        patient={patient}
        onPatientChange={handlePatientChange}
        onNewCase={() => router.push("/student/adviser")}
      />
    </AdviserChatPageLayout>
  );
}
