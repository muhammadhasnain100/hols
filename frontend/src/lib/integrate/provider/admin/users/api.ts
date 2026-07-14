import { apiRequest } from "@/lib/integrate/client";
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

export function listAffiliates(params: PaginationParams = {}) {
  return apiRequest<{ items: AffiliateSummary[]; pagination: AdminPaginationMeta }>(
    `/api/users/affiliates${buildQuery(params)}`,
    { auth: true },
  );
}

export function listStudents(params: PaginationParams = {}) {
  return apiRequest<{ items: StudentSummary[]; pagination: AdminPaginationMeta }>(
    `/api/users/students${buildQuery(params)}`,
    { auth: true },
  );
}
