"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
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

export function AdminPlansPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [savingPlan, setSavingPlan] = useState<PlanType | null>(null);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listPlans();
      setPlans(data.items);
      setPrices(
        Object.fromEntries(data.items.map((plan) => [plan.plan_type, String(plan.price)])),
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load plans.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPlans();
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
      subtitle="View and update plan pricing via PUT /api/payment/plans/{plan_type}"
      nav={adminNav}
    >
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
      {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

      <div className="glass-panel rounded-3xl p-6">
        {loading ? (
          <p className="text-sm text-muted">Loading plans…</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-3">
            {plans.map((plan) => (
              <div key={plan.plan_type} className="rounded-2xl border border-primary/10 bg-white/70 p-5">
                <p className="text-sm font-medium text-muted">{planLabels[plan.plan_type]}</p>
                <p className="mt-2 text-xs text-muted">{plan.duration_days} days · {plan.currency}</p>

                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-medium text-primary">Price</span>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={prices[plan.plan_type] ?? ""}
                    onChange={(event) =>
                      setPrices((current) => ({
                        ...current,
                        [plan.plan_type]: event.target.value,
                      }))
                    }
                    className={inputClassName}
                  />
                </label>

                <p className="mt-3 text-sm text-muted">
                  Current: {formatMoney(plan.price, plan.currency)}
                </p>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="mt-5 w-full justify-center"
                  disabled={savingPlan !== null}
                  onClick={() => handleSave(plan.plan_type)}
                >
                  {savingPlan === plan.plan_type ? "Saving…" : "Update price"}
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </PortalShell>
  );
}
