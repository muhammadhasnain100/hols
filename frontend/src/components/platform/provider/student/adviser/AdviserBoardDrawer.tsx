"use client";

import { useEffect } from "react";
import { RecommendationWarRoom } from "@/components/platform/provider/student/adviser/RecommendationWarRoom";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import {
  rankedFocusNames,
  talkAboutHeaderLabel,
  talkAboutTitle,
} from "@/components/platform/provider/student/adviser/talkAbout";
import type {
  BoardConfidence,
  RecommendationBoard,
  RecommendationBoardPeptide,
} from "@/lib/integrate/provider/student/chat";

type AdviserBoardDrawerProps = {
  board: RecommendationBoard;
  updated?: boolean;
  disabled?: boolean;
  isUpdating?: boolean;
  onClose: () => void;
  onConfidenceChange: (confidence: BoardConfidence) => void;
  onPrefer: (name: string) => void;
  onClearPreferred: () => void;
  onChip: (chip: string) => void;
  onAskAbout: (peptide: RecommendationBoardPeptide, action: "why" | "compare" | "safety") => void;
  selectedNames?: string[];
  onSelectPeptides?: (names: string[]) => void;
};

export function AdviserBoardDrawer({
  board,
  updated = false,
  disabled,
  isUpdating,
  onClose,
  onConfidenceChange,
  onPrefer,
  onClearPreferred,
  onChip,
  onAskAbout,
  selectedNames,
  onSelectPeptides,
}: AdviserBoardDrawerProps) {
  const talking = selectedNames && selectedNames.length > 0 ? selectedNames : rankedFocusNames(board);
  const title = talkAboutHeaderLabel(talking) || "Current peptide";

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="adviser-board-layer">
      <button
        type="button"
        className="adviser-board-backdrop"
        aria-label="Close recommendation board"
        onClick={onClose}
      />
      <aside
        className="adviser-board-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="adviser-board-drawer-title"
      >
        <header className="adviser-board-drawer-header">
          <div className="min-w-0 flex-1">
            <p className="text-brand-caption font-medium uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              {updated ? "Board updated" : talkAboutTitle(talking)}
            </p>
            <h2
              id="adviser-board-drawer-title"
              className="font-sans mt-1 truncate text-lg font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)]"
            >
              {title}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close recommendation board"
            onClick={onClose}
            className="adviser-onboarding-close inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)] transition sm:h-12 sm:w-12"
          >
            <SidebarSvgIcon name="cross" size={24} strokeWidth={2.2} className="sm:hidden" />
            <SidebarSvgIcon name="cross" size={28} strokeWidth={2.15} className="hidden sm:block" />
          </button>
        </header>

        <div className="adviser-board-drawer-body" data-lenis-prevent>
          <RecommendationWarRoom
            board={board}
            disabled={disabled}
            isUpdating={isUpdating}
            hideConfidenceDial={false}
            onConfidenceChange={onConfidenceChange}
            onPrefer={onPrefer}
            onClearPreferred={onClearPreferred}
            onChip={(chip) => {
              onClose();
              onChip(chip);
            }}
            onAskAbout={(peptide, action) => {
              onClose();
              onAskAbout(peptide, action);
            }}
            selectedNames={talking}
            onSelectPeptides={onSelectPeptides}
          />
        </div>
      </aside>
    </div>
  );
}
