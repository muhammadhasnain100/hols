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
} from "@/lib/integrate/provider/admin/users/types";

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
  const query = search.toString();
  return query ? `?${query}` : "";
}

type AffiliateListResult = {
  items: AffiliateSummary[];
  pagination: AdminPaginationMeta;
};

export function getCachedAdminAffiliates(params: PaginationParams = {}) {
  return readAdminCache<AffiliateListResult>(
    adminCacheKey("affiliates", params.page, params.limit, params.cursor),
  );
}

export function getCachedAffiliate(affiliateId: string) {
  return readAdminCache<AffiliateDetailResult>(adminCacheKey("affiliate-detail", affiliateId));
}

export function listAdminAffiliates(params: PaginationParams = {}) {
  return cachedAdminRequest<AffiliateListResult>(
    adminCacheKey("affiliates", params.page, params.limit, params.cursor),
    `/api/admin/affiliates${buildQuery(params)}`,
  );
}

export function createAffiliate(payload: AffiliateCreatePayload) {
  return apiRequest<AffiliateCreateResult>("/api/admin/affiliates", {
    method: "POST",
    auth: true,
    body: payload,
  }).then((result) => {
    clearAdminCachePrefix(adminCacheKey("affiliates"));
    clearAdminCachePrefix(adminCacheKey("users-affiliates"));
    return result;
  });
}

export function getAffiliate(affiliateId: string) {
  return cachedAdminRequest<AffiliateDetailResult>(
    adminCacheKey("affiliate-detail", affiliateId),
    `/api/admin/affiliates/${affiliateId}`,
  );
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
    clearAdminCachePrefix(adminCacheKey("affiliates"));
    clearAdminCachePrefix(adminCacheKey("users-affiliates"));
    writeAdminCache(adminCacheKey("affiliate-detail", affiliateId), result);
    return result;
  });
}
