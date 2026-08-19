"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { CreditCard, Icon } from "@/components/icons";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PaymentCardPageSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { PaymentPageLayout } from "@/components/platform/provider/student/payment/PaymentPageLayout";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  addCard,
  getCard,
  getCachedCard,
  removeCard,
  updateCard,
  type PaymentCard,
} from "@/lib/integrate/provider/student/payment/api";
import { cn } from "@/lib/utils";

type CardFormState = {
  card_number: string;
  exp_month: string;
  exp_year: string;
  cvc: string;
  pin: string;
  card_holder_name: string;
};

type FieldErrors = Partial<Record<keyof CardFormState, string>>;

const emptyCardForm: CardFormState = {
  card_number: "",
  exp_month: "",
  exp_year: "",
  cvc: "",
  pin: "",
  card_holder_name: "",
};

const CARDHOLDER_MAX = 80;

function DashField({
  id,
  label,
  value,
  onChange,
  placeholder,
  autoComplete,
  required = false,
  inputMode,
  maxLength,
  error,
  pattern,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoComplete?: string;
  required?: boolean;
  inputMode?: "text" | "numeric" | "tel" | "search" | "email" | "url" | "decimal" | "none";
  maxLength?: number;
  error?: string;
  pattern?: string;
}) {
  return (
    <div className="grid gap-2">
      <label htmlFor={id} className="dashboard-field-label">
        {label}
      </label>
      <input
        id={id}
        name={id}
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
        inputMode={inputMode}
        maxLength={maxLength}
        pattern={pattern}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn("dashboard-field", error && "border-[color:var(--dash-danger,#c45c5c)]")}
      />
      {error ? (
        <p id={`${id}-error`} className="text-brand-caption text-[color:var(--dash-danger,#b42318)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function validateForm(form: CardFormState): FieldErrors {
  const errors: FieldErrors = {};
  const digits = form.card_number.replace(/\s/g, "");
  const month = Number(form.exp_month);
  const year = Number(form.exp_year);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (form.card_holder_name.trim().length > CARDHOLDER_MAX) {
    errors.card_holder_name = `Name must be ${CARDHOLDER_MAX} characters or fewer.`;
  }

  if (!digits) {
    errors.card_number = "Enter your card number.";
  } else if (!/^\d{12,19}$/.test(digits)) {
    errors.card_number = "Card number must be 12–19 digits.";
  }

  if (!form.exp_month.trim()) {
    errors.exp_month = "Enter the expiry month.";
  } else if (!Number.isInteger(month) || month < 1 || month > 12) {
    errors.exp_month = "Month must be between 01 and 12.";
  }

  if (!form.exp_year.trim()) {
    errors.exp_year = "Enter the expiry year.";
  } else if (!Number.isInteger(year) || year < currentYear || year > 2100) {
    errors.exp_year = "Enter a valid 4-digit year.";
  } else if (
    !errors.exp_month &&
    (year < currentYear || (year === currentYear && month < currentMonth))
  ) {
    errors.exp_month = "Expiry must be this month or later.";
  }

  if (!/^\d{3,4}$/.test(form.cvc)) {
    errors.cvc = "CVC must be 3 or 4 digits.";
  }

  if (form.pin.trim() && !/^\d{4,6}$/.test(form.pin.trim())) {
    errors.pin = "PIN must be 4 to 6 digits if provided.";
  }

  return errors;
}

export function StudentCardPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [card, setCard] = useState<PaymentCard | null>(null);
  const [form, setForm] = useState<CardFormState>(emptyCardForm);

  const loadCard = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const res = await getCard(signal);
      if (!signal?.aborted) setCard(res.card);
    } catch (err) {
      if (signal?.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      if (err instanceof ApiRequestError && err.status === 404) {
        setCard(null);
      } else {
        setError(err instanceof ApiRequestError ? err.message : "Failed to load card.");
      }
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const cachedCard = getCachedCard();
    if (cachedCard !== undefined) {
      setCard(cachedCard ?? null);
      setLoading(false);
    }
    const timer = window.setTimeout(() => void loadCard(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadCard]);

  useEffect(() => {
    setShowForm(!card);
  }, [card]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const nextErrors = validateForm(form);
    setFieldErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      setError("Please fix the highlighted fields.");
      return;
    }

    setSaving(true);

    const payload = {
      card_number: form.card_number.replace(/\s/g, ""),
      exp_month: Number(form.exp_month),
      exp_year: Number(form.exp_year),
      cvc: form.cvc,
      card_holder_name: form.card_holder_name.trim() || undefined,
      pin: form.pin.trim() || undefined,
      is_default: true,
    };

    try {
      const result = card ? await updateCard(payload) : await addCard(payload);
      setCard(result.card);
      setForm(emptyCardForm);
      setFieldErrors({});
      setShowForm(false);
      setSuccess(card ? "Card updated." : "Card saved.");
    } catch (err) {
      setError(
        err instanceof ApiRequestError
          ? err.message
          : "Could not save card. Check your details and try again.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove() {
    if (!card) return;
    const confirmed = window.confirm("Remove the saved payment card from this account?");
    if (!confirmed) return;

    setRemoving(true);
    setError(null);
    setSuccess(null);
    try {
      await removeCard();
      setCard(null);
      setForm(emptyCardForm);
      setFieldErrors({});
      setShowForm(true);
      setSuccess("Card removed.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not remove card.");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <PaymentPageLayout title="Payment card">
      {loading ? (
        <PaymentCardPageSkeleton />
      ) : (
        <>
          <section className="dashboard-hero relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                  Billing card
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
                  <span className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                    {card ? "Card on file" : "No card"}
                  </span>
                  <span
                    className={cn(
                      "mb-0.5 inline-flex rounded-full px-2.5 py-0.5 text-brand-caption font-semibold",
                      card
                        ? "bg-[#DDE466]/25 text-[color:var(--dash-accent)]"
                        : "bg-[color:var(--dash-soft)] text-[color:var(--dash-faint)]",
                    )}
                  >
                    {card ? "Ready" : "Required"}
                  </span>
                </div>
                <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">
                  {card
                    ? `${card.card_number_masked} · Expires ${String(card.exp_month).padStart(2, "0")}/${card.exp_year}`
                    : "Add a payment card before purchasing a membership plan."}
                </p>
                {error ? (
                  <div className="mt-3 max-w-xl">
                    <AuthAlert variant="error">{error}</AuthAlert>
                  </div>
                ) : null}
                {success ? (
                  <div className="mt-3 max-w-xl">
                    <AuthAlert variant="success">{success}</AuthAlert>
                  </div>
                ) : null}
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5">
                <Link
                  href="/student/payment"
                  className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-[color:var(--dash-text)] transition sm:px-5"
                >
                  View plans
                </Link>
                {!card ? (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(true);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-3 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:px-5"
                  >
                    Add card
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(true);
                      setError(null);
                      setSuccess(null);
                    }}
                    className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-3 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:px-5"
                  >
                    Update card
                  </button>
                )}
              </div>
            </div>
          </section>

          <div className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
            <div className="order-2 flex min-w-0 flex-col gap-3 sm:gap-4 lg:order-1">
              {card ? (
                <section className="dashboard-plan-card relative overflow-hidden rounded-2xl p-4 text-[#152744] sm:p-5 md:p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[#152744]/70">
                      Saved card
                    </span>
                    <Icon icon={CreditCard} size={28} strokeWidth={1.6} />
                  </div>
                  <p className="font-sans mt-6 text-lg font-bold tracking-[0.08em] sm:mt-8 sm:text-xl md:text-2xl">
                    {card.card_number_masked}
                  </p>
                  <div className="mt-4 flex items-end justify-between gap-3 sm:mt-5">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#152744]/55">
                        Cardholder
                      </p>
                      <p className="font-sans mt-0.5 truncate text-sm font-semibold">
                        {card.card_holder_name || "—"}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#152744]/55">
                        Expires
                      </p>
                      <p className="font-sans mt-0.5 text-sm font-semibold">
                        {String(card.exp_month).padStart(2, "0")}/{card.exp_year}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleRemove()}
                    disabled={removing}
                    className="font-sans mt-5 inline-flex min-h-10 items-center justify-center rounded-full border border-[#152744]/25 px-4 text-sm font-medium text-[#152744] transition hover:bg-[#152744]/08 disabled:opacity-60"
                  >
                    {removing ? "Removing…" : "Remove card"}
                  </button>
                </section>
              ) : (
                <section className="dashboard-surface flex flex-col items-center justify-center rounded-2xl px-4 py-10 text-center sm:px-5 sm:py-12">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DDE466]/20 text-[color:var(--dash-accent)]">
                    <Icon icon={CreditCard} size={22} strokeWidth={1.7} />
                  </span>
                  <p className="font-sans mt-3 text-sm font-semibold text-[color:var(--dash-text)]">
                    No card on file
                  </p>
                  <p className="text-brand-caption mt-1 max-w-[14rem] text-[color:var(--dash-faint)]">
                    Use Add card to save a card for membership purchases.
                  </p>
                </section>
              )}
            </div>

            {showForm ? (
              <section className="dashboard-surface order-1 min-w-0 rounded-2xl p-4 sm:p-5 md:p-6 lg:order-2">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                  Card details
                </p>
                <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg md:text-xl">
                  {card ? "Update payment card" : "Add payment card"}
                </h2>
                <p className="text-brand-body mt-1 text-[color:var(--dash-muted)]">
                  One card per account. Required to purchase membership.
                </p>

                <form className="mt-4 grid gap-3 sm:mt-5 sm:gap-4" onSubmit={handleSubmit} noValidate>
                  <DashField
                    id="card_holder_name"
                    label="Cardholder name"
                    value={form.card_holder_name}
                    onChange={(value) => {
                      setForm((prev) => ({
                        ...prev,
                        card_holder_name: value.slice(0, CARDHOLDER_MAX),
                      }));
                      setFieldErrors((prev) => ({ ...prev, card_holder_name: undefined }));
                    }}
                    placeholder="Name on card"
                    autoComplete="cc-name"
                    maxLength={CARDHOLDER_MAX}
                    error={fieldErrors.card_holder_name}
                  />
                  <DashField
                    id="card_number"
                    label="Card number"
                    value={form.card_number}
                    onChange={(value) => {
                      setForm((prev) => ({
                        ...prev,
                        card_number: value.replace(/[^\d\s]/g, "").slice(0, 23),
                      }));
                      setFieldErrors((prev) => ({ ...prev, card_number: undefined }));
                    }}
                    placeholder="1234 5678 9012 3456"
                    autoComplete="cc-number"
                    inputMode="numeric"
                    required
                    error={fieldErrors.card_number}
                  />

                  <div className="grid gap-2">
                    <span className="dashboard-field-label">Expiry (MM / YYYY)</span>
                    <div className="grid grid-cols-[minmax(0,5.5rem)_minmax(0,1fr)] gap-3">
                      <div className="grid gap-2">
                        <input
                          id="exp_month"
                          name="exp_month"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-exp-month"
                          placeholder="MM"
                          maxLength={2}
                          value={form.exp_month}
                          aria-invalid={Boolean(fieldErrors.exp_month)}
                          aria-describedby={fieldErrors.exp_month ? "exp_month-error" : undefined}
                          onChange={(event) => {
                            setForm((prev) => ({
                              ...prev,
                              exp_month: event.target.value.replace(/\D/g, "").slice(0, 2),
                            }));
                            setFieldErrors((prev) => ({ ...prev, exp_month: undefined }));
                          }}
                          className={cn(
                            "dashboard-field",
                            fieldErrors.exp_month && "border-[color:var(--dash-danger,#c45c5c)]",
                          )}
                          required
                        />
                      </div>
                      <div className="grid gap-2">
                        <input
                          id="exp_year"
                          name="exp_year"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-exp-year"
                          placeholder="YYYY"
                          maxLength={4}
                          value={form.exp_year}
                          aria-invalid={Boolean(fieldErrors.exp_year)}
                          aria-describedby={fieldErrors.exp_year ? "exp_year-error" : undefined}
                          onChange={(event) => {
                            setForm((prev) => ({
                              ...prev,
                              exp_year: event.target.value.replace(/\D/g, "").slice(0, 4),
                            }));
                            setFieldErrors((prev) => ({ ...prev, exp_year: undefined }));
                          }}
                          className={cn(
                            "dashboard-field",
                            fieldErrors.exp_year && "border-[color:var(--dash-danger,#c45c5c)]",
                          )}
                          required
                        />
                      </div>
                    </div>
                    {fieldErrors.exp_month || fieldErrors.exp_year ? (
                      <p
                        id={fieldErrors.exp_month ? "exp_month-error" : "exp_year-error"}
                        className="text-brand-caption text-[color:var(--dash-danger,#b42318)]"
                      >
                        {fieldErrors.exp_month || fieldErrors.exp_year}
                      </p>
                    ) : null}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                    <DashField
                      id="cvc"
                      label="CVC"
                      value={form.cvc}
                      onChange={(value) => {
                        setForm((prev) => ({
                          ...prev,
                          cvc: value.replace(/\D/g, "").slice(0, 4),
                        }));
                        setFieldErrors((prev) => ({ ...prev, cvc: undefined }));
                      }}
                      placeholder="123"
                      inputMode="numeric"
                      maxLength={4}
                      required
                      error={fieldErrors.cvc}
                    />
                    <DashField
                      id="pin"
                      label="PIN (optional)"
                      value={form.pin}
                      onChange={(value) => {
                        setForm((prev) => ({
                          ...prev,
                          pin: value.replace(/\D/g, "").slice(0, 6),
                        }));
                        setFieldErrors((prev) => ({ ...prev, pin: undefined }));
                      }}
                      placeholder="4–6 digits"
                      inputMode="numeric"
                      maxLength={6}
                      error={fieldErrors.pin}
                    />
                  </div>

                  <div className="mt-1 flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={saving}
                      className="font-sans inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-6 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-60 sm:min-w-[10rem]"
                    >
                      {saving ? "Saving…" : card ? "Save updated card" : "Add card"}
                    </button>
                    {card ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowForm(false);
                          setForm(emptyCardForm);
                          setFieldErrors({});
                          setError(null);
                        }}
                        className="dashboard-pill-soft font-sans inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)]"
                      >
                        Cancel
                      </button>
                    ) : null}
                  </div>
                </form>
              </section>
            ) : (
              <section className="dashboard-surface order-1 hidden min-w-0 rounded-2xl p-4 sm:p-5 md:p-6 lg:order-2 lg:block">
                <p className="text-brand-body text-[color:var(--dash-muted)]">
                  Your card is ready for membership purchases. Choose Update card to replace it, or
                  Remove card on the left to delete it.
                </p>
              </section>
            )}
          </div>
        </>
      )}
    </PaymentPageLayout>
  );
}
