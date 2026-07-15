"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PortalStatCard } from "@/components/platform/provider/PortalStatCard";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCachedAdminPlans,
  listPlans,
  updatePlanPrice,
  type Plan,
  type PlanType,
} from "@/lib/integrate/provider/admin/payment/api";
import {
  formatMoney,
  planLabels,
} from "@/lib/integrate/provider/student/payment/types";
import { inputClassName } from "@/lib/form-styles";
import { cn } from "@/lib/utils";

function isValidPriceDraft(value: string) {
  const price = Number(value);
  return value.trim() !== "" && Number.isFinite(price) && price > 0;
}

function priceDraftsFromPlans(plans: Plan[]) {
  return Object.fromEntries(plans.map((plan) => [plan.plan_type, String(plan.price)]));
}

export function AdminPlansPage() {
  const cachedPlans = getCachedAdminPlans();
  const [loading, setLoading] = useState(!cachedPlans);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>(cachedPlans ?? []);
  const [prices, setPrices] = useState<Record<string, string>>(
    priceDraftsFromPlans(cachedPlans ?? []),
  );
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

  return (
    <PortalShell
      role="admin"
      title="Membership Plans"
      subtitle="Update student membership pricing and duration."
      nav={adminNav}
    >
      <div className="mx-auto grid w-full max-w-4xl gap-5">
        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

        {loading ? (
          <div className="rounded-2xl border border-black/[0.06] bg-white p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
          </div>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              <PortalStatCard label="Plans" value={String(plans.length)} hint="Active pricing tiers" />
              <PortalStatCard
                label="Lowest price"
                value={plans.length ? formatMoney(Math.min(...plans.map((plan) => Number(plan.price)))) : "—"}
                hint="Entry membership"
              />
              <PortalStatCard
                label="Longest access"
                value={plans.length ? `${Math.max(...plans.map((plan) => plan.duration_days))} days` : "—"}
                hint="Maximum duration"
              />
            </div>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
              <h2 className="text-[15px] font-semibold text-primary">Plan pricing</h2>
              <p className="mt-1 text-[13px] text-primary/45">
                Changes affect the prices shown to students on the membership page.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                {plans.map((plan, index) => {
                  const priceDraft = prices[plan.plan_type] ?? "";
                  const validPrice = isValidPriceDraft(priceDraft);

                  return (
                    <div
                      key={plan.plan_type}
                      className={cn(
                        "rounded-xl border p-4",
                        index === 0
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
                        {plan.duration_days} days access · {plan.currency}
                      </p>

                      <label className="mt-4 block">
                        <span className="mb-2 block text-[13px] font-medium text-primary/65">
                          New price
                        </span>
                        <input
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
                          className={inputClassName}
                        />
                      </label>
                      {!validPrice ? (
                        <p className="mt-2 text-[12px] font-medium text-red-700">
                          Price must be greater than 0.
                        </p>
                      ) : null}

                      <Button
                        type="button"
                        variant="primary"
                        size="md"
                        className="mt-4 w-full justify-center"
                        disabled={savingPlan !== null || !validPrice}
                        onClick={() => handleSave(plan.plan_type)}
                      >
                        {savingPlan === plan.plan_type ? "Saving..." : "Update price"}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </div>
    </PortalShell>
  );
}
