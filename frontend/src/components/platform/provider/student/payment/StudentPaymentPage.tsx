"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { DashRightDrawer } from "@/components/platform/provider/student/DashRightDrawer";
import { MembershipHubSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { MembershipListPanel } from "@/components/platform/provider/student/payment/MembershipListPanel";
import { MembershipPlanPanel } from "@/components/platform/provider/student/payment/MembershipPlanPanel";
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
import { planLabels } from "@/lib/integrate/provider/student/payment/types";

export function StudentPaymentPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [card, setCard] = useState<PaymentCard | null>(null);
  const [purchasingPlan, setPurchasingPlan] = useState<PlanType | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);

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

    if (!card) {
      setError("Add a payment card before purchasing a plan.");
      return;
    }

    setPurchasingPlan(planType);

    try {
      const result = await purchasePlan(planType, card.payment_method_id);
      setMembership(result.membership ?? null);
      setSuccess(`Purchased ${planLabels[planType]}.`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Purchase failed.");
    } finally {
      setPurchasingPlan(null);
    }
  }

  const selected = plans.find((plan) => plan.plan_type === selectedPlan) ?? null;

  return (
    <PaymentPageLayout title="Membership">
      {error && !selectedPlan ? <AuthAlert variant="error">{error}</AuthAlert> : null}
      {success && !selectedPlan ? <AuthAlert variant="success">{success}</AuthAlert> : null}

      {error && !loading && plans.length === 0 ? null : loading ? (
        <MembershipHubSkeleton />
      ) : (
        <MembershipListPanel
          plans={plans}
          membership={membership}
          card={card}
          activePlanType={selectedPlan}
          onSelect={setSelectedPlan}
        />
      )}

      {selected ? (
        <DashRightDrawer
          eyebrow={membership && selected.plan_type !== membership.plan_type ? "Switch plan" : "Checkout"}
          title={planLabels[selected.plan_type]}
          onClose={() => {
            if (purchasingPlan) return;
            setSelectedPlan(null);
            setError(null);
            setSuccess(null);
          }}
        >
          <MembershipPlanPanel
            plan={selected}
            membership={membership}
            card={card}
            purchasing={purchasingPlan === selected.plan_type}
            error={error}
            success={success}
            onPurchase={() => void handlePurchase(selected.plan_type)}
          />
        </DashRightDrawer>
      ) : null}
    </PaymentPageLayout>
  );
}
