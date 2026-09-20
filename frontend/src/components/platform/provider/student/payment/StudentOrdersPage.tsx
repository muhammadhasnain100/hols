"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PaginationControls } from "@/components/platform/provider/admin/shared";
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

const PAGE_SIZE = 10;

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
  const [hasPrevious, setHasPrevious] = useState(false);

  const applyPagination = useCallback((pageNum: number, pagination: {
    total: number;
    has_next: boolean;
    has_previous?: boolean;
  }) => {
    setTotal(pagination.total);
    setHasNext(Boolean(pagination.has_next));
    setHasPrevious(pagination.has_previous ?? pageNum > 1);
  }, []);

  const loadOrders = useCallback(async (pageNum: number, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const res = await listOrders({ page: pageNum, limit: PAGE_SIZE }, signal);
      if (signal?.aborted) return;
      setOrders(res.items);
      applyPagination(pageNum, res.pagination);
    } catch (err) {
      if (signal?.aborted) return;
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError(err instanceof ApiRequestError ? err.message : "Failed to load orders.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [applyPagination]);

  useEffect(() => {
    const controller = new AbortController();

    if (page === 1) {
      const cached = getCachedOrders({ page: 1, limit: PAGE_SIZE });
      if (cached) {
        setOrders(cached.items);
        applyPagination(1, cached.pagination);
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

          <div className="mt-5 grid min-w-0 gap-2.5">
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
                  className="dashboard-row flex min-w-0 items-center justify-between gap-3 overflow-hidden rounded-2xl bg-[color:var(--dash-soft)]/80 px-3.5 py-3.5 sm:px-4"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[color:var(--dash-text)]">
                      <SidebarSvgIcon
                        name={PLAN_ICONS[order.plan_type]}
                        size={16}
                        strokeWidth={1.9}
                      />
                    </span>
                    <div className="min-w-0 overflow-hidden">
                      <p className="font-sans truncate text-sm font-medium text-[color:var(--dash-text)]">
                        {planLabels[order.plan_type]} plan
                      </p>
                      <p className="text-brand-caption truncate text-[color:var(--dash-faint)]">
                        {formatDate(order.created_at)}
                        {latest?.order_id === order.order_id && page === 1 ? " · Latest" : ""}
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

          {total > 0 ? (
            <PaginationControls
              page={page}
              total={total}
              pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
              hasNext={hasNext}
              hasPrevious={hasPrevious || page > 1}
              loading={loading}
              onPrevious={() => {
                scrollAppToTopSoon();
                setPage((current) => Math.max(1, current - 1));
              }}
              onNext={() => {
                scrollAppToTopSoon();
                setPage((current) => current + 1);
              }}
            />
          ) : null}
        </>
      )}
    </section>
  );
}

export function StudentOrdersPage() {
  return <StudentOrdersPanel />;
}
