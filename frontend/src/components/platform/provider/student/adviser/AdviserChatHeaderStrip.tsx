"use client";

import Link from "next/link";
import { ArrowLeft, ClipboardList, Icon, Menu } from "@/components/icons";
import { cn } from "@/lib/utils";

export type AdviserBoardHeaderControl = {
  open: boolean;
  updated: boolean;
  peptideName?: string;
  peptideCount?: number;
  onToggle: () => void;
};

type AdviserChatHeaderStripProps = {
  patientName: string;
  board?: AdviserBoardHeaderControl | null;
};

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

/** Full-bleed milky frosted-glass top bar (sibling above the transcript scrollport). */
export function AdviserChatHeaderStrip({ patientName, board }: AdviserChatHeaderStripProps) {
  const boardLabel = board?.updated ? "Board updated" : "Board";

  return (
    <div className="adviser-chat-header-strip">
      <div className="adviser-chat-header-frost" aria-hidden="true">
        <span className="adviser-chat-header-refraction adviser-chat-header-refraction--one" />
        <span className="adviser-chat-header-refraction adviser-chat-header-refraction--two" />
        <span className="adviser-chat-header-refraction adviser-chat-header-refraction--three" />
      </div>
      <div className="adviser-chat-header-chrome">
        <button
          type="button"
          aria-label="Open sidebar"
          onClick={openSidebar}
          className="dashboard-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full lg:hidden sm:h-12 sm:w-12"
        >
          <Icon icon={Menu} size={18} />
        </button>

        <Link
          href="/student/adviser"
          aria-label="Back to Peptide Advisor"
          className="adviser-chat-back-btn dashboard-navy-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full no-underline sm:h-12 sm:w-12"
        >
          <Icon icon={ArrowLeft} size={18} strokeWidth={2.4} />
        </Link>

        <h1
          className="font-sans min-w-0 flex-1 truncate text-xl font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl"
          title={patientName || undefined}
        >
          {patientName || "Patient"}
        </h1>

        {board ? (
          <button
            type="button"
            aria-label={
              board.peptideName
                ? board.peptideCount && board.peptideCount > 1
                  ? `${boardLabel}. Talking about ${board.peptideCount} peptides: ${board.peptideName}`
                  : `${boardLabel}. Talking about 1 peptide: ${board.peptideName}`
                : boardLabel
            }
            aria-expanded={board.open}
            aria-haspopup="dialog"
            onClick={board.onToggle}
            className={cn(
              "dashboard-notify-btn relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full sm:h-12 sm:w-12",
              board.open && "ring-2 ring-white/75",
            )}
          >
            <Icon icon={ClipboardList} size={18} strokeWidth={1.9} />
            {board.peptideCount ? (
              <span className="adviser-peptide-select-count" aria-hidden>
                {board.peptideCount}
              </span>
            ) : null}
            {board.updated ? (
              <span
                className="absolute right-1 top-1 h-2.5 w-2.5 rounded-full bg-white ring-2 ring-[#142644]"
                aria-hidden
              />
            ) : null}
          </button>
        ) : null}
      </div>
    </div>
  );
}
