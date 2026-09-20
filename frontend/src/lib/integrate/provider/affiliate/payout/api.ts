import { apiRequest } from "@/lib/integrate/client";
import type { AffiliateWallet } from "@/lib/integrate/provider/affiliate/dashboard/api";

export type AffiliatePayoutItem = {
  payout_id: string;
  affiliate_id?: string | null;
  affiliate_name?: string | null;
  affiliate_email?: string | null;
  amount: number;
  currency: string;
  status: string;
  created_at?: string | null;
  reviewed_at?: string | null;
  reviewed_by?: string | null;
};

export type AffiliatePayoutOverview = {
  wallet: AffiliateWallet;
  payout_lock_days: number;
  payout_lock_seconds?: number;
  student_count?: number;
  payouts: AffiliatePayoutItem[];
};

export type AffiliatePayoutResult = {
  payout: AffiliatePayoutItem;
  wallet: AffiliateWallet;
};

export function getAffiliatePayouts(signal?: AbortSignal) {
  return apiRequest<AffiliatePayoutOverview>("/api/affiliate/payouts", { auth: true, signal });
}

export function requestAffiliatePayout(amount?: number, signal?: AbortSignal) {
  return apiRequest<AffiliatePayoutResult>("/api/affiliate/payouts", {
    method: "POST",
    auth: true,
    body: amount != null ? { amount } : {},
    signal,
  });
}
