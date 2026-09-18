"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { AdviserChatPageLayout } from "@/components/platform/provider/student/adviser/AdviserChatPageLayout";
import { AdviserChatPanel } from "@/components/platform/provider/student/adviser/AdviserChatPanel";
import { ChatMessagesSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  ACTIVE_PATIENT_STORAGE_KEY,
  getCachedPatient,
  getPatient,
  type PatientDetail,
} from "@/lib/integrate/provider/student/chat";

type StudentPeptideAdviserChatPageProps = {
  patientId: string;
};

export function StudentPeptideAdviserChatPage({ patientId }: StudentPeptideAdviserChatPageProps) {
  const router = useRouter();
  const [patient, setPatient] = useState<PatientDetail | null>(() =>
    getCachedPatient(patientId, true),
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [boardOpen, setBoardOpen] = useState(false);
  const [boardUpdated, setBoardUpdated] = useState(false);

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
            ...updated,
            messages: updated.messages ?? current.messages,
            messages_pagination:
              updated.messages_pagination ?? current.messages_pagination,
            recommendation_board:
              updated.recommendation_board ?? current.recommendation_board,
          }
        : updated,
    );
  }, []);

  const handleBoardToggle = useCallback(() => {
    setBoardOpen((open) => {
      if (!open) setBoardUpdated(false);
      return !open;
    });
  }, []);

  const board =
    patient?.recommendation_board
      ? {
          open: boardOpen,
          updated: boardUpdated && !boardOpen,
          peptideName:
            patient.recommendation_board.preferred ||
            patient.recommendation_board.ranked[0]?.name,
          onToggle: handleBoardToggle,
        }
      : null;

  if (loadError) {
    return (
      <AdviserChatPageLayout patientName="Consultation chat">
        <div className="flex min-h-0 flex-1 flex-col justify-center">
          <AuthAlert variant="error">{loadError}</AuthAlert>
        </div>
      </AdviserChatPageLayout>
    );
  }

  if (!patient) {
    return (
      <AdviserChatPageLayout patientName="Consultation chat">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChatMessagesSkeleton />
        </div>
      </AdviserChatPageLayout>
    );
  }

  return (
    <AdviserChatPageLayout patientName={patient.display_name} board={board}>
      <AdviserChatPanel
        key={patient.patient_id}
        patient={patient}
        onPatientChange={handlePatientChange}
        boardOpen={boardOpen}
        onBoardOpenChange={(open) => {
          setBoardOpen(open);
          if (open) setBoardUpdated(false);
        }}
        onBoardUpdated={() => setBoardUpdated(true)}
      />
    </AdviserChatPageLayout>
  );
}
