"use client";

import Link from "next/link";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { studentNav } from "@/components/platform/provider/student/studentNav";

type AdviserChatPageLayoutProps = {
  patientName: string;
  children: React.ReactNode;
};

export function AdviserChatPageLayout({ patientName, children }: AdviserChatPageLayoutProps) {
  return (
    <PortalShell role="student" title="Peptide Adviser Chat" showPageHeader={false} nav={studentNav}>
      <div className="portal-guide-card mb-2 rounded-[1.75rem]">
        <div className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 md:px-9 md:py-5 lg:px-10">
          <header className="min-w-0 flex-1">
            <Link
              href="/student/adviser"
              className="inline-flex items-center gap-1.5 text-[12px] font-medium text-primary/50 transition hover:text-primary"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back to patients
            </Link>
            <h1 className="mt-2 text-xl font-bold leading-tight tracking-tight text-primary md:text-[1.65rem]">
              {patientName}
            </h1>
            <p className="mt-1 max-w-2xl text-[13px] leading-snug text-muted md:text-sm">
              Follow-up consultation chat for this patient case.
            </p>
          </header>
        </div>

        <div className="px-2 pb-2 md:px-4 md:pb-4">
          <div className="overflow-hidden rounded-2xl">{children}</div>
        </div>
      </div>
    </PortalShell>
  );
}
