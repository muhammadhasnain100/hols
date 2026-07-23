"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { MembershipPageSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCachedAdminPlans,
  listPlans,
  updatePlanPrice,
  type Plan,
  type PlanType,
} from "@/lib/integrate/provider/admin/payment/api";
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
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
    ),
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
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    ),
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
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
};

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

function isValidPriceDraft(value: string) {
  const price = Number(value);
  return value.trim() !== "" && Number.isFinite(price) && price > 0;
}

function priceDraftsFromPlans(plans: Plan[]) {
  return Object.fromEntries(plans.map((plan) => [plan.plan_type, String(plan.price)]));
}

function sortedPlans(plans: Plan[]) {
  return [...plans].sort(
    (a, b) => PLAN_ORDER.indexOf(a.plan_type) - PLAN_ORDER.indexOf(b.plan_type),
  );
}

export function AdminPlansPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [savingPlan, setSavingPlan] = useState<PlanType | null>(null);

  const loadPlans = useCallback(async () => {
    const cached = getCachedAdminPlans();
    if (cached) {
      setPlans(cached);
      setPrices(priceDraftsFromPlans(cached));
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await listPlans();
      setPlans(data.items);
      setPrices(priceDraftsFromPlans(data.items));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPlans();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadPlans]);

  async function handleSave(planType: PlanType) {
    setError(null);
    setSuccess(null);
    setSavingPlan(planType);

    const price = Number(prices[planType]);
    if (!Number.isFinite(price) || price <= 0) {
      setError("Enter a valid price greater than zero.");
      setSavingPlan(null);
      return;
    }

    try {
      const result = await updatePlanPrice(planType, price);
      setPlans((current) =>
        current.map((plan) => (plan.plan_type === planType ? result.plan : plan)),
      );
      setPrices((current) => ({ ...current, [planType]: String(result.plan.price) }));
      setSuccess(`${planLabels[planType]} plan price updated.`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not update plan price.");
    } finally {
      setSavingPlan(null);
    }
  }

  const lowestPrice = plans.length
    ? formatMoney(Math.min(...plans.map((plan) => Number(plan.price))))
    : "—";
  const longestAccess = plans.length
    ? `${Math.max(...plans.map((plan) => plan.duration_days))} days`
    : "—";

  return (
    <PortalShell
      role="admin"
      title="Plans"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={adminNav}
    >
      <div className="dashboard-screen min-w-0 overflow-x-hidden">
        <header className="mb-3 flex items-center justify-between gap-2 sm:mb-5 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={openSidebar}
              className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full lg:hidden"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M4 7h16M4 12h10M4 17h16" />
              </svg>
            </button>
            <h1 className="font-sans truncate text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl">
              Plans
            </h1>
          </div>

          <WelcomeChip fallbackName="Admin" />
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          {loading ? (
            <MembershipPageSkeleton />
          ) : (
            <>
              <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
                <div className="flex flex-col gap-3.5 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                      Membership pricing
                    </p>
                    <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
                      <span className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                        {plans.length} plans
                      </span>
                      <span className="mb-0.5 inline-flex rounded-full bg-[#DDE466]/25 px-2.5 py-0.5 text-brand-caption font-semibold text-[color:var(--dash-accent)]">
                        Live
                      </span>
                    </div>
                    <p className="text-brand-body mt-2 text-sm text-[color:var(--dash-muted)] sm:text-base">
                      From {lowestPrice} · longest access {longestAccess}. Prices shown to students update
                      immediately.
                    </p>
                  </div>

                  <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5">
                    <Link
                      href="/admin/students"
                      className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-[color:var(--dash-text)] transition sm:px-5"
                    >
                      Students
                    </Link>
                    <Link
                      href="/admin"
                      className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-3 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:px-5"
                    >
                      Dashboard
                    </Link>
                  </div>
                </div>
              </section>

              <div className="grid min-w-0 gap-2.5 grid-cols-1 min-[420px]:grid-cols-3 sm:gap-3">
                <StatPill label="Active tiers" value={String(plans.length)} />
                <StatPill label="Lowest price" value={lowestPrice} />
                <StatPill label="Longest access" value={longestAccess} />
              </div>

              <section className="mt-0.5 min-w-0 sm:mt-1">
                <div className="mb-3 flex flex-col gap-1 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                      Edit pricing
                    </p>
                    <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg md:text-xl">
                      Membership options
                    </h2>
                  </div>
                  <p className="text-brand-caption text-[color:var(--dash-muted)]">
                    All prices in USD · duration is fixed per tier
                  </p>
                </div>

                <div className="grid min-w-0 items-stretch gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {sortedPlans(plans).map((plan) => {
                    const meta = PLAN_META[plan.plan_type];
                    const favourite = Boolean(meta.favourite);
                    const priceDraft = prices[plan.plan_type] ?? "";
                    const validPrice = isValidPriceDraft(priceDraft);
                    const priceChanged =
                      validPrice && Number(priceDraft) !== Number(plan.price);
                    const priceUsd = formatMoney(plan.price, plan.currency || "USD");

                    return (
                      <article
                        key={plan.plan_type}
                        className={cn(
                          "membership-plan-card relative flex min-w-0 flex-col overflow-hidden rounded-[1.25rem] p-3.5 sm:rounded-[1.35rem] sm:p-5 md:p-6",
                          favourite && "membership-plan-card--favourite",
                        )}
                      >
                        {meta.badge ? (
                          <span
                            className={cn(
                              "membership-plan-badge",
                              favourite
                                ? "membership-plan-badge--favourite"
                                : "membership-plan-badge--value",
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
                          <span className="text-brand-caption rounded-full bg-[color:var(--dash-soft)] px-2.5 py-1 font-medium text-[color:var(--dash-faint)]">
                            {plan.duration_days} days
                          </span>
                        </div>

                        <h3 className="font-sans mt-3 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:mt-4 sm:text-[1.35rem]">
                          {planLabels[plan.plan_type]}
                        </h3>

                        <div className="mt-3 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                          <span className="font-sans text-[1.5rem] font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)] sm:text-[1.85rem] md:text-[2rem]">
                            {priceUsd}
                          </span>
                          <span className="text-brand-caption font-medium text-[color:var(--dash-faint)]">
                            {plan.currency || "USD"} · {meta.period}
                          </span>
                        </div>

                        {plan.updated_at ? (
                          <p className="text-brand-caption mt-2 text-[color:var(--dash-dim)]">
                            Updated {formatDate(plan.updated_at)}
                          </p>
                        ) : null}

                        <div className="membership-plan-divider my-3 sm:my-4" />

                        <ul className="flex flex-col gap-2 sm:gap-2.5">
                          {meta.features.map((feature) => (
                            <li key={feature} className="flex items-start gap-2.5">
                              <span className="membership-plan-check mt-0.5" aria-hidden>
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6">
                                  <path d="M20 6 9 17l-5-5" />
                                </svg>
                              </span>
                              <span className="text-sm leading-snug text-[color:var(--dash-muted)]">
                                {feature}
                              </span>
                            </li>
                          ))}
                        </ul>

                        <div className="mt-auto flex flex-col gap-3 pt-5 sm:pt-6">
                          <div className="grid min-w-0 gap-2">
                            <label
                              htmlFor={`price-${plan.plan_type}`}
                              className="dashboard-field-label"
                            >
                              New price (USD)
                            </label>
                            <input
                              id={`price-${plan.plan_type}`}
                              type="number"
                              min={0.01}
                              step={0.01}
                              value={priceDraft}
                              aria-invalid={!validPrice}
                              onChange={(event) =>
                                setPrices((current) => ({
                                  ...current,
                                  [plan.plan_type]: event.target.value,
                                }))
                              }
                              className="dashboard-field"
                            />
                            {!validPrice ? (
                              <p className="text-brand-caption font-medium text-red-600">
                                Price must be greater than 0.
                              </p>
                            ) : null}
                          </div>

                          <button
                            type="button"
                            disabled={savingPlan !== null || !validPrice || !priceChanged}
                            onClick={() => handleSave(plan.plan_type)}
                            className={cn(
                              "font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-semibold tracking-[0.01em] transition disabled:pointer-events-none disabled:opacity-55",
                              favourite
                                ? "membership-plan-cta membership-plan-cta--favourite"
                                : "membership-plan-cta",
                            )}
                          >
                            {savingPlan === plan.plan_type
                              ? "Saving…"
                              : priceChanged
                                ? "Update price"
                                : "No changes"}
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            </>
          )}
        </div>
      </div>
    </PortalShell>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="dashboard-glass-card min-w-0 overflow-hidden rounded-2xl px-3.5 py-3 sm:px-4 sm:py-4">
      <p className="text-brand-caption break-words font-medium text-[color:var(--dash-faint)]">{label}</p>
      <p className="font-sans mt-1 break-words text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl">
        {value}
      </p>
    </div>
  );
}
