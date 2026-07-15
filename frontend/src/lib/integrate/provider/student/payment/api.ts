import { ApiRequestError, apiRequest } from "@/lib/integrate/client";
import { getStoredUser } from "@/lib/integrate/auth/storage";
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

const paymentMemoryCache = new Map<string, unknown>();
const paymentPendingRequests = new Map<string, Promise<unknown>>();
const CARD_NOT_FOUND = "__CARD_NOT_FOUND__";

function cacheKey(kind: string, ...parts: Array<string | number | undefined | null>) {
  const userId = getStoredUser()?.user_id ?? "anonymous";
  return ["student-payment", userId, kind, ...parts.map((part) => part ?? "")].join(":");
}

function readSessionCache<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function writeSessionCache<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Payment cache only improves navigation speed; ignore storage failures.
  }
}

function deleteSessionCache(key: string) {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(key);
}

function readPaymentCache<T>(key: string): T | null {
  const memoryValue = paymentMemoryCache.get(key);
  if (memoryValue !== undefined) return memoryValue as T;

  const sessionValue = readSessionCache<T>(key);
  if (sessionValue !== null) {
    paymentMemoryCache.set(key, sessionValue);
    return sessionValue;
  }

  return null;
}

export function getCachedPlans() {
  return readPaymentCache<{ items: Plan[] }>(cacheKey("plans"))?.items;
}

export function getCachedCurrentMembership() {
  const cached = readPaymentCache<{ membership: Membership | null }>(
    cacheKey("membership-current"),
  );
  return cached ? cached.membership : undefined;
}

export function getCachedCard() {
  const cached = readPaymentCache<{ card: PaymentCard } | typeof CARD_NOT_FOUND>(
    cacheKey("card-default"),
  );
  if (cached === CARD_NOT_FOUND) return null;
  return cached?.card;
}

export function getCachedOrders(params: PaginationParams = {}) {
  return readPaymentCache<{ items: Order[]; pagination: PaginationMeta }>(ordersCacheKey(params));
}

function writePaymentCache<T>(key: string, value: T) {
  paymentMemoryCache.set(key, value);
  writeSessionCache(key, value);
}

async function cachedPaymentRequest<T>(
  key: string,
  path: string,
  signal?: AbortSignal,
): Promise<T> {
  const cachedValue = readPaymentCache<T>(key);
  if (cachedValue !== null) return cachedValue;

  const pending = paymentPendingRequests.get(key);
  if (pending) return pending as Promise<T>;

  const request = apiRequest<T>(path, { auth: true, signal })
    .then((value) => {
      writePaymentCache(key, value);
      return value;
    })
    .finally(() => {
      paymentPendingRequests.delete(key);
    });
  paymentPendingRequests.set(key, request);
  return request;
}

function ordersCacheKey(params: PaginationParams = {}) {
  return cacheKey("orders", params.page, params.limit, params.cursor);
}

export function listPlans(signal?: AbortSignal) {
  return cachedPaymentRequest<{ items: Plan[] }>(cacheKey("plans"), "/api/payment/plans", signal);
}

export function purchasePlan(plan_type: PlanType, payment_method_id?: string) {
  return apiRequest<{
    order: Order;
    membership?: Membership;
  }>("/api/payment/purchase", {
    method: "POST",
    auth: true,
    body: { plan_type, payment_method_id },
  }).then((result) => {
    if (result.membership) {
      writePaymentCache(cacheKey("membership-current"), { membership: result.membership });
    }
    paymentMemoryCache.delete(ordersCacheKey({ page: 1, limit: 10 }));
    deleteSessionCache(ordersCacheKey({ page: 1, limit: 10 }));
    paymentMemoryCache.delete(ordersCacheKey({ page: 1, limit: 1 }));
    deleteSessionCache(ordersCacheKey({ page: 1, limit: 1 }));
    return result;
  });
}

export function getCurrentMembership(signal?: AbortSignal) {
  return cachedPaymentRequest<{ membership: Membership | null }>(
    cacheKey("membership-current"),
    "/api/payment/membership/current",
    signal,
  );
}

export function listOrders(params: PaginationParams = {}, signal?: AbortSignal) {
  const key = ordersCacheKey(params);
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", params.cursor);

  const query = search.toString();
  return cachedPaymentRequest<{ items: Order[]; pagination: PaginationMeta }>(
    key,
    `/api/payment/orders${query ? `?${query}` : ""}`,
    signal,
  );
}

export function addCard(payload: CardCreatePayload) {
  return apiRequest<{ card: PaymentCard }>("/api/payment/card", {
    method: "POST",
    auth: true,
    body: payload,
  }).then((result) => {
    writePaymentCache(cacheKey("card-default"), result);
    return result;
  });
}

export function listCards(signal?: AbortSignal) {
  return cachedPaymentRequest<{ items: PaymentCard[] }>(
    cacheKey("cards"),
    "/api/payment/cards",
    signal,
  );
}

export async function getCard(signal?: AbortSignal) {
  const key = cacheKey("card-default");
  const cached = readPaymentCache<{ card: PaymentCard } | typeof CARD_NOT_FOUND>(key);
  if (cached === CARD_NOT_FOUND) {
    throw new ApiRequestError("Payment card not found", "NOT_FOUND", 404);
  }
  if (cached !== null) return cached;

  try {
    const result = await cachedPaymentRequest<{ card: PaymentCard }>(
      key,
      "/api/payment/card",
      signal,
    );
    return result;
  } catch (err) {
    if (err instanceof ApiRequestError && err.status === 404) {
      writePaymentCache(key, CARD_NOT_FOUND);
    }
    throw err;
  }
}

export function updateCard(payload: CardUpdatePayload) {
  return apiRequest<{ card: PaymentCard }>("/api/payment/card", {
    method: "PUT",
    auth: true,
    body: payload,
  }).then((result) => {
    writePaymentCache(cacheKey("card-default"), result);
    return result;
  });
}
