"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PortalStatCard } from "@/components/platform/provider/PortalStatCard";
import { PaymentSubnav } from "@/components/platform/provider/student/payment/PaymentSubnav";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { Button } from "@/components/ui/Button";
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
    <PortalShell role="student" title="Membership" nav={studentNav}>
      <div className="mx-auto grid w-full max-w-4xl gap-5">
        <PaymentSubnav />

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

        {loading ? (
          <div className="rounded-2xl border border-black/[0.06] bg-white p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <PortalStatCard
                label="Current plan"
                value={membership ? planLabels[membership.plan_type] : "None"}
                hint={
                  membership
                    ? `${membership.status} · until ${formatDate(membership.end_date)}`
                    : "No active membership"
                }
              />
              <PortalStatCard
                label="Payment card"
                value={card ? card.card_number_masked : "Not added"}
                hint={
                  card
                    ? `Expires ${card.exp_month}/${card.exp_year}`
                    : "Add a card before purchasing"
                }
              />
            </div>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
              <h2 className="text-[15px] font-semibold text-primary">Available plans</h2>
              <p className="mt-1 text-[13px] text-primary/45">
                Your saved card will be charged on purchase.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {plans.map((plan) => {
                  const current = membership?.plan_type === plan.plan_type;
                  return (
                    <div
                      key={plan.plan_type}
                      className={cn(
                        "rounded-xl border p-4",
                        current
                          ? "border-primary/30 bg-primary/[0.03]"
                          : "border-black/[0.06] bg-[#F5F7FA]",
                      )}
                    >
                      <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-primary/40">
                        {planLabels[plan.plan_type]}
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-primary">
                        {formatMoney(plan.price, plan.currency)}
                      </p>
                      <p className="mt-1 text-[13px] text-primary/45">
                        {plan.duration_days} days access
                      </p>
                      <Button
                        type="button"
                        variant={current ? "secondary" : "primary"}
                        size="md"
                        className="mt-4 w-full justify-center"
                        disabled={purchasingPlan !== null || current}
                        onClick={() => handlePurchase(plan.plan_type)}
                      >
                        {current
                          ? "Current"
                          : purchasingPlan === plan.plan_type
                            ? "Processing…"
                            : "Purchase"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>

            <div className="flex flex-wrap gap-4 text-[13px]">
              <Link
                href="/student/payment/orders"
                className="font-medium text-primary/55 transition hover:text-primary"
              >
                View orders
              </Link>
              <Link
                href="/student/payment/card"
                className="font-medium text-primary/55 transition hover:text-primary"
              >
                Manage card
              </Link>
              <Link
                href="/student/profile"
                className="font-medium text-primary/55 transition hover:text-primary"
              >
                Profile settings
              </Link>
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}
