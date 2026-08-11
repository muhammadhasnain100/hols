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
  const query = search.toString();
  return query ? `?${query}` : "";
}

type AdminListResult<T> = {
  items: T[];
  pagination: AdminPaginationMeta;
};

export function getCachedAffiliates(params: PaginationParams = {}) {
  return readAdminCache<AdminListResult<AffiliateSummary>>(
    adminCacheKey("users-affiliates-v2", params.page, params.limit, params.cursor),
  );
}

export function getCachedStudents(params: PaginationParams = {}) {
  return readAdminCache<AdminListResult<StudentSummary>>(
    adminCacheKey("students-v2", params.page, params.limit, params.cursor),
  );
}

export function listAffiliates(params: PaginationParams = {}) {
  return cachedAdminRequest<AdminListResult<AffiliateSummary>>(
    adminCacheKey("users-affiliates-v2", params.page, params.limit, params.cursor),
    `/api/users/affiliates${buildQuery(params)}`,
  );
}

export function listStudents(params: PaginationParams = {}) {
  return cachedAdminRequest<AdminListResult<StudentSummary>>(
    adminCacheKey("students-v2", params.page, params.limit, params.cursor),
    `/api/users/students${buildQuery(params)}`,
  );
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
