import { apiRequest } from "@/lib/integrate/client";
import type { SalesSnapshot } from "@/lib/integrate/provider/admin/sales/api";
import type { AffiliateCommissionItem } from "@/lib/integrate/provider/affiliate/earnings/api";

export type DashboardPeriod = "weekly" | "monthly" | "yearly";

export type AffiliateWallet = {
  total_earned: number;
  lock_amount: number;
  available: number;
  pending?: number;
  paid_out: number;
  order_count: number;
  order_volume: number;
  currency: string;
  updated_at?: string | null;
};

export type AffiliateTimeseries = {
  period: DashboardPeriod | string;
  currency: string;
  current: SalesSnapshot;
  series: SalesSnapshot[];
};

export type AffiliateDashboard = {
  period: DashboardPeriod | string;
  wallet: AffiliateWallet;
  payout_lock_days: number;
  payout_lock_seconds?: number;
  timeseries: AffiliateTimeseries;
  totals?: SalesSnapshot;
  recent_commissions?: AffiliateCommissionItem[];
  margin_percent?: number | null;
  student_count: number;
  invite_code?: string | null;
  currency: string;
};

export function getAffiliateDashboard(period: DashboardPeriod = "weekly", signal?: AbortSignal) {
  const query = new URLSearchParams({ period });
  return apiRequest<AffiliateDashboard>(`/api/affiliate/dashboard?${query.toString()}`, {
    auth: true,
    signal,
  });
}
