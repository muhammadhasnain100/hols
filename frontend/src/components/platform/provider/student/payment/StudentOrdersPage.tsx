"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
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
} from "@/lib/integrate/provider/student/payment/types";

export function StudentOrdersPage() {
  const cachedFirstPage = getCachedOrders({ page: 1, limit: 10 });
  const [loading, setLoading] = useState(!cachedFirstPage);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>(cachedFirstPage?.items ?? []);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(cachedFirstPage?.pagination.total ?? 0);
  const [hasNext, setHasNext] = useState(cachedFirstPage?.pagination.has_next ?? false);

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
    const timer = window.setTimeout(() => void loadOrders(page, controller.signal), 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const latest = orders[0];

  return (
    <PaymentPageLayout title="Orders">
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <div className="grid w-full items-start gap-4 lg:grid-cols-[1.9fr_1fr]">
        <div className="flex flex-col gap-4">
          <section className="dashboard-hero relative overflow-hidden rounded-2xl p-5 md:p-6">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
              Order history
            </p>
            <div className="mt-2 flex items-end gap-2">
              <span className="font-sans text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-[2.5rem] md:leading-none">
                {loading && !cachedFirstPage ? "—" : total}
              </span>
              <span className="mb-1 text-brand-caption font-medium text-[color:var(--dash-faint)]">
                {total === 1 ? "order" : "orders"}
              </span>
            </div>
            <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">
              {latest
                ? `Latest · ${planLabels[latest.plan_type]} · ${formatMoney(latest.amount, latest.currency)}`
                : "No purchases on this account yet."}
            </p>
          </section>

          <section className="dashboard-surface rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <h2 className="font-sans text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)]">
                Recent orders
              </h2>
              <span className="text-brand-caption font-medium text-[color:var(--dash-accent)]">
                Page {page}
              </span>
            </div>

            <div className="mt-4 space-y-2.5">
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="h-8 w-8 animate-pulse rounded-full bg-[color:var(--dash-soft)]" />
                </div>
              ) : orders.length === 0 ? (
                <p className="text-brand-body py-6 text-center text-[color:var(--dash-faint)]">
                  No orders yet.
                </p>
              ) : (
                orders.map((order) => (
                  <div
                    key={order.order_id}
                    className="dashboard-row flex items-center justify-between gap-3 rounded-xl px-3.5 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
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

            <div className="mt-4 flex items-center justify-between gap-2">
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
        </div>

        <section className="dashboard-surface rounded-2xl p-5">
          <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
            Summary
          </p>
          <p className="font-sans mt-2 text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)]">
            {loading && !cachedFirstPage ? "—" : total}
          </p>
          <p className="text-brand-body mt-1 text-[color:var(--dash-muted)]">
            Total membership purchases
          </p>
          {latest ? (
            <div className="mt-4 border-t border-[color:var(--dash-surface-border)] pt-4">
              <p className="text-brand-caption text-[color:var(--dash-faint)]">Latest order</p>
              <p className="font-sans mt-1 text-sm font-medium text-[color:var(--dash-text)]">
                {planLabels[latest.plan_type]} · {formatMoney(latest.amount, latest.currency)}
              </p>
              <p className="text-brand-caption mt-0.5 text-[color:var(--dash-faint)]">
                {formatDate(latest.created_at)}
              </p>
            </div>
          ) : null}
        </section>
      </div>
    </PaymentPageLayout>
  );
}
