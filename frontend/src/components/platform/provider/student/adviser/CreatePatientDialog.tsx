"use client";

import { useEffect, useId, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { authFieldClass, authLabelClass } from "@/components/platform/auth/auth-styles";
import {
  portalSectionDescClass,
  portalSectionTitleClass,
} from "@/components/platform/provider/portal-styles";
import { Button } from "@/components/ui/Button";
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
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (open) {
      setName(defaultName);
    }
  }, [defaultName, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
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
        className="relative z-10 w-full max-w-md rounded-2xl border border-black/[0.06] bg-white p-6 shadow-2xl"
        onSubmit={(event) => {
          event.preventDefault();
          const trimmed = name.trim();
          if (!trimmed || isSubmitting) return;
          onSubmit(trimmed);
        }}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className={portalSectionTitleClass}>
              New patient
            </h2>
            <p className={portalSectionDescClass}>
              Enter a name for this case. You can run intake and chat separately for each patient.
            </p>
          </div>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="rounded-md p-1.5 text-primary/40 transition hover:bg-black/[0.04] hover:text-primary disabled:opacity-50"
            aria-label="Close dialog"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <label className="block space-y-2">
          <span className={authLabelClass}>Patient name</span>
          <input
            type="text"
            required
            autoFocus
            maxLength={120}
            value={name}
            disabled={isSubmitting}
            placeholder="e.g. Patient A"
            onChange={(event) => setName(event.target.value)}
            className={cn(authFieldClass, "w-full px-4")}
          />
        </label>

        {error ? (
          <div className="mt-4">
            <AuthAlert variant="error">{error}</AuthAlert>
          </div>
        ) : null}

        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="secondary" disabled={isSubmitting} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !name.trim()}>
            {isSubmitting ? "Creating…" : "Create patient"}
          </Button>
        </div>
      </form>
    </div>
  );
}
