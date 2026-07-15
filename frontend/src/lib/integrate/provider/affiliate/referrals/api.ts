import { apiRequest } from "@/lib/integrate/client";
import type {
  AdminPaginationMeta,
  PaginationParams,
  StudentSummary,
} from "@/lib/integrate/provider/admin/users/types";

export type AffiliateInviteUrl = {
  affiliate_id: string;
  invite_code?: string | null;
  signup_path: string;
  public_url: string;
  student_count: number;
  invitation_quota?: number | null;
};

export type AffiliateInviteResolve = {
  affiliate_id: string;
  invite_code: string;
  first_name: string;
  last_name: string;
  student_count: number;
  invitation_quota?: number | null;
};

export type AffiliateInvitePayload = {
  email?: string;
  emails?: string[];
  message?: string;
};

export type AffiliateInviteResult = {
  queued: boolean;
  public_url: string;
  recipients: string[];
  recipient_count: number;
};

function buildQuery(params: PaginationParams) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  if (params.cursor) search.set("cursor", params.cursor);
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function getAffiliateInviteUrl(signal?: AbortSignal) {
  return apiRequest<AffiliateInviteUrl>("/api/affiliate/invite-url", { auth: true, signal });
}

export function resolveAffiliateInviteCode(inviteCode: string, signal?: AbortSignal) {
  return apiRequest<AffiliateInviteResolve>(
    `/api/affiliate/invite/${encodeURIComponent(inviteCode)}`,
    { signal },
  );
}

export function sendAffiliateInvites(payload: AffiliateInvitePayload) {
  return apiRequest<AffiliateInviteResult>("/api/affiliate/invites", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function listAffiliateReferralStudents(params: PaginationParams = {}, signal?: AbortSignal) {
  return apiRequest<{ items: StudentSummary[]; pagination: AdminPaginationMeta }>(
    `/api/affiliate/referrals/students${buildQuery(params)}`,
    { auth: true, signal },
  );
}
