"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type PaginationControlsProps = {
  page: number;
  hasNext: boolean;
  hasPrevious: boolean;
  total: number;
  loading?: boolean;
  onPrevious: () => void;
  onNext: () => void;
};

export function PaginationControls({
  page,
  hasNext,
  hasPrevious,
  total,
  loading,
  onPrevious,
  onNext,
}: PaginationControlsProps) {
  return (
    <div className="mt-5 flex flex-col gap-3 border-t border-[color:var(--dash-surface-border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-brand-caption text-[color:var(--dash-faint)]">
        {total} total · Page {page}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
        <button
          type="button"
          disabled={!hasPrevious || loading}
          onClick={onPrevious}
          className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50"
        >
          Previous
        </button>
        <button
          type="button"
          disabled={!hasNext || loading}
          onClick={onNext}
          className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export function UserLink({ userId, label }: { userId: string; label: string }) {
  return (
    <Link
      href={`/admin/users/${encodeURIComponent(userId)}`}
      className="font-sans font-semibold text-[color:var(--dash-text)] underline-offset-2 transition hover:text-[color:var(--dash-accent)] hover:underline"
    >
      {label}
    </Link>
  );
}

export function StatPill({ label, value }: { label: React.ReactNode; value: string }) {
  return (
    <div className="dashboard-glass-card min-w-0 overflow-hidden rounded-2xl px-3.5 py-3 sm:px-4 sm:py-4">
      <p className="text-brand-caption break-words font-medium text-[color:var(--dash-faint)]">{label}</p>
      <p className="font-sans mt-1 break-words text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl">
        {value}
      </p>
    </div>
  );
}

/** Labeled data cell used inside user directory cards. */
export function DataField({
  label,
  value,
  className,
}: {
  label: string;
  value: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0 overflow-hidden", className)}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
        {label}
      </p>
      <div className="font-sans mt-1 break-words text-sm font-medium text-[color:var(--dash-text)] [overflow-wrap:anywhere]">
        {value ?? "—"}
      </div>
    </div>
  );
}

export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "warn" | "muted";
}) {
  const toneClass =
    tone === "accent"
      ? "bg-[#DDE466]/25 text-[color:var(--dash-accent)]"
      : tone === "warn"
        ? "bg-amber-500/15 text-amber-700"
        : tone === "muted"
          ? "bg-[color:var(--dash-soft)] text-[color:var(--dash-faint)]"
          : "bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)]";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${toneClass}`}
    >
      {children}
    </span>
  );
}

export function DirectoryListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)]/40 p-4 sm:p-5"
        >
          <div className="flex items-center gap-3">
            <span className="dashboard-skeleton-block h-12 w-12 shrink-0 rounded-2xl" />
            <div className="min-w-0 flex-1 space-y-2">
              <span className="dashboard-skeleton-block block h-4 w-40 rounded-full" />
              <span className="dashboard-skeleton-block block h-3 w-56 rounded-full" />
            </div>
            <span className="dashboard-skeleton-block hidden h-9 w-24 rounded-full sm:block" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, field) => (
              <div key={field} className="space-y-2">
                <span className="dashboard-skeleton-block block h-2.5 w-14 rounded-full" />
                <span className="dashboard-skeleton-block block h-3.5 w-24 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
