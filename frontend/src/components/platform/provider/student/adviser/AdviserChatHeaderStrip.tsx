"use client";

import Link from "next/link";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
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
      <div className="adviser-chat-header-chrome gap-1.5 min-[400px]:gap-2 sm:gap-3 md:gap-4">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={openSidebar}
          className="dashboard-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-lg min-[400px]:h-11 min-[400px]:w-11 lg:hidden sm:h-12 sm:w-12"
        >
          <SidebarSvgIcon name="menu" size={18} strokeWidth={2} />
        </button>

        <Link
          href="/student/adviser"
          aria-label="Back to Peptide Advisor"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-0 bg-[#DDE466] text-[#152744] transition hover:brightness-105 min-[400px]:h-11 min-[400px]:w-11 sm:h-12 sm:w-12"
        >
          <SidebarSvgIcon name="previous" size={16} strokeWidth={2.2} />
        </Link>

        <h1
          className="font-sans min-w-0 flex-1 truncate text-lg font-bold leading-tight tracking-[0.01em] text-[color:var(--dash-text)] min-[400px]:text-xl sm:text-2xl sm:leading-none md:text-3xl"
          title={patientName || undefined}
        >
          {patientName || "Patient"}
        </h1>

        <WelcomeChip className="lecture-header-welcome h-10 shrink-0 max-[359px]:hidden min-[400px]:h-11 sm:h-12" />
      </div>
    </div>
  );
}
