"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import {
  OrderListRowsSkeleton,
  OrdersPageSkeleton,
} from "@/components/platform/provider/student/DashboardSkeletons";
import { PaymentPageLayout } from "@/components/platform/provider/student/payment/PaymentPageLayout";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCachedOrders,
  listOrders,
  type Order,
} from "@/lib/integrate/provider/student/payment/api";
import {
  formatDate,
  formatMoney,
  planLabels,
  type PlanType,
} from "@/lib/integrate/provider/student/payment/types";

export function StudentOrdersPage() {
  // Keep SSR and first client paint identical — never read session cache during render.
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const loadOrders = useCallback(async (pageNum: number, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const res = await listOrders({ page: pageNum, limit: 10 }, signal);
      if (signal?.aborted) return;
      setOrders(res.items);
      setTotal(res.pagination.total);
      setHasNext(res.pagination.has_next);
    } catch (err) {
      if (signal?.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof ApiRequestError ? err.message : "Failed to load orders.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    if (page === 1) {
      const cached = getCachedOrders({ page: 1, limit: 10 });
      if (cached) {
        setOrders(cached.items);
        setTotal(cached.pagination.total);
        setHasNext(cached.pagination.has_next);
        setLoading(false);
      }
    }

    const timer = window.setTimeout(() => void loadOrders(page, controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const latest = orders[0];
  const currency = latest?.currency ?? "USD";
  const pageSpent = orders.reduce((sum, order) => sum + order.amount, 0);
  const planCounts = orders.reduce(
    (acc, order) => {
      acc[order.plan_type] = (acc[order.plan_type] ?? 0) + 1;
      return acc;
    },
    {} as Partial<Record<PlanType, number>>,
  );
  const topPlan = (Object.entries(planCounts) as [PlanType, number][]).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const completedCount = orders.filter((order) =>
    /complete|paid|success|active/i.test(order.status),
  ).length;
  const showPlaceholder = loading && orders.length === 0;

  return (
    <PaymentPageLayout title="Orders">
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {loading && orders.length === 0 ? (
        <OrdersPageSkeleton />
      ) : (
        <>
      <section className="dashboard-hero relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6">
        <div className="flex flex-col gap-4 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
              Order history
            </p>
            <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
              <span className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                {showPlaceholder ? "—" : total}
              </span>
              <span className="mb-0.5 text-brand-caption font-medium text-[color:var(--dash-faint)]">
                {total === 1 ? "order" : "orders"}
              </span>
            </div>
            <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">
              {latest
                ? `Latest · ${planLabels[latest.plan_type]} · ${formatMoney(latest.amount, latest.currency)}`
                : "No purchases on this account yet."}
            </p>
          </div>

          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5">
            <Link
              href="/student/payment"
              className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-[color:var(--dash-text)] transition sm:px-5"
            >
              View plans
            </Link>
            <Link
              href="/student/payment/card"
              className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-3 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:px-5"
            >
              Payment card
            </Link>
          </div>
        </div>
      </section>

      <div className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <section className="dashboard-surface order-2 min-w-0 rounded-2xl p-4 sm:p-5 lg:order-1">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
              Recent orders
            </h2>
            <span className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-accent)]">
              Page {page}
            </span>
          </div>

          <div className="mt-4 space-y-2.5">
            {loading ? (
              <OrderListRowsSkeleton />
            ) : orders.length === 0 ? (
              <p className="text-brand-body py-6 text-center text-[color:var(--dash-faint)]">
                No orders yet.
              </p>
            ) : (
              orders.map((order) => (
                <div
                  key={order.order_id}
                  className="dashboard-row flex items-center justify-between gap-2 rounded-xl px-2.5 py-2.5 sm:gap-3 sm:px-3.5 sm:py-3"
                >
                  <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DDE466]/15 text-[color:var(--dash-accent)]">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                      </svg>
                    </span>
                    <div className="min-w-0">
                      <p className="font-sans truncate text-sm font-medium text-[color:var(--dash-text)]">
                        {planLabels[order.plan_type]} plan
                      </p>
                      <p className="text-brand-caption truncate text-[color:var(--dash-faint)]">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <span className="font-sans shrink-0 text-sm font-semibold text-[color:var(--dash-accent)]">
                    {formatMoney(order.amount, order.currency)}
                  </span>
                </div>
              ))
            )}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={!hasNext || loading}
              onClick={() => setPage((p) => p + 1)}
              className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center justify-center rounded-full px-4 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </section>

        <section className="dashboard-surface order-1 min-w-0 rounded-2xl p-4 sm:p-5 lg:order-2">
          <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
            Summary
          </p>
          <p className="font-sans mt-2 text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)]">
            {showPlaceholder ? "—" : total}
          </p>
          <p className="text-brand-body mt-1 text-[color:var(--dash-muted)]">
            Total membership purchases
          </p>

          <div className="mt-4 grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="rounded-xl bg-[color:var(--dash-soft)] px-3 py-3 sm:px-3.5">
              <p className="text-brand-caption text-[color:var(--dash-faint)]">Page total</p>
              <p className="font-sans mt-1 truncate text-sm font-semibold text-[color:var(--dash-text)]">
                {showPlaceholder ? "—" : formatMoney(pageSpent, currency)}
              </p>
            </div>
            <div className="rounded-xl bg-[color:var(--dash-soft)] px-3 py-3 sm:px-3.5">
              <p className="text-brand-caption text-[color:var(--dash-faint)]">On this page</p>
              <p className="font-sans mt-1 text-sm font-semibold text-[color:var(--dash-text)]">
                {showPlaceholder ? "—" : orders.length}
              </p>
            </div>
            <div className="rounded-xl bg-[color:var(--dash-soft)] px-3 py-3 sm:px-3.5">
              <p className="text-brand-caption text-[color:var(--dash-faint)]">Completed</p>
              <p className="font-sans mt-1 text-sm font-semibold text-[color:var(--dash-text)]">
                {showPlaceholder ? "—" : completedCount}
              </p>
            </div>
            <div className="rounded-xl bg-[color:var(--dash-soft)] px-3 py-3 sm:px-3.5">
              <p className="text-brand-caption text-[color:var(--dash-faint)]">Top plan</p>
              <p className="font-sans mt-1 truncate text-sm font-semibold text-[color:var(--dash-text)]">
                {topPlan ? planLabels[topPlan[0]] : "—"}
              </p>
            </div>
          </div>

          {latest ? (
            <div className="mt-4 border-t border-[color:var(--dash-surface-border)] pt-4">
              <p className="text-brand-caption text-[color:var(--dash-faint)]">Latest order</p>
              <p className="font-sans mt-1 text-sm font-medium text-[color:var(--dash-text)]">
                {planLabels[latest.plan_type]} · {formatMoney(latest.amount, latest.currency)}
              </p>
              <p className="text-brand-caption mt-1 capitalize text-[color:var(--dash-muted)]">
                Status · {latest.status}
              </p>
              <p className="text-brand-caption mt-0.5 text-[color:var(--dash-faint)]">
                {formatDate(latest.created_at)}
              </p>
              <p className="text-brand-caption mt-2 break-all text-[color:var(--dash-faint)]">
                Order ID · {latest.order_id}
              </p>
            </div>
          ) : (
            <div className="mt-4 border-t border-[color:var(--dash-surface-border)] pt-4">
              <p className="text-brand-body text-[color:var(--dash-faint)]">
                No order details to show yet.
              </p>
            </div>
          )}

          {(planCounts.monthly || planCounts.biannual || planCounts.annual) && (
            <div className="mt-4 border-t border-[color:var(--dash-surface-border)] pt-4">
              <p className="text-brand-caption text-[color:var(--dash-faint)]">Plans on this page</p>
              <div className="mt-2 space-y-1.5">
                {(Object.entries(planCounts) as [PlanType, number][]).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between gap-2">
                    <span className="text-brand-caption text-[color:var(--dash-muted)]">
                      {planLabels[plan]}
                    </span>
                    <span className="font-sans text-sm font-semibold text-[color:var(--dash-text)]">
                      {count}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </div>
        </>
      )}
    </PaymentPageLayout>
  );
}
