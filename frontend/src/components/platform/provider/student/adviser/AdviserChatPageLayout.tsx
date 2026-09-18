"use client";

import { PortalShell } from "@/components/platform/provider/PortalShell";
import {
  AdviserChatHeaderStrip,
  type AdviserBoardHeaderControl,
} from "@/components/platform/provider/student/adviser/AdviserChatHeaderStrip";
import { studentNav } from "@/components/platform/provider/student/studentNav";

type AdviserChatPageLayoutProps = {
  patientName: string;
  board?: AdviserBoardHeaderControl | null;
  children: React.ReactNode;
};

export function AdviserChatPageLayout({
  patientName,
  board,
  children,
}: AdviserChatPageLayoutProps) {
  return (
    <PortalShell
      role="student"
      title={patientName || "Patient"}
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={studentNav}
    >
      <div className="adviser-chat-screen dashboard-screen relative flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <AdviserChatHeaderStrip patientName={patientName} board={board} />
        <div className="adviser-chat-body relative flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
      </div>
    </PortalShell>
  );
}
