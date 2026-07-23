"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PaymentCardPageSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { PaymentPageLayout } from "@/components/platform/provider/student/payment/PaymentPageLayout";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  addCard,
  getCard,
  getCachedCard,
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

const emptyCardForm: CardFormState = {
  card_number: "",
  exp_month: "",
  exp_year: "",
  cvc: "",
  pin: "",
  card_holder_name: "",
};

const MONTHS = [
  { value: 1, label: "Jan" },
  { value: 2, label: "Feb" },
  { value: 3, label: "Mar" },
  { value: 4, label: "Apr" },
  { value: 5, label: "May" },
  { value: 6, label: "Jun" },
  { value: 7, label: "Jul" },
  { value: 8, label: "Aug" },
  { value: 9, label: "Sep" },
  { value: 10, label: "Oct" },
  { value: 11, label: "Nov" },
  { value: 12, label: "Dec" },
] as const;

const YEAR_SPAN = 15;

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
        className="dashboard-field"
      />
    </div>
  );
}

function ExpiryCalendarPicker({
  month,
  year,
  onMonthChange,
  onYearChange,
}: {
  month: string;
  year: string;
  onMonthChange: (value: string) => void;
  onYearChange: (value: string) => void;
}) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const maxYear = currentYear + YEAR_SPAN;

  const selectedMonth = Number(month) || 0;
  const selectedYear = Number(year) || 0;

  const [open, setOpen] = useState(false);
  const [viewYear, setViewYear] = useState(selectedYear || currentYear);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  function isMonthDisabled(monthValue: number, yearValue: number) {
    if (yearValue > currentYear) return false;
    if (yearValue < currentYear) return true;
    return monthValue < currentMonth;
  }

  function openCalendar() {
    setViewYear(selectedYear || currentYear);
    setOpen((prev) => !prev);
  }

  function selectMonth(monthValue: number) {
    if (isMonthDisabled(monthValue, viewYear)) return;
    onMonthChange(String(monthValue));
    onYearChange(String(viewYear));
    setOpen(false);
  }

  const hasValue = Boolean(selectedMonth && selectedYear);
  const summary = hasValue
    ? `${MONTHS[selectedMonth - 1]?.label} ${selectedYear}`
    : "MM / YYYY";

  return (
    <div className="relative grid gap-2" ref={rootRef}>
      <label className="dashboard-field-label font-semibold" htmlFor="expiry-calendar-trigger">
        Month and year
      </label>

      <button
        id="expiry-calendar-trigger"
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        data-open={open}
        onClick={openCalendar}
        className="dashboard-expiry-trigger"
      >
        <span className="dashboard-expiry-trigger-icon" aria-hidden>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        </span>
        <span className="dashboard-expiry-trigger-value" data-empty={!hasValue}>
          {summary}
        </span>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Select month and year"
          className="dashboard-expiry-popover"
        >
          <div className="dashboard-expiry-year-row">
            <button
              type="button"
              aria-label="Previous year"
              disabled={viewYear <= currentYear}
              onClick={() => setViewYear((y) => Math.max(currentYear, y - 1))}
              className="dashboard-expiry-nav"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="m15 18-6-6 6-6" />
              </svg>
            </button>

            <span className="dashboard-expiry-year-label">{viewYear}</span>

            <button
              type="button"
              aria-label="Next year"
              disabled={viewYear >= maxYear}
              onClick={() => setViewYear((y) => Math.min(maxYear, y + 1))}
              className="dashboard-expiry-nav"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                <path d="m9 18 6-6-6-6" />
              </svg>
            </button>
          </div>

          <div className="dashboard-expiry-month-grid">
            {MONTHS.map((item) => {
              const disabled = isMonthDisabled(item.value, viewYear);
              const selected = selectedMonth === item.value && selectedYear === viewYear;
              const isCurrent = viewYear === currentYear && item.value === currentMonth;
              return (
                <button
                  key={item.value}
                  type="button"
                  disabled={disabled}
                  data-selected={selected}
                  data-current={isCurrent}
                  aria-pressed={selected}
                  onClick={() => selectMonth(item.value)}
                  className="dashboard-expiry-month-cell"
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      <input type="hidden" name="exp_month" value={month} required />
      <input type="hidden" name="exp_year" value={year} required />
    </div>
  );
}

export function StudentCardPage() {
  // Keep SSR and first client paint identical — never read session cache during render.
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);

    const month = Number(form.exp_month);
    const year = Number(form.exp_year);
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    if (!month || !year) {
      setError("Select an expiry month and year.");
      return;
    }
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
      setError("Expiry must be the current month or a future date.");
      return;
    }

    setSaving(true);

    const payload = {
      card_number: form.card_number.replace(/\s/g, ""),
      exp_month: month,
      exp_year: year,
      cvc: form.cvc,
      card_holder_name: form.card_holder_name.trim() || undefined,
      pin: form.pin.trim() || undefined,
      is_default: true,
    };

    try {
      const result = card ? await updateCard(payload) : await addCard(payload);
      setCard(result.card);
      setForm(emptyCardForm);
      setSuccess(card ? "Card updated." : "Card saved.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not save card.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PaymentPageLayout title="Payment card">
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
      {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

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
                    ? `${card.card_number_masked} · Expires ${card.exp_month}/${card.exp_year}`
                    : "Add a payment card before purchasing a membership plan."}
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5">
                <Link
                  href="/student/payment"
                  className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-[color:var(--dash-text)] transition sm:px-5"
                >
                  View plans
                </Link>
                <Link
                  href="/student/payment/orders"
                  className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-3 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:px-5"
                >
                  View orders
                </Link>
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
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
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
                        {card.exp_month}/{card.exp_year}
                      </p>
                    </div>
                  </div>
                </section>
              ) : (
                <section className="dashboard-surface flex flex-col items-center justify-center rounded-2xl px-4 py-10 text-center sm:px-5 sm:py-12">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#DDE466]/20 text-[color:var(--dash-accent)]">
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </span>
                  <p className="font-sans mt-3 text-sm font-semibold text-[color:var(--dash-text)]">
                    No card on file
                  </p>
                  <p className="text-brand-caption mt-1 max-w-[14rem] text-[color:var(--dash-faint)]">
                    Use the form to add a card for membership purchases.
                  </p>
                </section>
              )}
            </div>

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

              <form className="mt-4 grid gap-3 sm:mt-5 sm:gap-4" onSubmit={handleSubmit}>
                <DashField
                  id="card_holder_name"
                  label="Cardholder name"
                  value={form.card_holder_name}
                  onChange={(value) => setForm((prev) => ({ ...prev, card_holder_name: value }))}
                  placeholder="Name on card"
                  autoComplete="cc-name"
                />
                <DashField
                  id="card_number"
                  label="Card number"
                  value={form.card_number}
                  onChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      card_number: value.replace(/[^\d\s]/g, ""),
                    }))
                  }
                  placeholder="1234 5678 9012 3456"
                  autoComplete="cc-number"
                  inputMode="numeric"
                  required
                />

                <ExpiryCalendarPicker
                  month={form.exp_month}
                  year={form.exp_year}
                  onMonthChange={(value) => setForm((prev) => ({ ...prev, exp_month: value }))}
                  onYearChange={(value) => setForm((prev) => ({ ...prev, exp_year: value }))}
                />

                <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                  <DashField
                    id="cvc"
                    label="CVC"
                    value={form.cvc}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        cvc: value.replace(/\D/g, "").slice(0, 4),
                      }))
                    }
                    placeholder="123"
                    inputMode="numeric"
                    maxLength={4}
                    required
                  />
                  <DashField
                    id="pin"
                    label="PIN (optional)"
                    value={form.pin}
                    onChange={(value) =>
                      setForm((prev) => ({
                        ...prev,
                        pin: value.replace(/\D/g, "").slice(0, 12),
                      }))
                    }
                    placeholder="Optional"
                    inputMode="numeric"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="font-sans mt-1 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-6 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-60 sm:w-auto sm:min-w-[10rem]"
                >
                  {saving ? "Saving…" : card ? "Update card" : "Save card"}
                </button>
              </form>
            </section>
          </div>
        </>
      )}
    </PaymentPageLayout>
  );
}
