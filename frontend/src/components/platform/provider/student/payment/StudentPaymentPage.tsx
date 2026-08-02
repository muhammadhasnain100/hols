"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Calendar, Check, Clock, Icon, Star } from "@/components/icons";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { MembershipPageSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
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

const PLAN_ORDER: PlanType[] = ["monthly", "biannual", "annual"];

const PLAN_META: Record<
  PlanType,
  {
    period: string;
    badge?: string;
    favourite?: boolean;
    features: string[];
    icon: ReactNode;
  }
> = {
  monthly: {
    period: "per month",
    features: [
      "Lecture library access",
      "Peptide calculator tools",
      "AI adviser sessions",
      "30 days membership",
    ],
    icon: <Icon icon={Calendar} size={24} strokeWidth={1.7} />,
  },
  biannual: {
    period: "every 6 months",
    badge: "Favourite",
    favourite: true,
    features: [
      "Everything in Monthly",
      "Priority content updates",
      "Cross-device progress sync",
      "182 days membership",
    ],
    icon: <Icon icon={Star} size={24} strokeWidth={1.7} />,
  },
  annual: {
    period: "per year",
    badge: "Best value",
    features: [
      "Everything in Biannual",
      "Full-year uninterrupted access",
      "Certification pathway support",
      "365 days membership",
    ],
    icon: <Icon icon={Clock} size={24} strokeWidth={1.7} />,
  },
};

function sortedPlans(plans: Plan[]) {
  return [...plans].sort(
    (a, b) => PLAN_ORDER.indexOf(a.plan_type) - PLAN_ORDER.indexOf(b.plan_type),
  );
}

export function StudentPaymentPage() {
  // Keep SSR and first client paint identical — never read session cache during render.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [card, setCard] = useState<PaymentCard | null>(null);
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

    const cachedMembership = getCachedCurrentMembership();
    const cachedPlans = getCachedPlans();
    const cachedCard = getCachedCard();
    const hasCachedPageData =
      cachedMembership !== undefined && cachedPlans !== undefined && cachedCard !== undefined;

    if (hasCachedPageData) {
      setMembership(cachedMembership ?? null);
      setPlans(cachedPlans ?? []);
      setCard(cachedCard ?? null);
      setLoading(false);
    }

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
        <MembershipPageSkeleton />
      ) : (
        <>
          <section className="dashboard-hero relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                  Current membership
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
                  <span className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                    {membership ? planLabels[membership.plan_type] : "No plan"}
                  </span>
                  <span
                    className={cn(
                      "mb-0.5 inline-flex rounded-full px-2.5 py-0.5 text-brand-caption font-semibold capitalize",
                      membership
                        ? "bg-[#DDE466]/25 text-[color:var(--dash-accent)]"
                        : "bg-[color:var(--dash-soft)] text-[color:var(--dash-faint)]",
                    )}
                  >
                    {membership ? membership.status : "Inactive"}
                  </span>
                </div>
                <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">
                  {membership
                    ? `Active until ${formatDate(membership.end_date)}`
                    : "Choose a plan below to unlock lectures, tools, and adviser access."}
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5">
                <Link
                  href="/student/payment/card"
                  className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-[color:var(--dash-text)] transition sm:px-5"
                >
                  {card ? `Card ···· ${card.card_last4}` : "Add card"}
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

          <section className="mt-0.5 min-w-0 sm:mt-1">
            <div className="mb-3 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                  Choose a plan
                </p>
                <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg md:text-xl">
                  Membership options
                </h2>
              </div>
              <p className="text-brand-caption text-[color:var(--dash-muted)]">
                All prices in USD · charged to your saved card
              </p>
            </div>

            {!card ? (
              <div className="mb-3 flex flex-col gap-3 rounded-2xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-surface)] px-4 py-3.5 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <p className="text-brand-body text-[color:var(--dash-muted)]">
                  Add a payment card before selecting a plan.
                </p>
                <Link
                  href="/student/payment/card"
                  className="font-sans inline-flex min-h-9 w-full items-center justify-center rounded-full bg-[#DDE466] px-4 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:w-auto"
                >
                  Add card
                </Link>
              </div>
            ) : null}

            <div className="grid min-w-0 items-stretch gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
              {sortedPlans(plans).map((plan) => {
                const meta = PLAN_META[plan.plan_type];
                const current = membership?.plan_type === plan.plan_type;
                const favourite = Boolean(meta.favourite);
                const priceUsd = formatMoney(plan.price, "USD");

                return (
                  <article
                    key={plan.plan_type}
                    className={cn(
                      "membership-plan-card relative flex min-w-0 flex-col rounded-[1.25rem] p-4 sm:rounded-[1.35rem] sm:p-5 md:p-6",
                      favourite && "membership-plan-card--favourite",
                      current && "membership-plan-card--current",
                    )}
                  >
                    {meta.badge ? (
                      <span
                        className={cn(
                          "membership-plan-badge",
                          favourite ? "membership-plan-badge--favourite" : "membership-plan-badge--value",
                        )}
                      >
                        {meta.badge}
                      </span>
                    ) : (
                      <span className="membership-plan-badge membership-plan-badge--spacer" aria-hidden>
                        &nbsp;
                      </span>
                    )}

                    <div className="mt-1 flex items-start justify-between gap-3">
                      <div className="membership-plan-icon" aria-hidden>
                        {meta.icon}
                      </div>
                    </div>

                    <h3 className="font-sans mt-3 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:mt-4 sm:text-[1.35rem]">
                      {planLabels[plan.plan_type]}
                    </h3>

                    <div className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-sans text-[1.65rem] font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)] sm:text-[1.85rem] md:text-[2rem]">
                        {priceUsd}
                      </span>
                      <span className="text-brand-caption font-medium text-[color:var(--dash-faint)]">
                        USD · {meta.period}
                      </span>
                    </div>

                    <div className="membership-plan-divider my-3 sm:my-4" />

                    <ul className="flex flex-1 flex-col gap-2 sm:gap-2.5">
                      {meta.features.map((feature) => (
                        <li key={feature} className="flex items-start gap-2.5">
                          <span className="membership-plan-check mt-0.5" aria-hidden>
                            <Icon icon={Check} size={11} strokeWidth={2.6} />
                          </span>
                          <span className="text-sm leading-snug text-[color:var(--dash-muted)]">
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <button
                      type="button"
                      disabled={purchasingPlan !== null || current || !card}
                      onClick={() => handlePurchase(plan.plan_type)}
                      className={cn(
                        "font-sans mt-5 inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold tracking-[0.01em] transition disabled:pointer-events-none disabled:opacity-55 sm:mt-6",
                        current
                          ? "dashboard-pill-soft text-[color:var(--dash-text)]"
                          : favourite
                            ? "membership-plan-cta membership-plan-cta--favourite"
                            : "membership-plan-cta",
                      )}
                    >
                      {current
                        ? "Current plan"
                        : purchasingPlan === plan.plan_type
                          ? "Processing…"
                          : "Add plan"}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        </>
      )}
    </PaymentPageLayout>
  );
}
