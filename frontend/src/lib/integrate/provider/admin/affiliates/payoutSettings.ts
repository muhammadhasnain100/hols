import { apiRequest } from "@/lib/integrate/client";

export type PayoutSettings = {
  payout_lock_days: number;
  payout_lock_seconds?: number;
  updated_by?: string | null;
  updated_at?: string | null;
};

export function getPayoutSettings(signal?: AbortSignal) {
  return apiRequest<PayoutSettings>("/api/admin/affiliates/payout-settings", {
    auth: true,
    signal,
  });
}

export function updatePayoutSettings(payout_lock_days: number) {
  return apiRequest<PayoutSettings>("/api/admin/affiliates/payout-settings", {
    method: "PUT",
    auth: true,
    body: { payout_lock_days },
  });
}
