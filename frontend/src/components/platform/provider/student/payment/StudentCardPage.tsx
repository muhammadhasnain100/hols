"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { AuthField } from "@/components/platform/auth/AuthField";
import { authFieldClass, authLabelClass } from "@/components/platform/auth/auth-styles";
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

export function StudentCardPage() {
  const cachedCard = getCachedCard();
  const [loading, setLoading] = useState(cachedCard === undefined);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [card, setCard] = useState<PaymentCard | null>(cachedCard ?? null);
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
        <div className="dashboard-surface rounded-2xl p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-[color:var(--dash-soft)]" />
        </div>
      ) : (
        <>
          <section className="dashboard-hero relative overflow-hidden rounded-2xl p-5 md:p-6">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
              Billing card
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <span className="font-sans text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-[2.25rem] md:leading-none">
                {card ? "Card on file" : "No card"}
              </span>
              <span className="mb-1 text-brand-caption font-medium text-[color:var(--dash-faint)]">
                {card ? "Ready for purchases" : "Required for membership"}
              </span>
            </div>
            <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">
              {card
                ? `${card.card_number_masked} · Expires ${card.exp_month}/${card.exp_year}`
                : "Add a payment card before purchasing a plan."}
            </p>

            <div className="mt-5 flex flex-wrap gap-2.5">
              <Link
                href="/student/payment"
                className="font-sans inline-flex min-h-10 items-center gap-1.5 rounded-full bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105"
              >
                View plans
              </Link>
              <Link
                href="/student/payment/orders"
                className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center gap-1.5 rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition"
              >
                Orders
              </Link>
            </div>
          </section>

          <div className="grid w-full items-start gap-4 lg:grid-cols-[1fr_1.25fr]">
            <div className="flex flex-col gap-4">
              {card ? (
                <section className="dashboard-plan-card relative overflow-hidden rounded-2xl p-5 text-[#152744] md:p-6">
                  <div className="flex items-center justify-between">
                    <span className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[#152744]/70">
                      Saved card
                    </span>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                      <rect x="2" y="5" width="20" height="14" rx="2" />
                      <path d="M2 10h20" />
                    </svg>
                  </div>
                  <p className="font-sans mt-8 text-xl font-bold tracking-[0.08em] md:text-2xl">
                    {card.card_number_masked}
                  </p>
                  <div className="mt-5 flex items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#152744]/55">
                        Cardholder
                      </p>
                      <p className="font-sans mt-0.5 truncate text-sm font-semibold">
                        {card.card_holder_name || "—"}
                      </p>
                    </div>
                    <div className="text-right">
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
                <section className="dashboard-surface flex flex-col items-center justify-center rounded-2xl px-5 py-12 text-center">
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

            <section className="dashboard-surface rounded-2xl p-5 md:p-6">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                Card details
              </p>
              <h2 className="font-sans mt-1 text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)] md:text-xl">
                {card ? "Update payment card" : "Add payment card"}
              </h2>
              <p className="text-brand-body mt-1 text-[color:var(--dash-muted)]">
                One card per account. Required to purchase membership.
              </p>

              <form className="mt-5 grid gap-4" onSubmit={handleSubmit}>
                <AuthField
                  id="card_holder_name"
                  label="Cardholder name"
                  value={form.card_holder_name}
                  onChange={(value) => setForm((prev) => ({ ...prev, card_holder_name: value }))}
                  placeholder="Name on card"
                  autoComplete="cc-name"
                />
                <AuthField
                  id="card_number"
                  label="Card number"
                  value={form.card_number}
                  onChange={(value) => setForm((prev) => ({ ...prev, card_number: value }))}
                  placeholder="1234 5678 9012 3456"
                  autoComplete="cc-number"
                  required
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <label htmlFor="exp_month" className={authLabelClass}>
                      Expiry month
                    </label>
                    <input
                      id="exp_month"
                      required
                      type="number"
                      min={1}
                      max={12}
                      placeholder="MM"
                      value={form.exp_month}
                      onChange={(e) => setForm((prev) => ({ ...prev, exp_month: e.target.value }))}
                      className={cn(authFieldClass, "px-4")}
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="exp_year" className={authLabelClass}>
                      Expiry year
                    </label>
                    <input
                      id="exp_year"
                      required
                      type="number"
                      min={2024}
                      max={2100}
                      placeholder="YYYY"
                      value={form.exp_year}
                      onChange={(e) => setForm((prev) => ({ ...prev, exp_year: e.target.value }))}
                      className={cn(authFieldClass, "px-4")}
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <AuthField
                    id="cvc"
                    label="CVC"
                    value={form.cvc}
                    onChange={(value) => setForm((prev) => ({ ...prev, cvc: value }))}
                    placeholder="123"
                    required
                  />
                  <AuthField
                    id="pin"
                    label="PIN (optional)"
                    value={form.pin}
                    onChange={(value) => setForm((prev) => ({ ...prev, pin: value }))}
                    placeholder="Optional"
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
