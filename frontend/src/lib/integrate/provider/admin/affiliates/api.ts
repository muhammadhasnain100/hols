import { apiRequest } from "@/lib/integrate/client";
import {
  adminCacheKey,
  cachedAdminRequest,
  clearAdminCachePrefix,
  readAdminCache,
  writeAdminCache,
} from "@/lib/integrate/provider/admin/cache";
import type {
  AdminPaginationMeta,
  AffiliateSummary,
  PaginationParams,
  StudentSummary,
} from "@/lib/integrate/provider/admin/users/types";
import type { AffiliateReferralStudentList } from "@/lib/integrate/provider/affiliate/referrals/api";

export type AffiliateCreatePayload = {
  email: string;
  password?: string;
  first_name: string;
  last_name: string;
  margin_percent?: number;
  invitation_quota?: number;
};

export type AffiliateCreateResult = {
  message: string;
  user_id: string;
  profile: AffiliateSummary;
  credential_email_queued: boolean;
};

export type AffiliateDetailResult = {
  affiliate: AffiliateSummary;
};

export type AffiliateQuotaUpdatePayload = {
  invitation_quota: number;
};

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

type AffiliateListResult = {
  items: AffiliateSummary[];
  pagination: AdminPaginationMeta;
};

export function getCachedAdminAffiliates(params: PaginationParams = {}) {
  return readAdminCache<AffiliateListResult>(
    adminCacheKey(
      "affiliates-v2",
      params.page,
      params.limit,
      params.cursor,
      params.sort,
      params.empty_referrals ? "empty" : "",
    ),
  );
}

export function getCachedAffiliate(affiliateId: string) {
  return readAdminCache<AffiliateDetailResult>(adminCacheKey("affiliate-detail", affiliateId));
}

export function listAdminAffiliates(params: PaginationParams = {}) {
  return cachedAdminRequest<AffiliateListResult>(
    adminCacheKey(
      "affiliates-v2",
      params.page,
      params.limit,
      params.cursor,
      params.sort,
      params.empty_referrals ? "empty" : "",
    ),
    `/api/admin/affiliates${buildQuery(params)}`,
  );
}

export function createAffiliate(payload: AffiliateCreatePayload) {
  return apiRequest<AffiliateCreateResult>("/api/admin/affiliates", {
    method: "POST",
    auth: true,
    body: payload,
  }).then((result) => {
    clearAdminCachePrefix(adminCacheKey("affiliates-v2"));
    clearAdminCachePrefix(adminCacheKey("affiliates"));
    clearAdminCachePrefix(adminCacheKey("users-affiliates"));
    clearAdminCachePrefix(adminCacheKey("sales"));
    return result;
  });
}

export function getAffiliate(affiliateId: string) {
  return cachedAdminRequest<AffiliateDetailResult>(
    adminCacheKey("affiliate-detail", affiliateId),
    `/api/admin/affiliates/${affiliateId}`,
  );
}

export async function listAllAdminAffiliates(params: PaginationParams = {}) {
  const items: AffiliateSummary[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const data = await listAdminAffiliates({ ...params, page, limit: 100, cursor: undefined });
    items.push(...data.items);
    hasNext = Boolean(data.pagination.has_next);
    page += 1;
    if (page > 50) break;
  }

  return items;
}

export function listAdminAffiliateStudents(
  affiliateId: string,
  params: PaginationParams = {},
  signal?: AbortSignal,
) {
  return apiRequest<AffiliateReferralStudentList>(
    `/api/admin/affiliates/${encodeURIComponent(affiliateId)}/students${buildQuery(params)}`,
    { auth: true, signal },
  );
}

export async function listAllAffiliateStudents(
  affiliateId: string,
  params: PaginationParams = {},
) {
  const items: StudentSummary[] = [];
  let page = 1;
  let hasNext = true;

  while (hasNext) {
    const data = await listAdminAffiliateStudents(affiliateId, {
      ...params,
      page,
      limit: 100,
      cursor: undefined,
    });
    items.push(...data.items);
    hasNext = Boolean(data.pagination.has_next);
    page += 1;
    if (page > 50) break;
  }

  return items;
}

export function updateAffiliateInvitationQuota(
  affiliateId: string,
  payload: AffiliateQuotaUpdatePayload,
) {
  return apiRequest<AffiliateDetailResult>(
    `/api/admin/affiliates/${affiliateId}/invitation-quota`,
    {
      method: "PATCH",
      auth: true,
      body: payload,
    },
  ).then((result) => {
    clearAdminCachePrefix(adminCacheKey("affiliates-v2"));
    clearAdminCachePrefix(adminCacheKey("affiliates"));
    clearAdminCachePrefix(adminCacheKey("users-affiliates"));
    writeAdminCache(adminCacheKey("affiliate-detail", affiliateId), result);
    return result;
  });
}
