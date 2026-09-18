"use client";

import { useEffect, useState } from "react";
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
  selectedName?: string | null;
  onSelectPeptide?: (name: string) => void;
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
  selectedName,
  onSelectPeptide,
}: RecommendationWarRoomProps) {
  const ranked = board.ranked ?? [];
  const preferredName = board.preferred || ranked[0]?.name || null;
  const [internalSelected, setInternalSelected] = useState<string | null>(preferredName);
  const activeName = selectedName ?? internalSelected ?? preferredName;

  useEffect(() => {
    if (selectedName == null) setInternalSelected(preferredName);
  }, [preferredName, selectedName]);

  const selectPeptide = (name: string) => {
    setInternalSelected(name);
    onSelectPeptide?.(name);
  };

  const selected =
    ranked.find((item) => item.name === activeName) ??
    ranked.find((item) => item.name === preferredName) ??
    ranked[0];
  const others = ranked.filter((item) => item.name !== selected?.name);
  const confidence = (board.confidence as BoardConfidence) || "balanced";

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
                ) : (
                  <span className="text-brand-caption font-medium text-[color:var(--dash-faint)]">
                    Current peptide
                  </span>
                )}
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
              onClick={() => {
                selectPeptide(selected.name);
                onAskAbout(selected, "why");
              }}
            >
              Why?
            </button>
            {ranked.length >= 2 ? (
              <button
                type="button"
                disabled={disabled}
                className="adviser-war-room-mini-btn"
                onClick={() => {
                  selectPeptide(selected.name);
                  onAskAbout(selected, "compare");
                }}
              >
                Compare
              </button>
            ) : null}
            <button
              type="button"
              disabled={disabled}
              className="adviser-war-room-mini-btn"
              onClick={() => {
                selectPeptide(selected.name);
                onAskAbout(selected, "safety");
              }}
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
                onClick={() => {
                  selectPeptide(selected.name);
                  onPrefer(selected.name);
                }}
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

      {others.length > 0 ? (
        <div className="adviser-board-list" aria-label="Also ranked">
          <p className="text-brand-caption mb-2 font-medium uppercase tracking-[0.06em] text-[color:var(--dash-faint)]">
            Also ranked
          </p>
          {others.map((peptide) => (
            <button
              key={peptide.name}
              type="button"
              disabled={disabled}
              onClick={() => selectPeptide(peptide.name)}
              className={cn(
                "adviser-board-row",
                activeName === peptide.name && "is-selected",
                board.preferred === peptide.name && "is-preferred",
              )}
            >
              <span className="adviser-board-row-rank">#{peptide.rank}</span>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate font-semibold text-[color:var(--dash-text)]">
                  {peptide.name}
                </span>
                {peptide.evidence ? (
                  <span className="text-brand-caption mt-0.5 block truncate text-[color:var(--dash-muted)]">
                    {peptide.evidence}
                  </span>
                ) : null}
              </span>
            </button>
          ))}
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
