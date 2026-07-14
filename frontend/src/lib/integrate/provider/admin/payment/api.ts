import { apiRequest } from "@/lib/integrate/client";
import type { Plan, PlanType } from "@/lib/integrate/provider/student/payment/types";

export type { Plan, PlanType };

export function listPlans() {
  return apiRequest<{ items: Plan[] }>("/api/payment/plans", { auth: true });
}

export function updatePlanPrice(plan_type: PlanType, price: number) {
  return apiRequest<{ plan: Plan }>(`/api/payment/plans/${plan_type}`, {
    method: "PUT",
    auth: true,
    body: { price },
  });
}
