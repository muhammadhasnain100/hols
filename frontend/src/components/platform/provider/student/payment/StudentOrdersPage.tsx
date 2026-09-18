"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { SidebarSvgIcon, type SidebarIconName } from "@/components/platform/provider/sidebar-icons";
import {
  OrderListRowsSkeleton,
  OrdersPageSkeleton,
} from "@/components/platform/provider/student/DashboardSkeletons";
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
import { scrollAppToTopSoon } from "@/lib/scroll-to-top";

const PLAN_ICONS: Record<PlanType, SidebarIconName> = {
  monthly: "clock",
  biannual: "star",
  annual: "plans",
};

export function StudentOrdersPanel() {
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
    <section className="dashboard-glass-card min-w-0 rounded-2xl p-4 sm:p-5 md:p-6">
      <div className="min-w-0">
        <h2 className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
          Orders
        </h2>
        <p className="text-brand-body mt-1 text-sm text-[color:var(--dash-muted)] sm:text-base">
          Membership purchases on this account.
        </p>
      </div>

      {error ? (
        <div className="mt-4">
          <AuthAlert variant="error">{error}</AuthAlert>
        </div>
      ) : null}

      {loading && orders.length === 0 ? (
        <div className="mt-5">
          <OrdersPageSkeleton />
        </div>
      ) : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:gap-3">
            <div className="rounded-xl bg-[color:var(--dash-soft)] px-3 py-3 sm:px-3.5">
              <p className="text-brand-caption text-[color:var(--dash-faint)]">Total purchases</p>
              <p className="font-sans mt-1 text-lg font-semibold text-[color:var(--dash-text)]">
                {showPlaceholder ? "—" : total}
              </p>
            </div>
            <div className="rounded-xl bg-[color:var(--dash-soft)] px-3 py-3 sm:px-3.5">
              <p className="text-brand-caption text-[color:var(--dash-faint)]">Page total</p>
              <p className="font-sans mt-1 truncate text-lg font-semibold text-[color:var(--dash-text)]">
                {showPlaceholder ? "—" : formatMoney(pageSpent, currency)}
              </p>
            </div>
            <div className="rounded-xl bg-[color:var(--dash-soft)] px-3 py-3 sm:px-3.5">
              <p className="text-brand-caption text-[color:var(--dash-faint)]">Completed</p>
              <p className="font-sans mt-1 text-lg font-semibold text-[color:var(--dash-text)]">
                {showPlaceholder ? "—" : completedCount}
              </p>
            </div>
            <div className="rounded-xl bg-[color:var(--dash-soft)] px-3 py-3 sm:px-3.5">
              <p className="text-brand-caption text-[color:var(--dash-faint)]">Top plan</p>
              <p className="font-sans mt-1 truncate text-lg font-semibold text-[color:var(--dash-text)]">
                {topPlan ? planLabels[topPlan[0]] : "—"}
              </p>
            </div>
          </div>

          <div className="mt-5 space-y-1">
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
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[color:var(--dash-text)]">
                      <SidebarSvgIcon
                        name={PLAN_ICONS[order.plan_type]}
                        size={16}
                        strokeWidth={1.9}
                      />
                    </span>
                    <div className="min-w-0">
                      <p className="font-sans truncate text-sm font-medium text-[color:var(--dash-text)]">
                        {planLabels[order.plan_type]} plan
                      </p>
                      <p className="text-brand-caption truncate text-[color:var(--dash-faint)]">
                        {formatDate(order.created_at)}
                        {latest?.order_id === order.order_id ? " · Latest" : ""}
                      </p>
                    </div>
                  </div>
                  <span className="font-sans shrink-0 text-sm font-semibold text-[color:var(--dash-amount)]">
                    {formatMoney(order.amount, order.currency)}
                  </span>
                </div>
              ))
            )}
          </div>

          {page > 1 || hasNext ? (
            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
              <p className="text-brand-caption text-center text-[color:var(--dash-faint)] sm:text-left">
                Page {page}
                {total > 0 ? ` · ${total} ${total === 1 ? "order" : "orders"}` : ""}
              </p>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                <PagerButton
                  variant="prev"
                  disabled={page <= 1 || loading}
                  onClick={() => {
                    scrollAppToTopSoon();
                    setPage((current) => Math.max(1, current - 1));
                  }}
                >
                  <SidebarSvgIcon name="previous" size={16} />
                  <span className="sm:hidden">Prev</span>
                  <span className="hidden sm:inline">Previous page</span>
                </PagerButton>
                <PagerButton
                  variant="next"
                  disabled={!hasNext || loading}
                  onClick={() => {
                    scrollAppToTopSoon();
                    setPage((current) => current + 1);
                  }}
                >
                  <span className="sm:hidden">Next</span>
                  <span className="hidden sm:inline">Next page</span>
                  <SidebarSvgIcon name="next" size={16} />
                </PagerButton>
              </div>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

function PagerButton({
  children,
  disabled,
  onClick,
  variant,
}: {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
  variant: "prev" | "next";
}) {
  const className =
    variant === "next"
      ? "lesson-next-cta dashboard-navy-btn font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-white transition disabled:pointer-events-none disabled:opacity-50 disabled:hover:brightness-100 sm:w-auto"
      : "lesson-prev-cta dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50 sm:w-auto";

  return (
    <button type="button" disabled={disabled} onClick={onClick} className={className}>
      {children}
    </button>
  );
}

export function StudentOrdersPage() {
  return <StudentOrdersPanel />;
}
