"use client";

import type { AffiliateWallet } from "@/lib/integrate/provider/affiliate/dashboard/api";
import { formatMoney } from "@/lib/integrate/provider/student/payment/types";
import { SalesMetricGrid } from "@/components/platform/provider/charts/SalesCharts";

type WalletCardId = "total" | "lock" | "available" | "pending" | "payout" | "students" | "orders";

type AffiliateWalletCardsProps = {
  wallet?: AffiliateWallet | null;
  currency?: string;
  lockDays?: number;
  lockSeconds?: number;
  studentCount?: number;
  loading?: boolean;
  compact?: boolean;
  order?: WalletCardId[];
};

const DEFAULT_ORDER: WalletCardId[] = ["pending", "payout", "available", "lock"];

function lockHint(lockDays?: number, lockSeconds?: number) {
  if (lockSeconds != null) {
    if (lockSeconds <= 0) return "Hold is off — new commission is available immediately";
    if (lockSeconds < 3600) {
      const minutes = Math.max(1, Math.round(lockSeconds / 60));
      return `Held for ${minutes} minute${minutes === 1 ? "" : "s"} after commission`;
    }
  }
  if (lockDays != null) {
    if (lockDays === 0) return "Hold is off — new commission is available immediately";
    return `Held for ${lockDays} day${lockDays === 1 ? "" : "s"} after commission`;
  }
  return "Held until the payout period ends";
}

export function AffiliateWalletCards({
  wallet,
  currency = "USD",
  lockDays,
  lockSeconds,
  studentCount = 0,
  loading = false,
  compact = false,
  order = DEFAULT_ORDER,
}: AffiliateWalletCardsProps) {
  const money = wallet?.currency || currency;
  const cardMap: Record<WalletCardId, { label: string; value: string; hint: string }> = {
    total: {
      label: "Earning",
      value: formatMoney(wallet?.total_earned ?? 0, money),
      hint: "Commission credited on each sale",
    },
    lock: {
      label: "Lock amount",
      value: formatMoney(wallet?.lock_amount ?? 0, money),
      hint: lockHint(lockDays, lockSeconds),
    },
    available: {
      label: "Available",
      value: formatMoney(wallet?.available ?? 0, money),
      hint: "Ready to request",
    },
    pending: {
      label: "Pending amount",
      value: formatMoney(wallet?.pending ?? 0, money),
      hint: "Waiting for admin review",
    },
    payout: {
      label: "Payout",
      value: formatMoney(wallet?.paid_out ?? 0, money),
      hint: "Already paid out",
    },
    students: {
      label: "Total students",
      value: String(studentCount),
      hint: "Referred students",
    },
    orders: {
      label: "Total orders",
      value: String(wallet?.order_count ?? 0),
      hint: "Paid referred purchases",
    },
  };
  const cards = order.map((id) => cardMap[id]);

  return (
    <SalesMetricGrid
      items={cards.map((card) => ({
        label: card.label,
        value: loading ? "—" : card.value,
        hint: compact ? undefined : card.hint,
      }))}
    />
  );
}
