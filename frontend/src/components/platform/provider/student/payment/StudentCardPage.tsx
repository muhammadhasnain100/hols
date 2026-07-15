"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PaymentSubnav } from "@/components/platform/provider/student/payment/PaymentSubnav";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  addCard,
  getCard,
  getCachedCard,
  updateCard,
  type PaymentCard,
} from "@/lib/integrate/provider/student/payment/api";

const fieldClass =
  "w-full rounded-xl border border-black/[0.08] bg-white px-3.5 py-3 text-sm text-primary outline-none transition placeholder:text-primary/35 focus:border-primary/30 focus:ring-4 focus:ring-primary/5";

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
    <PortalShell role="student" title="Payment card" nav={studentNav}>
      <div className="mx-auto grid w-full max-w-xl gap-5">
        <PaymentSubnav />

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

        <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 animate-pulse rounded-full bg-primary/10" />
            </div>
          ) : (
            <>
              <h2 className="text-[15px] font-semibold text-primary">
                {card ? "Update card" : "Add card"}
              </h2>
              <p className="mt-1 text-[13px] text-primary/45">
                One card per account. Required to purchase membership.
              </p>

              {card ? (
                <div className="mt-4 rounded-xl border border-black/[0.05] bg-[#F5F7FA] px-4 py-3 text-[13px] text-primary">
                  {card.card_number_masked}
                  {card.card_holder_name ? ` · ${card.card_holder_name}` : ""}
                  <span className="mt-0.5 block text-[11px] text-primary/40">
                    Expires {card.exp_month}/{card.exp_year}
                  </span>
                </div>
              ) : null}

              <form className="mt-5 grid gap-3.5" onSubmit={handleSubmit}>
                <input
                  aria-label="Cardholder name"
                  placeholder="Cardholder name"
                  value={form.card_holder_name}
                  onChange={(e) => setForm((prev) => ({ ...prev, card_holder_name: e.target.value }))}
                  className={fieldClass}
                />
                <input
                  required
                  aria-label="Card number"
                  inputMode="numeric"
                  placeholder="Card number"
                  value={form.card_number}
                  onChange={(e) => setForm((prev) => ({ ...prev, card_number: e.target.value }))}
                  className={fieldClass}
                />
                <div className="grid grid-cols-2 gap-3.5">
                  <input
                    required
                    type="number"
                    min={1}
                    max={12}
                    aria-label="Expiry month"
                    placeholder="MM"
                    value={form.exp_month}
                    onChange={(e) => setForm((prev) => ({ ...prev, exp_month: e.target.value }))}
                    className={fieldClass}
                  />
                  <input
                    required
                    type="number"
                    min={2024}
                    max={2100}
                    aria-label="Expiry year"
                    placeholder="YYYY"
                    value={form.exp_year}
                    onChange={(e) => setForm((prev) => ({ ...prev, exp_year: e.target.value }))}
                    className={fieldClass}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3.5">
                  <input
                    required
                    inputMode="numeric"
                    maxLength={4}
                    aria-label="CVC"
                    placeholder="CVC"
                    value={form.cvc}
                    onChange={(e) => setForm((prev) => ({ ...prev, cvc: e.target.value }))}
                    className={fieldClass}
                  />
                  <input
                    inputMode="numeric"
                    maxLength={6}
                    aria-label="PIN optional"
                    placeholder="PIN (optional)"
                    value={form.pin}
                    onChange={(e) => setForm((prev) => ({ ...prev, pin: e.target.value }))}
                    className={fieldClass}
                  />
                </div>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={saving}
                  className="mt-1 w-full justify-center"
                >
                  {saving ? "Saving…" : card ? "Update card" : "Save card"}
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </PortalShell>
  );
}
