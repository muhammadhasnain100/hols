"use client";

import { useMemo, useState } from "react";
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
}: RecommendationWarRoomProps) {
  const [expandedName, setExpandedName] = useState<string | null>(
    board.ranked[0]?.name ?? null,
  );

  const confidence = (board.confidence as BoardConfidence) || "balanced";
  const ranked = board.ranked ?? [];
  const top = ranked[0];

  const orbitSizes = useMemo(() => {
    return ranked.map((_, index) => Math.max(72 - index * 10, 48));
  }, [ranked]);

  return (
    <section className="adviser-war-room" aria-label="Recommendation War Room">
      <header className="adviser-war-room-header">
        <div className="min-w-0 flex-1">
          <p className="text-brand-caption font-medium uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
            Clinical War Room
          </p>
          <h2 className="font-sans mt-1 truncate text-[0.95rem] font-semibold leading-snug text-[color:var(--dash-text)] sm:text-lg sm:leading-normal">
            {board.primary_goal || "Patient case"}
          </h2>
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
      </header>

      {ranked.length > 0 ? (
        <div className="adviser-war-room-orbit" aria-label="Ranked peptides">
          {ranked.map((peptide, index) => {
            const size = orbitSizes[index] ?? 48;
            const isPreferred = board.preferred === peptide.name;
            const isExpanded = expandedName === peptide.name;
            return (
              <button
                key={peptide.name}
                type="button"
                disabled={disabled}
                onClick={() => setExpandedName(peptide.name)}
                className={cn(
                  "adviser-war-room-orbit-card",
                  index === 0 && "is-top",
                  isPreferred && "is-preferred",
                  isExpanded && "is-expanded",
                )}
                style={{ ["--orbit-size" as string]: `${size}px` }}
              >
                <span className="adviser-war-room-rank">#{peptide.rank}</span>
                <span className="adviser-war-room-orbit-name">{peptide.name}</span>
                {peptide.evidence ? (
                  <span className="adviser-war-room-orbit-meta">{peptide.evidence}</span>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="text-brand-body px-1 py-3 text-[color:var(--dash-muted)]">
          No peptides available for this case with the current safety profile.
        </p>
      )}

      {top && expandedName ? (
        <ExpandedPeptidePanel
          peptide={ranked.find((item) => item.name === expandedName) || top}
          preferred={board.preferred}
          disabled={disabled}
          onPrefer={onPrefer}
          onClearPreferred={onClearPreferred}
          onAskAbout={onAskAbout}
          canCompare={ranked.length >= 2}
        />
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
              <p className="text-brand-caption mt-1 text-[color:var(--dash-text)]">
                {board.labs.slice(0, 4).join(" · ")}
                {board.labs.length > 4 ? ` +${board.labs.length - 4}` : ""}
              </p>
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
              className="adviser-war-room-chip"
            >
              {chip}
            </button>
          ))}
        </div>
      ) : null}
    </section>
  );
}

function ExpandedPeptidePanel({
  peptide,
  preferred,
  disabled,
  onPrefer,
  onClearPreferred,
  onAskAbout,
  canCompare,
}: {
  peptide: RecommendationBoardPeptide;
  preferred?: string | null;
  disabled?: boolean;
  onPrefer: (name: string) => void;
  onClearPreferred: () => void;
  onAskAbout: (peptide: RecommendationBoardPeptide, action: "why" | "compare" | "safety") => void;
  canCompare: boolean;
}) {
  const isPreferred = preferred === peptide.name;

  return (
    <div className="adviser-war-room-detail">
      <div className="min-w-0 flex-1">
        <p className="font-sans text-sm font-semibold text-[color:var(--dash-text)]">
          {peptide.name}
          {isPreferred ? (
            <span className="ml-2 text-brand-caption font-medium text-[color:var(--dash-accent)]">
              Preferred
            </span>
          ) : null}
        </p>
        {peptide.fit ? (
          <p className="text-brand-caption mt-1 text-[color:var(--dash-muted)]">{peptide.fit}</p>
        ) : null}
        {peptide.evidence ? (
          <p className="text-brand-caption mt-1 text-[color:var(--dash-faint)]">
            Evidence: {peptide.evidence}
          </p>
        ) : null}
      </div>
      <div className="adviser-war-room-detail-actions">
        <button
          type="button"
          disabled={disabled}
          className="adviser-war-room-mini-btn"
          onClick={() => onAskAbout(peptide, "why")}
        >
          Why?
        </button>
        {canCompare ? (
          <button
            type="button"
            disabled={disabled}
            className="adviser-war-room-mini-btn"
            onClick={() => onAskAbout(peptide, "compare")}
          >
            Compare
          </button>
        ) : null}
        <button
          type="button"
          disabled={disabled}
          className="adviser-war-room-mini-btn"
          onClick={() => onAskAbout(peptide, "safety")}
        >
          Safety
        </button>
        {isPreferred ? (
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
            onClick={() => onPrefer(peptide.name)}
          >
            Choose
          </button>
        )}
      </div>
    </div>
  );
}
