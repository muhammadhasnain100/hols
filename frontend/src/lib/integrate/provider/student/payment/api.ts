import { apiRequest } from "@/lib/integrate/client";
import type {
  CardCreatePayload,
  CardUpdatePayload,
  Membership,
  Order,
  PaginationMeta,
  Plan,
  PlanType,
  PaymentCard,
} from "@/lib/integrate/provider/student/payment/types";

export type { CardCreatePayload, CardUpdatePayload, Membership, Order, Plan, PlanType, PaymentCard };

export type PaginationParams = {
  page?: number;
  limit?: number;
  cursor?: string;
};

export function listPlans(signal?: AbortSignal) {
  return apiRequest<{ items: Plan[] }>("/api/payment/plans", { auth: true, signal });
}

export function purchasePlan(plan_type: PlanType, payment_method_id?: string) {
  return apiRequest<{
    order: Order;
    membership?: Membership;
  }>("/api/payment/purchase", {
    method: "POST",
    auth: true,
    body: { plan_type, payment_method_id },
  });
}

export function getCurrentMembership(signal?: AbortSignal) {
  return apiRequest<{ membership: Membership | null }>("/api/payment/membership/current", {
    auth: true,
    signal,
  });
}

export function listOrders(params: PaginationParams = {}, signal?: AbortSignal) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", params.cursor);

  const query = search.toString();
  return apiRequest<{ items: Order[]; pagination: PaginationMeta }>(
    `/api/payment/orders${query ? `?${query}` : ""}`,
    { auth: true, signal },
  );
}

export function addCard(payload: CardCreatePayload) {
  return apiRequest<{ card: PaymentCard }>("/api/payment/card", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function listCards(signal?: AbortSignal) {
  return apiRequest<{ items: PaymentCard[] }>("/api/payment/cards", { auth: true, signal });
}

export function getCard(signal?: AbortSignal) {
  return apiRequest<{ card: PaymentCard }>("/api/payment/card", { auth: true, signal });
}

export function updateCard(payload: CardUpdatePayload) {
  return apiRequest<{ card: PaymentCard }>("/api/payment/card", {
    method: "PUT",
    auth: true,
    body: payload,
  });
}
