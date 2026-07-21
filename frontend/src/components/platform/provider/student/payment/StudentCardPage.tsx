"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { AuthField } from "@/components/platform/auth/AuthField";
import { authFieldClass } from "@/components/platform/auth/auth-styles";
import { PaymentPageLayout } from "@/components/platform/provider/student/payment/PaymentPageLayout";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  addCard,
  getCard,
  getCachedCard,
  updateCard,
  type PaymentCard,
} from "@/lib/integrate/provider/student/payment/api";
import { cn } from "@/lib/utils";

const labelClass = "font-sans text-sm font-medium text-primary";

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
    <PaymentPageLayout
      title="Payment card"
      description="Add or update the card used for membership purchases."
      visual="card"
    >
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
      {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="h-8 w-8 animate-pulse rounded-full bg-primary/10" />
        </div>
      ) : (
        <section className="mx-auto w-full max-w-lg">
          <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary/40">Billing</p>
          <h2 className="mt-1 text-[15px] font-semibold text-primary">
            {card ? "Update payment card" : "Add payment card"}
          </h2>
          <p className="mt-1 text-[13px] text-primary/45">
            One card per account. Required to purchase membership.
          </p>

          {card ? (
            <div className="mt-4 rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/40">
                Saved card
              </p>
              <p className="mt-2 text-[15px] font-semibold text-primary">{card.card_number_masked}</p>
              {card.card_holder_name ? (
                <p className="mt-1 text-sm text-primary/55">{card.card_holder_name}</p>
              ) : null}
              <p className="mt-1 text-xs text-primary/40">
                Expires {card.exp_month}/{card.exp_year}
              </p>
            </div>
          ) : null}

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
                <label htmlFor="exp_month" className={labelClass}>
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
                <label htmlFor="exp_year" className={labelClass}>
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
            <Button
              type="submit"
              variant="primary"
              size="lg"
              disabled={saving}
              className="mt-1 w-full justify-center sm:w-auto sm:min-w-[10rem]"
            >
              {saving ? "Saving…" : card ? "Update card" : "Save card"}
            </Button>
          </form>
        </section>
      )}
    </PaymentPageLayout>
  );
}
