"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { Icon, Loader2, X } from "@/components/icons";

export type CreateAffiliateFormValues = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  margin_percent: string;
  invitation_quota: string;
};

const emptyForm: CreateAffiliateFormValues = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  margin_percent: "",
  invitation_quota: "",
};

type CreateAffiliateDialogProps = {
  open: boolean;
  isSubmitting?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (values: CreateAffiliateFormValues) => void;
};

function isValidMargin(value: string) {
  const margin = Number(value);
  return value.trim() !== "" && Number.isFinite(margin) && margin > 0 && margin < 100;
}

export function CreateAffiliateDialog({
  open,
  isSubmitting = false,
  error = null,
  onClose,
  onSubmit,
}: CreateAffiliateDialogProps) {
  const titleId = useId();
  const firstNameRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<CreateAffiliateFormValues>(emptyForm);

  useEffect(() => {
    if (!open) return;
    setForm(emptyForm);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setTimeout(() => firstNameRef.current?.focus(), 30);
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

  const marginValid = isValidMargin(form.margin_percent);
  const canSubmit =
    Boolean(form.first_name.trim()) &&
    Boolean(form.last_name.trim()) &&
    Boolean(form.email.trim()) &&
    marginValid &&
    !isSubmitting;

  return createPortal(
    <div className="adviser-dialog-overlay fixed inset-0 z-[80] flex items-center justify-center bg-black/45 px-3 py-4 sm:px-4 sm:py-6 max-sm:items-end max-sm:px-0 max-sm:py-0">
      <button
        type="button"
        aria-label="Close create affiliate dialog"
        className="absolute inset-0 cursor-default"
        onClick={() => {
          if (!isSubmitting) onClose();
        }}
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="adviser-dialog-panel relative z-10 flex max-h-[min(92svh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-2xl max-sm:h-[min(96svh,40rem)] max-sm:max-h-none max-sm:rounded-b-none max-sm:rounded-t-3xl max-sm:pb-[env(safe-area-inset-bottom)]"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;
          onSubmit({
            ...form,
            first_name: form.first_name.trim(),
            last_name: form.last_name.trim(),
            email: form.email.trim(),
            password: form.password.trim(),
            margin_percent: form.margin_percent.trim(),
            invitation_quota: form.invitation_quota.trim(),
          });
        }}
      >
        <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[color:var(--dash-dim)] sm:hidden" aria-hidden />

        <div className="flex items-start justify-between gap-3 border-b border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:gap-4 sm:px-5 sm:py-4 md:px-6">
          <div className="min-w-0">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Affiliates
            </p>
            <h2
              id={titleId}
              className="font-sans mt-1 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl"
            >
              New affiliate
            </h2>
            <p className="text-brand-body mt-1 text-sm text-[color:var(--dash-muted)] sm:text-base">
              Invite code is generated and sent with the credentials email.
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full disabled:opacity-50"
            aria-label="Close dialog"
          >
            <Icon icon={X} size={16} strokeWidth={2} />
          </button>
        </div>

        <div className="min-h-0 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5 md:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid min-w-0 gap-2">
              <span className="dashboard-field-label">First name</span>
              <input
                ref={firstNameRef}
                type="text"
                required
                autoComplete="given-name"
                disabled={isSubmitting}
                value={form.first_name}
                placeholder="e.g. Jordan"
                onChange={(event) => setForm((prev) => ({ ...prev, first_name: event.target.value }))}
                className="dashboard-field"
              />
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="dashboard-field-label">Last name</span>
              <input
                type="text"
                required
                autoComplete="family-name"
                disabled={isSubmitting}
                value={form.last_name}
                placeholder="e.g. Lee"
                onChange={(event) => setForm((prev) => ({ ...prev, last_name: event.target.value }))}
                className="dashboard-field"
              />
            </label>
          </div>

          <label className="grid min-w-0 gap-2">
            <span className="dashboard-field-label">Email</span>
            <input
              type="email"
              required
              autoComplete="email"
              disabled={isSubmitting}
              value={form.email}
              placeholder="partner@example.com"
              onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
              className="dashboard-field"
            />
          </label>

          <label className="grid min-w-0 gap-2">
            <span className="dashboard-field-label">Password</span>
            <input
              type="password"
              minLength={8}
              autoComplete="new-password"
              disabled={isSubmitting}
              value={form.password}
              placeholder="Leave blank to auto-generate"
              onChange={(event) => setForm((prev) => ({ ...prev, password: event.target.value }))}
              className="dashboard-field"
            />
            <span className="text-brand-caption text-[color:var(--dash-faint)]">
              Optional · minimum 8 characters if set
            </span>
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid min-w-0 gap-2">
              <span className="dashboard-field-label">Margin %</span>
              <input
                type="number"
                required
                min={0.01}
                max={99.99}
                step={0.01}
                disabled={isSubmitting}
                aria-invalid={!marginValid && form.margin_percent.trim() !== ""}
                value={form.margin_percent}
                placeholder="e.g. 10"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, margin_percent: event.target.value }))
                }
                className="dashboard-field adviser-number-field"
              />
              {!marginValid && form.margin_percent.trim() !== "" ? (
                <span className="text-brand-caption font-medium text-red-600">
                  Must be greater than 0 and less than 100.
                </span>
              ) : (
                <span className="text-brand-caption text-[color:var(--dash-faint)]">
                  Required · between 0 and 100
                </span>
              )}
            </label>

            <label className="grid min-w-0 gap-2">
              <span className="dashboard-field-label">Invitation quota</span>
              <input
                type="number"
                min={0}
                disabled={isSubmitting}
                value={form.invitation_quota}
                placeholder="Unlimited if blank"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, invitation_quota: event.target.value }))
                }
                className="dashboard-field adviser-number-field"
              />
              <span className="text-brand-caption text-[color:var(--dash-faint)]">
                Optional · leave blank for unlimited
              </span>
            </label>
          </div>

          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-[color:var(--dash-surface-border)] px-4 py-3.5 sm:flex-row sm:justify-end sm:gap-2.5 sm:px-5 sm:py-4 md:px-6">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 sm:w-auto"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Icon icon={Loader2} size={16} className="animate-spin" />
                Creating…
              </span>
            ) : (
              "Create affiliate"
            )}
          </button>
        </div>
      </form>
    </div>,
    document.body,
  );
}
