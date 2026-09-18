"use client";

import { useEffect } from "react";
import { Icon, X } from "@/components/icons";
import { RecommendationWarRoom } from "@/components/platform/provider/student/adviser/RecommendationWarRoom";
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
  selectedName?: string | null;
  onSelectPeptide?: (name: string) => void;
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
  selectedName,
  onSelectPeptide,
}: AdviserBoardDrawerProps) {
  const current =
    board.ranked.find((item) => item.name === board.preferred) ?? board.ranked[0];

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
              {updated ? "Board updated" : "Recommendation"}
            </p>
            <h2
              id="adviser-board-drawer-title"
              className="font-sans mt-1 truncate text-lg font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)]"
            >
              {current?.name || "Current peptide"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close recommendation board"
            onClick={onClose}
            className="dashboard-icon-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
          >
            <Icon icon={X} size={18} strokeWidth={2.1} />
          </button>
        </header>

        <div className="adviser-board-drawer-body" data-lenis-prevent>
          <RecommendationWarRoom
            board={board}
            disabled={disabled}
            isUpdating={isUpdating}
            hideConfidenceDial
            onConfidenceChange={onConfidenceChange}
            onPrefer={onPrefer}
            onClearPreferred={onClearPreferred}
            onChip={(chip) => {
              onClose();
              onChip(chip);
            }}
            onAskAbout={(peptide, action) => {
              onSelectPeptide?.(peptide.name);
              onClose();
              onAskAbout(peptide, action);
            }}
            selectedName={selectedName}
            onSelectPeptide={onSelectPeptide}
          />
        </div>
      </aside>
    </div>
  );
}
