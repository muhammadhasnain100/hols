import { apiRequest } from "@/lib/integrate/client";

export type AffiliateCommissionItem = {
  order_id: string;
  plan_type?: string | null;
  amount: number;
  commission: number;
  currency: string;
  status: string;
  created_at?: string | null;
};

export type AffiliateEarnings = {
  total_earned: number;
  pending_payout: number;
  paid_out: number;
  currency: string;
  order_count: number;
  margin_percent?: number | null;
  next_milestone: number;
  items: AffiliateCommissionItem[];
};

export function getAffiliateEarnings(signal?: AbortSignal) {
  return apiRequest<AffiliateEarnings>("/api/affiliate/earnings", { auth: true, signal });
}
