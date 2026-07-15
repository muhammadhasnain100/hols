import { apiRequest } from "@/lib/integrate/client";
import {
  adminCacheKey,
  cachedAdminRequest,
  readAdminCache,
  writeAdminCache,
} from "@/lib/integrate/provider/admin/cache";
import type { Plan, PlanType } from "@/lib/integrate/provider/student/payment/types";

export type { Plan, PlanType };

export function getCachedAdminPlans() {
  return readAdminCache<{ items: Plan[] }>(adminCacheKey("plans"))?.items;
}

export function listPlans() {
  return cachedAdminRequest<{ items: Plan[] }>(
    adminCacheKey("plans"),
    "/api/payment/plans",
  );
}

export function updatePlanPrice(plan_type: PlanType, price: number) {
  return apiRequest<{ plan: Plan }>(`/api/payment/plans/${plan_type}`, {
    method: "PUT",
    auth: true,
    body: { price },
  }).then((result) => {
    const cachedPlans = readAdminCache<{ items: Plan[] }>(adminCacheKey("plans"));
    if (cachedPlans) {
      writeAdminCache(adminCacheKey("plans"), {
        items: cachedPlans.items.map((plan) => (plan.plan_type === plan_type ? result.plan : plan)),
      });
    }
    return result;
  });
}
