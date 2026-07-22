"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PaymentPageLayout } from "@/components/platform/provider/student/payment/PaymentPageLayout";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCard,
  getCachedCard,
  getCachedCurrentMembership,
  getCachedPlans,
  getCurrentMembership,
  listPlans,
  purchasePlan,
  type Membership,
  type PaymentCard,
  type Plan,
  type PlanType,
} from "@/lib/integrate/provider/student/payment/api";
import {
  formatDate,
  formatMoney,
  planLabels,
} from "@/lib/integrate/provider/student/payment/types";
import { cn } from "@/lib/utils";

function StatTile({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="dashboard-surface rounded-2xl p-5">
      <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
        {label}
      </p>
      <p className="font-sans mt-2 text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-2xl">
        {value}
      </p>
      <p className="text-brand-body mt-1 text-[color:var(--dash-muted)]">{hint}</p>
    </div>
  );
}

export function StudentPaymentPage() {
  const cachedMembership = getCachedCurrentMembership();
  const cachedPlans = getCachedPlans();
  const cachedCard = getCachedCard();
  const hasCachedPageData =
    cachedMembership !== undefined && cachedPlans !== undefined && cachedCard !== undefined;
  const [loading, setLoading] = useState(!hasCachedPageData);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [membership, setMembership] = useState<Membership | null>(cachedMembership ?? null);
  const [plans, setPlans] = useState<Plan[]>(cachedPlans ?? []);
  const [card, setCard] = useState<PaymentCard | null>(cachedCard ?? null);
  const [purchasingPlan, setPurchasingPlan] = useState<PlanType | null>(null);

  const loadData = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const [membershipRes, plansRes] = await Promise.all([
        getCurrentMembership(signal),
        listPlans(signal),
      ]);

      if (signal?.aborted) return;
      setMembership(membershipRes.membership);
      setPlans(plansRes.items);

      try {
        const cardRes = await getCard(signal);
        if (!signal?.aborted) setCard(cardRes.card);
      } catch (err) {
        if (signal?.aborted) return;
        if (err instanceof ApiRequestError && err.status === 404) {
          setCard(null);
        } else {
          throw err;
        }
      }
    } catch (err) {
      if (signal?.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof ApiRequestError ? err.message : "Failed to load membership.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => void loadData(controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [loadData]);

  async function handlePurchase(planType: PlanType) {
    setError(null);
    setSuccess(null);
    setPurchasingPlan(planType);

    try {
      if (!card) {
        setError("Add a payment card before purchasing a plan.");
        return;
      }

      const result = await purchasePlan(planType, card.payment_method_id);
      setMembership(result.membership ?? null);
      setSuccess(`Purchased ${planLabels[planType]}.`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Purchase failed.");
    } finally {
      setPurchasingPlan(null);
    }
  }

  return (
    <PaymentPageLayout title="Membership">
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
              Current membership
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-2">
              <span className="font-sans text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-[2.25rem] md:leading-none">
                {membership ? planLabels[membership.plan_type] : "No plan"}
              </span>
              {membership ? (
                <span className="mb-1 text-brand-caption font-medium capitalize text-[color:var(--dash-faint)]">
                  {membership.status}
                </span>
              ) : null}
            </div>
            <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">
              {membership
                ? `Active until ${formatDate(membership.end_date)}`
                : "You have no active membership yet."}
            </p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <StatTile
              label="Payment card"
              value={card ? card.card_number_masked : "Not added"}
              hint={card ? `Expires ${card.exp_month}/${card.exp_year}` : "Add a card before purchasing"}
            />
            <StatTile
              label="Plan status"
              value={membership ? membership.status : "Inactive"}
              hint={
                membership
                  ? `Renews / ends ${formatDate(membership.end_date)}`
                  : "Choose a plan below to activate"
              }
            />
          </div>

          <section className="dashboard-surface rounded-2xl p-5 md:p-6">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Plans
            </p>
            <h2 className="font-sans mt-1 text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)] md:text-xl">
              Available membership
            </h2>
            <p className="text-brand-body mt-1 text-[color:var(--dash-muted)]">
              Your saved card will be charged on purchase.
            </p>

            <div className="mt-5 grid gap-3 lg:grid-cols-3">
              {plans.map((plan) => {
                const current = membership?.plan_type === plan.plan_type;
                return (
                  <div
                    key={plan.plan_type}
                    className={cn(
                      "flex flex-col rounded-2xl border p-5 transition",
                      current
                        ? "border-[#DDE466] bg-[#DDE466]/10"
                        : "border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)]",
                    )}
                  >
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                      {planLabels[plan.plan_type]}
                    </p>
                    <p className="font-sans mt-1 text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-2xl">
                      {formatMoney(plan.price, plan.currency)}
                    </p>
                    <p className="text-brand-body mt-1 text-[color:var(--dash-muted)]">
                      {plan.duration_days} days access
                    </p>
                    <button
                      type="button"
                      disabled={purchasingPlan !== null || current}
                      onClick={() => handlePurchase(plan.plan_type)}
                      className={cn(
                        "font-sans mt-4 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] transition disabled:pointer-events-none disabled:opacity-60",
                        current
                          ? "dashboard-pill-soft text-[color:var(--dash-text)]"
                          : "bg-[#DDE466] text-[#152744] hover:brightness-105",
                      )}
                    >
                      {current
                        ? "Current plan"
                        : purchasingPlan === plan.plan_type
                          ? "Processing…"
                          : "Purchase"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </PaymentPageLayout>
  );
}
