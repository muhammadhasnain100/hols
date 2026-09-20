"use client";

import { useEffect, useState } from "react";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import {
  rankedFocusNames,
} from "@/components/platform/provider/student/adviser/talkAbout";
import { cn } from "@/lib/utils";
import type {
  BoardConfidence,
  RecommendationBoard,
  RecommendationBoardPeptide,
} from "@/lib/integrate/provider/student/chat";

type RecommendationWarRoomProps = {
  board: RecommendationBoard;
  disabled?: boolean;
  isUpdating?: boolean;
  onConfidenceChange: (confidence: BoardConfidence) => void;
  onPrefer: (name: string) => void;
  onClearPreferred: () => void;
  onChip: (chip: string) => void;
  onAskAbout: (peptide: RecommendationBoardPeptide, action: "why" | "compare" | "safety") => void;
  /** Hide the dial when a sticky composer dial is shown instead. */
  hideConfidenceDial?: boolean;
  selectedNames?: string[];
  onSelectPeptides?: (names: string[]) => void;
};

export const CONFIDENCE_OPTIONS: Array<{
  value: BoardConfidence;
  label: string;
  shortLabel: string;
}> = [
  { value: "conservative", label: "Conservative", shortLabel: "Safe" },
  { value: "balanced", label: "Balanced", shortLabel: "Balanced" },
  { value: "aggressive", label: "Aggressive", shortLabel: "Bold" },
];

function safetyLabel(status: string) {
  if (status === "blocked") return "Blocked";
  if (status === "caution") return "Caution";
  return "Clear";
}

