import { apiRequest } from "@/lib/integrate/client";
import {
  adminCacheKey,
  cachedAdminRequest,
  readAdminCache,
} from "@/lib/integrate/provider/admin/cache";
import type {
  AdminPaginationMeta,
  AffiliateEarningsSummary,
  AffiliateSummary,
  PaginationParams,
  StudentCommerceSummary,
  StudentSummary,
} from "@/lib/integrate/provider/admin/users/types";
import type {
  Order,
  PaginationMeta,
} from "@/lib/integrate/provider/student/payment/types";

export type {
  AdminPaginationMeta,
  AffiliateCommissionItem,
  AffiliateEarningsSummary,
  AffiliateSummary,
  PaginationParams,
  StudentAffiliateInfo,
  StudentCommerceSummary,
  StudentSummary,
} from "@/lib/integrate/provider/admin/users/types";

function buildQuery(params: PaginationParams) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", params.cursor);
  if (params.sort) search.set("sort", params.sort);
  if (params.empty_referrals) search.set("empty_referrals", "true");
  if (params.empty_orders) search.set("empty_orders", "true");
  const query = search.toString();
  return query ? `?${query}` : "";
}

type AdminListResult<T> = {
  items: T[];
  pagination: AdminPaginationMeta;
};

export function getCachedAffiliates(params: PaginationParams = {}) {
  return readAdminCache<AdminListResult<AffiliateSummary>>(
    adminCacheKey("users-affiliates-v3", params.page, params.limit, params.cursor),
  );
}

export function getCachedStudents(params: PaginationParams = {}) {
  return readAdminCache<AdminListResult<StudentSummary>>(
    adminCacheKey(
      "students-v4",
      params.page,
      params.limit,
      params.cursor,
      params.sort,
      params.empty_orders ? "empty" : "",
    ),
  );
}

export function listAffiliates(params: PaginationParams = {}) {
  return cachedAdminRequest<AdminListResult<AffiliateSummary>>(
    adminCacheKey("users-affiliates-v3", params.page, params.limit, params.cursor),
    `/api/users/affiliates${buildQuery(params)}`,
  );
}

export function listStudents(params: PaginationParams = {}) {
  return cachedAdminRequest<AdminListResult<StudentSummary>>(
    adminCacheKey(
      "students-v4",
      params.page,
      params.limit,
      params.cursor,
      params.sort,
      params.empty_orders ? "empty" : "",
    ),
    `/api/users/students${buildQuery(params)}`,
  );
}

export async function listAllStudents(params: PaginationParams = {}) {
  const items: StudentSummary[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const data = await listStudents({ ...params, page, limit: 100, cursor: undefined });
    items.push(...data.items);
    hasNext = Boolean(data.pagination.has_next);
    page += 1;
    if (page > 50) break;
  }

  return items;
}

export function getStudentCommerce(userId: string) {
  return apiRequest<StudentCommerceSummary>(
    `/api/payment/students/${encodeURIComponent(userId)}/commerce`,
    { auth: true },
  );
}

export function listStudentOrders(userId: string, params: PaginationParams = {}) {
  return apiRequest<{ items: Order[]; pagination: PaginationMeta }>(
    `/api/payment/orders/${encodeURIComponent(userId)}${buildQuery(params)}`,
    { auth: true },
  );
}

export function getAffiliateEarnings(affiliateId: string, historyLimit = 25) {
  const search = new URLSearchParams();
  search.set("history_limit", String(historyLimit));
  return apiRequest<AffiliateEarningsSummary>(
    `/api/admin/affiliates/${encodeURIComponent(affiliateId)}/earnings?${search}`,
    { auth: true },
  );
}
