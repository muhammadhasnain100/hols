import {
  adminCacheKey,
  cachedAdminRequest,
  readAdminCache,
} from "@/lib/integrate/provider/admin/cache";
import type {
  AdminPaginationMeta,
  AffiliateSummary,
  PaginationParams,
  StudentSummary,
} from "@/lib/integrate/provider/admin/users/types";

export type {
  AdminPaginationMeta,
  AffiliateSummary,
  PaginationParams,
  StudentAffiliateInfo,
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
    adminCacheKey("users-affiliates", params.page, params.limit, params.cursor),
  );
}

export function getCachedStudents(params: PaginationParams = {}) {
  return readAdminCache<AdminListResult<StudentSummary>>(
    adminCacheKey("students", params.page, params.limit, params.cursor),
  );
}

export function listAffiliates(params: PaginationParams = {}) {
  return cachedAdminRequest<AdminListResult<AffiliateSummary>>(
    adminCacheKey("users-affiliates", params.page, params.limit, params.cursor),
    `/api/users/affiliates${buildQuery(params)}`,
  );
}

export function listStudents(params: PaginationParams = {}) {
  return cachedAdminRequest<AdminListResult<StudentSummary>>(
    adminCacheKey("students", params.page, params.limit, params.cursor),
    `/api/users/students${buildQuery(params)}`,
  );
}
