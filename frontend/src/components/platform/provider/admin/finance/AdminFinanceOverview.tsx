"use client";

import type { ReactNode } from "react";
import { SalesMetricGrid } from "@/components/platform/provider/charts/SalesCharts";
import type { AdminFinance } from "@/lib/integrate/provider/admin/sales";
import { formatMoney } from "@/lib/integrate/provider/student/payment/types";

export type FinanceMetric = {
  label: string;
  value: string;
  hint?: string;
  href?: string;
};

export function dashboardCountMetrics(finance: AdminFinance, loading?: boolean): FinanceMetric[] {
  const dash = (value: string) => (loading ? "—" : value);
  return [
    {
      label: "Students",
      value: dash(String(finance.student_count ?? 0)),
      hint: "Registered student accounts",
      href: "/admin/students",
    },
    {
      label: "Affiliates",
      value: dash(String(finance.affiliate_count ?? 0)),
      hint: "Registered affiliate accounts",
      href: "/admin/affiliates",
    },
    {
      label: "Orders",
      value: dash(String(finance.order_count ?? 0)),
      hint: "Paid membership purchases",
      href: "/admin/reports",
    },
  ];
}

export function dashboardRevenueMetrics(finance: AdminFinance, currency: string, loading?: boolean): FinanceMetric[] {
  const money = (value: number) => (loading ? "—" : formatMoney(value, currency));
  return [
    { label: "Total revenue", value: money(finance.revenue), hint: "Gross collected" },
    { label: "Total profit", value: money(finance.profit), hint: "After affiliate commission" },
    {
      label: "Affiliate earning",
      value: money(finance.affiliate_earned),
      hint: "Commission credited to affiliates",
    },
    { label: "Affiliate payout", value: money(finance.affiliate_paid_out), hint: "Accepted payouts" },
  ];
}

export function payoutFinanceMetrics(finance: AdminFinance, currency: string, loading?: boolean): FinanceMetric[] {
  const money = (value: number) => (loading ? "—" : formatMoney(value, currency));
  return [
    { label: "Pending amount", value: money(finance.affiliate_pending), hint: "Payout requests in review" },
    { label: "Payout", value: money(finance.affiliate_paid_out), hint: "Accepted payouts" },
    { label: "Available", value: money(finance.affiliate_available), hint: "Ready for affiliates to request" },
    { label: "Lock amount", value: money(finance.affiliate_lock), hint: "Held until payout time" },
  ];
}

export function dashboardPayoutMetrics(finance: AdminFinance, currency: string, loading?: boolean): FinanceMetric[] {
  return payoutFinanceMetrics(finance, currency, loading);
}

export function dashboardMoneyMetrics(finance: AdminFinance, currency: string, loading?: boolean): FinanceMetric[] {
  return [...dashboardRevenueMetrics(finance, currency, loading), ...dashboardPayoutMetrics(finance, currency, loading)];
}

export function studentsFinanceMetrics(finance: AdminFinance, currency: string, loading?: boolean): FinanceMetric[] {
  const dash = (value: string) => (loading ? "—" : value);
  const money = (value: number) => (loading ? "—" : formatMoney(value, currency));
  return [
    { label: "Students", value: dash(String(finance.student_count ?? 0)), hint: "Registered student accounts" },
    { label: "Orders", value: dash(String(finance.order_count ?? 0)), hint: "Paid membership purchases" },
    { label: "Student spend", value: money(finance.revenue), hint: "Gross collected" },
    { label: "Your earnings", value: money(finance.profit), hint: "After affiliate commission" },
  ];
}

export function affiliatesFinanceMetrics(finance: AdminFinance, currency: string, loading?: boolean): FinanceMetric[] {
  const dash = (value: string) => (loading ? "—" : value);
  const money = (value: number) => (loading ? "—" : formatMoney(value, currency));
  return [
    { label: "Affiliates", value: dash(String(finance.affiliate_count ?? 0)), hint: "Registered affiliate accounts" },
    { label: "Orders", value: dash(String(finance.order_count ?? 0)), hint: "Paid membership purchases" },
    { label: "Student spend", value: money(finance.revenue), hint: "Gross collected" },
    { label: "Your earnings", value: money(finance.profit), hint: "After affiliate commission" },
  ];
}

export function reportsFinanceMetrics(finance: AdminFinance, currency: string, loading?: boolean): FinanceMetric[] {
  return studentsFinanceMetrics(finance, currency, loading);
}

export function FinanceOverviewCard({
  headerRight,
  items,
  extra,
}: {
  title?: string;
  caption?: string;
  headerRight?: ReactNode;
  items?: FinanceMetric[];
  extra?: ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-3">
      {headerRight ? <div className="flex min-w-0 justify-end">{headerRight}</div> : null}
      {items && items.length > 0 ? <SalesMetricGrid items={items} /> : null}
      {extra}
    </div>
  );
}
