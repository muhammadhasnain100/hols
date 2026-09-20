"use client";

import { LecturesPageLayout } from "@/components/platform/provider/student/lectures/LecturesPageLayout";
import { MembershipLockedPanel } from "@/components/platform/provider/student/membership/MembershipGate";

export function LectureMembershipLockedScreen() {
  return (
    <LecturesPageLayout>
      <MembershipLockedPanel
        title="Membership required"
        description="Unlock lecture details, lessons, quizzes, and the course calculator with an active membership."
      />
    </LecturesPageLayout>
  );
}
