"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";

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
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 30);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearTimeout(timer);
    };
  }, [defaultName, open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose, open]);

  if (!open || typeof document === "undefined") return null;

  const canSubmit = Boolean(name.trim()) && !isSubmitting;

  return createPortal(
    <div className="adviser-dialog-overlay adviser-dialog-overlay--center fixed inset-0 z-[80] flex min-h-dvh items-center justify-center bg-black/45 px-[max(0.75rem,env(safe-area-inset-left))] py-[max(1rem,env(safe-area-inset-top),env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-4 sm:py-6">
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
        className="adviser-dialog-panel adviser-dialog-panel--center relative z-10 flex max-h-[min(88svh,40rem)] w-full max-w-lg min-w-0 flex-col overflow-hidden rounded-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed || isSubmitting) return;
          onSubmit(trimmed);
        }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 md:px-6">
          <div className="min-w-0">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Peptide Advisor
            </p>
            <h2
              id={titleId}
              className="font-sans mt-1 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl"
            >
              New patient
            </h2>
            <p className="text-brand-body mt-1 text-pretty text-sm text-[color:var(--dash-muted)] sm:text-base">
              Enter a case name to start structured intake.
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="adviser-onboarding-close inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50 sm:h-12 sm:w-12"
            aria-label="Close dialog"
          >
            <SidebarSvgIcon name="cross" size={24} strokeWidth={2.2} className="sm:hidden" />
            <SidebarSvgIcon name="cross" size={28} strokeWidth={2.15} className="hidden sm:block" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5 md:px-6">
          <label className="grid min-w-0 gap-2">
            <span className="dashboard-field-label">Patient name</span>
            <input
              ref={inputRef}
              type="text"
              required
              maxLength={120}
              value={name}
              disabled={isSubmitting}
              placeholder="e.g. Patient A"
              enterKeyHint="done"
              autoComplete="off"
              onChange={(event) => setName(event.target.value)}
              className="dashboard-field adviser-field"
            />
          </label>

          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-5 sm:py-4 md:px-6">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] disabled:pointer-events-none disabled:opacity-50 sm:min-h-10 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="dashboard-navy-btn font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium text-white disabled:pointer-events-none disabled:opacity-50 sm:min-h-10 sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <SidebarSvgIcon name="spinner" size={16} strokeWidth={2.5} className="animate-spin" />
                Creating…
              </>
            ) : (
              <>
                <SidebarSvgIcon name="plus" size={15} strokeWidth={2.2} />
                Create patient
              </>
            )}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
