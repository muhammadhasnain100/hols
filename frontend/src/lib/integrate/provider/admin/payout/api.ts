import { apiRequest } from "@/lib/integrate/client";
import type { AffiliatePayoutItem } from "@/lib/integrate/provider/affiliate/payout";

export type AdminPayoutItem = AffiliatePayoutItem & {
  affiliate_id?: string | null;
  affiliate_name?: string | null;
  affiliate_email?: string | null;
};

export type AdminPayoutOverview = {
  pending: AdminPayoutItem[];
  items: AdminPayoutItem[];
  pending_count: number;
  pending_amount: number;
  paid_amount: number;
  rejected_count: number;
  currency: string;
};

export type AdminPayoutReviewResult = {
  payout: AdminPayoutItem;
};

export type AdminPayoutReviewAction = "accept" | "reject";

export function listAdminPayouts(signal?: AbortSignal) {
  return apiRequest<AdminPayoutOverview>("/api/admin/affiliates/payouts", { auth: true, signal });
}

export function reviewAdminPayout(
  payoutId: string,
  action: AdminPayoutReviewAction,
  signal?: AbortSignal,
) {
  return apiRequest<AdminPayoutReviewResult>(`/api/admin/affiliates/payouts/${payoutId}/${action}`, {
    method: "POST",
    auth: true,
    body: {},
    signal,
  });
}
