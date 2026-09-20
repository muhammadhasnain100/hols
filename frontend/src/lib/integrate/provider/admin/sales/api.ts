import { apiRequest } from "@/lib/integrate/client";
import {
  adminCacheKey,
  cachedAdminRequest,
  readAdminCache,
} from "@/lib/integrate/provider/admin/cache";

export type SalesSnapshot = {
  period: string;
  period_key: string;
  label: string;
  starts_at?: string | null;
  sales_count: number;
  revenue: number;
  profit: number;
  affiliate_earnings: number;
  earnings: number;
  referred_count: number;
  referred_revenue: number;
  direct_count: number;
  direct_revenue: number;
  plan_monthly_count: number;
  plan_monthly_revenue: number;
  plan_biannual_count: number;
  plan_biannual_revenue: number;
  plan_annual_count: number;
  plan_annual_revenue: number;
  currency: string;
  updated_at?: string | null;
  last_order_id?: string | null;
};

export type SalesOverview = {
  currency: string;
  totals: SalesSnapshot;
  weeks: SalesSnapshot[];
  months: SalesSnapshot[];
  years: SalesSnapshot[];
  finance?: AdminFinance;
};

export type AdminFinance = {
  revenue: number;
  profit: number;
  affiliate_earned: number;
  affiliate_paid_out: number;
  affiliate_pending: number;
  affiliate_available: number;
  affiliate_lock: number;
  student_count: number;
  affiliate_count: number;
  order_count: number;
  currency: string;
  updated_at?: string | null;
};

export const emptyAdminFinance = (currency = "USD"): AdminFinance => ({
  revenue: 0,
  profit: 0,
  affiliate_earned: 0,
  affiliate_paid_out: 0,
  affiliate_pending: 0,
  affiliate_available: 0,
  affiliate_lock: 0,
  student_count: 0,
  affiliate_count: 0,
  order_count: 0,
  currency,
});

export const emptySalesSnapshot = (currency = "USD"): SalesSnapshot => ({
  period: "total",
  period_key: "all",
  label: "All time",
  sales_count: 0,
  revenue: 0,
  profit: 0,
  affiliate_earnings: 0,
  earnings: 0,
  referred_count: 0,
  referred_revenue: 0,
  direct_count: 0,
  direct_revenue: 0,
  plan_monthly_count: 0,
  plan_monthly_revenue: 0,
  plan_biannual_count: 0,
  plan_biannual_revenue: 0,
  plan_annual_count: 0,
  plan_annual_revenue: 0,
  currency,
});

function isoWeekKey(date: Date) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const year = utc.getUTCFullYear();
  const yearStart = new Date(Date.UTC(year, 0, 1));
  const week = Math.ceil(((utc.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${year}-W${String(week).padStart(2, "0")}`;
}

function startOfIsoWeek(date: Date) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() - (day - 1));
  return utc;
}

function monthLabel(year: number, monthIndex: number) {
  return new Date(Date.UTC(year, monthIndex, 1)).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function weekLabel(monday: Date) {
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const start = monday.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  const end = sunday.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  return `${start} – ${end}`;
}

export function lastWeekKeys(count = 8) {
  const monday = startOfIsoWeek(new Date());
  return Array.from({ length: count }, (_, index) => {
    const cursor = new Date(monday);
    cursor.setUTCDate(monday.getUTCDate() - (count - 1 - index) * 7);
    return { key: isoWeekKey(cursor), label: weekLabel(cursor) };
  });
}

export function lastMonthKeys(count = 12) {
  const now = new Date();
  return Array.from({ length: count }, (_, index) => {
    const cursor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - (count - 1 - index), 1));
    const key = `${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`;
    return { key, label: monthLabel(cursor.getUTCFullYear(), cursor.getUTCMonth()) };
  });
}

export function lastYearKeys(count = 5) {
  const year = new Date().getUTCFullYear();
  return Array.from({ length: count }, (_, index) => {
    const value = String(year - (count - 1 - index));
    return { key: value, label: value };
  });
}

export function alignSalesPeriods(
  stored: SalesSnapshot[],
  calendar: Array<{ key: string; label: string }>,
  currency: string,
): SalesSnapshot[] {
  const byKey = new Map(stored.map((row) => [row.period_key, row]));
  return calendar.map((item) => {
    const match = byKey.get(item.key);
    if (match) return match;
    return { ...emptySalesSnapshot(currency), period_key: item.key, label: item.label };
  });
}

export function getCachedAdminSales() {
  return readAdminCache<SalesOverview>(adminCacheKey("sales"));
}

export function getAdminSales(signal?: AbortSignal) {
  return cachedAdminRequest<SalesOverview>(adminCacheKey("sales"), "/api/payment/sales", signal);
}

export function getAffiliateSales(signal?: AbortSignal) {
  return apiRequest<SalesOverview>("/api/affiliate/sales", { auth: true, signal });
}
