"use client";

import Link from "next/link";
import { ChevronLeft, Icon, Menu } from "@/components/icons";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";

type AdviserChatHeaderStripProps = {
  patientName: string;
};

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

/** Full-bleed milky frosted-glass top bar (sibling above the transcript scrollport). */
export function AdviserChatHeaderStrip({ patientName }: AdviserChatHeaderStripProps) {
  return (
    <div className="adviser-chat-header-strip">
      <div className="adviser-chat-header-frost" aria-hidden="true">
        <span className="adviser-chat-header-refraction adviser-chat-header-refraction--one" />
        <span className="adviser-chat-header-refraction adviser-chat-header-refraction--two" />
        <span className="adviser-chat-header-refraction adviser-chat-header-refraction--three" />
      </div>
      <div className="adviser-chat-header-chrome">
        <div className="flex min-w-0 items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2.5">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={openSidebar}
              className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full lg:hidden"
            >
              <Icon icon={Menu} size={18} />
            </button>
            <Link
              href="/student/adviser"
              aria-label="Back to Peptide Advisor"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-0 bg-[#DDE466] text-[#152744] transition hover:brightness-105"
            >
              <Icon icon={ChevronLeft} size={16} strokeWidth={2.2} />
            </Link>
            <div className="min-w-0">
              <h1
                className="font-sans truncate text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl"
                title={patientName || undefined}
              >
                {patientName || "Patient"}
              </h1>
            </div>
          </div>

          <WelcomeChip />
        </div>
      </div>
    </div>
  );
}
