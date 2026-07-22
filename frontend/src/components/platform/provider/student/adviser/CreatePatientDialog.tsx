"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { authFieldClass, authLabelClass } from "@/components/platform/auth/auth-styles";
import { cn } from "@/lib/utils";

type CreatePatientDialogProps = {
  open: boolean;
  defaultName: string;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (displayName: string) => void;
};

export function CreatePatientDialog({
  open,
  defaultName,
  isSubmitting = false,
  error = null,
  onClose,
  onSubmit,
}: CreatePatientDialogProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (!open) return;
    setName(defaultName);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [defaultName, open]);

  if (!open) return null;

  const canSubmit = Boolean(name.trim()) && !isSubmitting;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 px-4 py-6">
      <button
        type="button"
        aria-label="Close create patient dialog"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-[color:var(--dash-surface-border)] bg-[color:var(--portal-surface)] shadow-[0_24px_64px_rgba(21,39,68,0.22)]"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed || isSubmitting) return;
          onSubmit(trimmed);
        }}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[color:var(--dash-surface-border)] px-5 py-4 md:px-6">
          <div className="min-w-0">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Peptide adviser
            </p>
            <h2
              id={titleId}
              className="font-sans mt-1 text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)]"
            >
              New patient
            </h2>
            <p className="text-brand-body mt-1 text-[color:var(--dash-muted)]">
              Enter a case name to start structured intake.
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
            aria-label="Close dialog"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4 px-5 py-5 md:px-6">
          <label className="block space-y-2">
            <span className={authLabelClass}>Patient name</span>
            <input
              ref={inputRef}
              type="text"
              required
              maxLength={120}
              value={name}
              disabled={isSubmitting}
              placeholder="e.g. Patient A"
              onChange={(event) => setName(event.target.value)}
              className={cn(authFieldClass, "w-full px-4")}
            />
          </label>

          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        </div>

        <div className="flex justify-end gap-2.5 border-t border-[color:var(--dash-surface-border)] px-5 py-4 md:px-6">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2.5" />
                  <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                Creating…
              </span>
            ) : (
              "Create patient"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
