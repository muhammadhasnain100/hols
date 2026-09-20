"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { AdviserChatPageLayout } from "@/components/platform/provider/student/adviser/AdviserChatPageLayout";
import { AdviserChatPanel } from "@/components/platform/provider/student/adviser/AdviserChatPanel";
import { AdviserPageLayout } from "@/components/platform/provider/student/adviser/AdviserPageLayout";
import { ChatMessagesSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { MembershipLockedPanel } from "@/components/platform/provider/student/membership/MembershipGate";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  ACTIVE_PATIENT_STORAGE_KEY,
  getCachedPatient,
  getPatient,
  type PatientDetail,
} from "@/lib/integrate/provider/student/chat";
import {
  rankedFocusNames,
  talkAboutHeaderLabel,
} from "@/components/platform/provider/student/adviser/talkAbout";
import {
  isMembershipRequiredError,
  useStudentMembershipAccess,
} from "@/lib/integrate/provider/student/payment/membershipAccess";

type StudentPeptideAdviserChatPageProps = {
  patientId: string;
};

export function StudentPeptideAdviserChatPage({ patientId }: StudentPeptideAdviserChatPageProps) {
  const router = useRouter();
  const membershipAccess = useStudentMembershipAccess();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [apiLocked, setApiLocked] = useState(false);
  const [boardOpen, setBoardOpen] = useState(false);
  const [boardUpdated, setBoardUpdated] = useState(false);

  useEffect(() => {
    window.sessionStorage.setItem(ACTIVE_PATIENT_STORAGE_KEY, patientId);
  }, [patientId]);

  useEffect(() => {
    if (!membershipAccess.ready || membershipAccess.locked) return;

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
        if (isMembershipRequiredError(err)) {
          setPatient(null);
          setApiLocked(true);
          return;
        }
        setLoadError(
          err instanceof ApiRequestError ? err.message : "Could not load consultation chat.",
        );
      }
    }

    void loadPatient();

    return () => {
      cancelled = true;
    };
  }, [membershipAccess.locked, membershipAccess.ready, patientId, router]);

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
            turns_used: updated.turns_used ?? current.turns_used,
            turns_max: updated.turns_max ?? current.turns_max,
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

  const focusNames = rankedFocusNames(patient?.recommendation_board);
  const board =
    patient?.recommendation_board
      ? {
          open: boardOpen,
          updated: boardUpdated && !boardOpen,
          peptideName: talkAboutHeaderLabel(focusNames),
          peptideCount: focusNames.length,
          onToggle: handleBoardToggle,
        }
      : null;

  if (!membershipAccess.ready) {
    return (
      <AdviserChatPageLayout patientName="Consultation chat">
        <div className="min-h-0 flex-1 overflow-y-auto">
          <ChatMessagesSkeleton />
        </div>
      </AdviserChatPageLayout>
    );
  }

  if (membershipAccess.locked || apiLocked) {
    return (
      <AdviserPageLayout>
        <MembershipLockedPanel
          title="Membership required"
          description="You can still create patients and complete onboarding. An active membership is required to generate a recommendation and open consultation chat."
        />
      </AdviserPageLayout>
    );
  }

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
