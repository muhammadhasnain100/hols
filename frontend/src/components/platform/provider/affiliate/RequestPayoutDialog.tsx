"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { authFieldClass, authLabelClass } from "@/components/platform/auth/auth-styles";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { formatMoney } from "@/lib/integrate/provider/student/payment/types";
import { cn } from "@/lib/utils";

type RequestPayoutDialogProps = {
  open: boolean;
  available: number;
  currency: string;
  lockDays: number;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (amount?: number) => void;
};

export function RequestPayoutDialog({
  open,
  available,
  currency,
  lockDays,
  isSubmitting = false,
  error = null,
  onClose,
  onSubmit,
}: RequestPayoutDialogProps) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [amountDraft, setAmountDraft] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmountDraft("");
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
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !isSubmitting) onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [isSubmitting, onClose, open]);

  if (!open || typeof document === "undefined") return null;

  const trimmed = amountDraft.trim();
  const parsed = trimmed ? Number(trimmed) : undefined;
  const invalidAmount = Boolean(trimmed) && (Number.isNaN(parsed) || (parsed ?? 0) <= 0);
  const exceedsAvailable = parsed != null && parsed > available;
  const canSubmit = available > 0 && !isSubmitting && !invalidAmount && !exceedsAvailable;

  return createPortal(
    <div className="adviser-dialog-overlay adviser-dialog-overlay--center fixed inset-0 z-[80] flex min-h-dvh items-center justify-center bg-black/45 px-[max(0.75rem,env(safe-area-inset-left))] py-[max(1rem,env(safe-area-inset-top),env(safe-area-inset-bottom))] pr-[max(0.75rem,env(safe-area-inset-right))] sm:px-4 sm:py-6">
      <button
        type="button"
        aria-label="Close request payout dialog"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="adviser-dialog-panel adviser-dialog-panel--center relative z-10 flex max-h-[min(88svh,36rem)] w-full max-w-md min-w-0 flex-col overflow-hidden rounded-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;
          onSubmit(parsed);
        }}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 md:px-6">
          <div className="min-w-0 flex-1">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Payout
            </p>
            <h2
              id={titleId}
              className="font-sans mt-1 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl"
            >
              Request payout
            </h2>
            <p className="text-brand-body mt-1 text-sm text-[color:var(--dash-muted)] sm:text-base">
              Available {formatMoney(available, currency)}. Leave amount blank to request the full
              balance.
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="adviser-onboarding-close inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50 sm:h-12 sm:w-12"
            aria-label="Close request payout"
          >
            <SidebarSvgIcon name="cross" size={24} strokeWidth={2.2} className="sm:hidden" />
            <SidebarSvgIcon name="cross" size={28} strokeWidth={2.15} className="hidden sm:block" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5 md:px-6">
          <label className="grid gap-2">
            <span className={authLabelClass}>Amount ({currency})</span>
            <input
              ref={inputRef}
              type="number"
              min={0}
              step="0.01"
              inputMode="decimal"
              value={amountDraft}
              disabled={isSubmitting || available <= 0}
              placeholder={String(available)}
              autoComplete="off"
              onChange={(event) => setAmountDraft(event.target.value)}
              className={cn(authFieldClass, "adviser-field adviser-number-field px-4")}
            />
          </label>
          <p className="text-brand-caption text-[color:var(--dash-faint)]">
            {lockDays === 0
              ? "New commission is available immediately."
              : `New commission is held for ${lockDays} day${lockDays === 1 ? "" : "s"}, then an hourly check moves it into available.`}
          </p>
          {invalidAmount ? <AuthAlert variant="error">Enter an amount greater than 0.</AuthAlert> : null}
          {exceedsAvailable ? (
            <AuthAlert variant="error">
              Amount exceeds available {formatMoney(available, currency)}.
            </AuthAlert>
          ) : null}
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
                Sending request…
              </>
            ) : (
              <>
                <SidebarSvgIcon name="payment" size={15} strokeWidth={2.2} />
                Request payout
              </>
            )}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