export function ConfidenceDial({
  value,
  onChange,
  disabled = false,
  isUpdating = false,
  compact = false,
  className,
}: {
  value: BoardConfidence;
  onChange: (confidence: BoardConfidence) => void;
  disabled?: boolean;
  isUpdating?: boolean;
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(compact ? "adviser-confidence-dial is-compact" : "adviser-war-room-dial", className)}>
      <div className="flex items-center justify-between gap-2">
        <p
          className={cn(
            "text-brand-caption font-medium",
            compact ? "text-[color:var(--dash-faint)]" : "text-[color:var(--dash-muted)]",
          )}
        >
          Confidence
        </p>
        {isUpdating ? (
          <span className="text-brand-caption text-[color:var(--dash-faint)]">Updating…</span>
        ) : (
          <span className="text-brand-caption capitalize text-[color:var(--dash-muted)]">{value}</span>
        )}
      </div>
      <div
        className={cn(compact ? "adviser-confidence-dial-track" : "adviser-war-room-dial-track")}
        role="group"
        aria-label="Confidence dial"
      >
        {CONFIDENCE_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={disabled || isUpdating}
            onClick={() => onChange(option.value)}
            aria-pressed={value === option.value}
            className={cn(
              compact ? "adviser-confidence-dial-option" : "adviser-war-room-dial-option",
              value === option.value && "is-active",
            )}
          >
            {compact ? option.shortLabel : option.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RecommendationWarRoom({
  board,
  disabled = false,
  isUpdating = false,
  onConfidenceChange,
  onPrefer,
  onClearPreferred,
  onChip,
  onAskAbout,
  hideConfidenceDial = false,
  selectedNames: selectedNamesProp,
  onSelectPeptides,
}: RecommendationWarRoomProps) {
  const ranked = board.ranked ?? [];
  const rankedNames = ranked.map((peptide) => peptide.name);
  const preferredName = board.preferred || ranked[0]?.name || null;
  const selectedNames = (
    selectedNamesProp && selectedNamesProp.length > 0
      ? selectedNamesProp
      : rankedFocusNames(board)
  ).filter((name) => rankedNames.includes(name));
  const selectedSet = new Set(selectedNames);
  const allSelected = rankedNames.length > 0 && rankedNames.every((name) => selectedSet.has(name));
  const [detailName, setDetailName] = useState<string | null>(
    selectedNames[0] ?? preferredName,
  );

  const selectedKey = selectedNames.join("|");

  useEffect(() => {
    if (detailName && selectedNames.includes(detailName)) return;
    setDetailName(selectedNames[0] ?? preferredName);
  }, [detailName, preferredName, selectedKey, selectedNames]);

  const togglePeptide = (name: string) => {
    let next: string[];
    if (selectedSet.has(name)) {
      next = selectedNames.filter((item) => item !== name);
      if (next.length === 0) next = [name];
    } else {
      next = [...selectedNames, name];
      setDetailName(name);
    }
    if (next.includes(name)) setDetailName(name);
    onSelectPeptides?.(next);
  };

  const toggleAll = () => {
    const next = allSelected ? [rankedNames[0]] : rankedNames;
    onSelectPeptides?.(next);
    setDetailName(next[0] ?? preferredName);
  };

  const selected =
    ranked.find((item) => item.name === detailName) ??
    ranked.find((item) => item.name === preferredName) ??
    ranked[0];
  const confidence = (board.confidence as BoardConfidence) || "balanced";
  const compareSelected = selectedNames.length >= 2;

  return (
    <section className="adviser-board-card" aria-label="Current peptide recommendation">
      {board.primary_goal ? (
        <p className="text-brand-caption text-[color:var(--dash-muted)]">
          Goal · {board.primary_goal}
        </p>
      ) : null}

      {selected ? (
        <article className="adviser-board-current">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="adviser-board-rank">#{selected.rank}</span>
                {board.preferred === selected.name ? (
                  <span className="text-brand-caption font-semibold text-[color:var(--dash-navy)]">
                    Preferred
                  </span>
                ) : null}
                <span className="text-brand-caption font-medium text-[color:var(--dash-faint)]">
                  {selectedNames.length === 1
                    ? "Only this peptide"
                    : `${selectedNames.length} selected`}
                </span>
              </div>
              <h3 className="font-sans mt-2 text-xl font-bold leading-tight tracking-[0.01em] text-[color:var(--dash-text)]">
                {selected.name}
              </h3>
            </div>
            <div
              className={cn(
                "adviser-war-room-safety shrink-0",
                board.safety?.status === "blocked" && "is-blocked",
                board.safety?.status === "caution" && "is-caution",
              )}
            >
              <span className="adviser-war-room-safety-dot" aria-hidden />
              {safetyLabel(board.safety?.status || "clear")}
            </div>
          </div>

          {selected.fit ? (
            <p className="text-brand-body mt-3 text-[color:var(--dash-text)]">{selected.fit}</p>
          ) : null}
          {selected.evidence ? (
            <p className="text-brand-caption mt-2 text-[color:var(--dash-muted)]">
              Evidence · {selected.evidence}
            </p>
          ) : null}

          <div className="adviser-board-actions">
            <button
              type="button"
              disabled={disabled}
              className="adviser-war-room-mini-btn"
              onClick={() => onAskAbout(selected, "why")}
            >
              Why?
            </button>
            {ranked.length >= 2 ? (
              <button
                type="button"
                disabled={disabled}
                className="adviser-war-room-mini-btn"
                onClick={() => onAskAbout(selected, "compare")}
              >
                {compareSelected ? "Compare selected" : "Compare"}
              </button>
            ) : null}
            <button
              type="button"
              disabled={disabled}
              className="adviser-war-room-mini-btn"
              onClick={() => onAskAbout(selected, "safety")}
            >
              Safety
            </button>
            {board.preferred === selected.name ? (
              <button
                type="button"
                disabled={disabled}
                className="adviser-war-room-mini-btn is-accent"
                onClick={onClearPreferred}
              >
                Unlock
              </button>
            ) : (
              <button
                type="button"
                disabled={disabled}
                className="adviser-war-room-mini-btn is-accent"
                onClick={() => onPrefer(selected.name)}
              >
                Choose
              </button>
            )}
          </div>
        </article>
      ) : (
        <p className="text-brand-body py-3 text-[color:var(--dash-muted)]">
          No peptides available for this case with the current safety profile.
        </p>
      )}

      {ranked.length > 0 ? (
        <div className="adviser-board-list" aria-label="Talk about peptides">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-brand-caption font-medium uppercase tracking-[0.06em] text-[color:var(--dash-faint)]">
              Talk about
            </p>
            {ranked.length > 1 ? (
              <button
                type="button"
                disabled={disabled}
                onClick={toggleAll}
                className="adviser-board-select-all text-brand-caption font-medium"
              >
                {allSelected ? "Only top pick" : "Select all"}
              </button>
            ) : null}
          </div>
          {ranked.map((peptide) => {
            const talking = selectedSet.has(peptide.name);
            return (
              <button
                key={peptide.name}
                type="button"
                disabled={disabled}
                onClick={() => togglePeptide(peptide.name)}
                aria-pressed={talking}
                className={cn(
                  "adviser-board-row",
                  talking && "is-talking",
                  board.preferred === peptide.name && "is-preferred",
                )}
              >
                <span
                  className={cn("adviser-peptide-select-check", talking && "is-checked")}
                  aria-hidden
                >
                  {talking ? <SidebarSvgIcon name="check" size={13} strokeWidth={2.6} /> : null}
                </span>
                <span className="adviser-board-row-rank">#{peptide.rank}</span>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-semibold text-[color:var(--dash-text)]">
                    {peptide.name}
                  </span>
                  <span className="text-brand-caption mt-0.5 block truncate text-[color:var(--dash-muted)]">
                    {talking
                      ? selectedNames.length === 1
                        ? "Talking about this peptide"
                        : "Included in this chat"
                      : "Tap to include"}
                    {peptide.evidence ? ` · ${peptide.evidence}` : ""}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {!hideConfidenceDial ? (
        <ConfidenceDial
          value={confidence}
          onChange={onConfidenceChange}
          disabled={disabled}
          isUpdating={isUpdating}
        />
      ) : null}

      {(board.labs?.length || board.stacks?.length) ? (
        <div className="adviser-war-room-meta-grid">
          {board.labs?.length ? (
            <div>
              <p className="text-brand-caption font-medium text-[color:var(--dash-muted)]">Baseline labs</p>
              <ul className="adviser-board-labs">
                {board.labs.map((lab) => (
                  <li key={lab}>{lab}</li>
                ))}
              </ul>
            </div>
          ) : null}
          {board.stacks?.length ? (
            <div>
              <p className="text-brand-caption font-medium text-[color:var(--dash-muted)]">Suggested stack</p>
              <p className="text-brand-caption mt-1 text-[color:var(--dash-text)]">
                {board.stacks[0]}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      {board.chips?.length ? (
        <div className="adviser-war-room-chips" aria-label="Quick actions">
          {board.chips.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={disabled}
              onClick={() => onChip(chip)}
              className="adviser-war-room-chip dashboard-pill-soft"
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}
