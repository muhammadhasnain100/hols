"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PaymentPageLayout } from "@/components/platform/provider/student/payment/PaymentPageLayout";
import { Button } from "@/components/ui/Button";
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

function OrderRow({ order }: { order: Order }) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-[0_1px_3px_rgba(21,39,68,0.06)] md:p-5">
      <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/40">Order</p>
      <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-primary">
            {planLabels[order.plan_type]} · {formatMoney(order.amount, order.currency)}
          </p>
          <p className="mt-1 text-[13px] text-primary/50">{formatDate(order.created_at)}</p>
        </div>
        <span className="inline-flex w-fit shrink-0 rounded-full bg-primary/[0.06] px-2.5 py-1 text-xs font-medium capitalize text-primary/70">
          {order.status}
        </span>
      </div>
    </div>
  );
}

export function StudentOrdersPage() {
  const cachedFirstPage = getCachedOrders({ page: 1, limit: 10 });
  const [loading, setLoading] = useState(!cachedFirstPage);
  const [error, setError] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>(cachedFirstPage?.items ?? []);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(cachedFirstPage?.pagination.has_next ?? false);

  const loadOrders = useCallback(async (pageNum: number, signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const res = await listOrders({ page: pageNum, limit: 10 }, signal);
      if (signal?.aborted) return;
      setOrders(res.items);
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

  return (
    <PaymentPageLayout
      title="Orders"
      description="Review your purchase history and membership receipts."
      visual="orders"
    >
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <section>
        <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary/40">History</p>
        <h2 className="mt-1 text-[15px] font-semibold text-primary">Order history</h2>
        <p className="mt-1 text-[13px] text-primary/45">Membership purchases on this account.</p>

        {loading ? (
          <div className="mt-6 flex justify-center py-8">
            <div className="h-8 w-8 animate-pulse rounded-full bg-primary/10" />
          </div>
        ) : orders.length === 0 ? (
          <p className="mt-6 rounded-2xl bg-white px-5 py-8 text-center text-[13px] text-primary/45 shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
            No orders yet.
          </p>
        ) : (
          <div className="mt-5 grid gap-3">
            {orders.map((order) => (
              <OrderRow key={order.order_id} order={order} />
            ))}
          </div>
        )}

        <div className="mt-5 flex items-center justify-between gap-3 border-t border-primary/[0.06] pt-5">
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          <span className="text-[12px] text-primary/40">Page {page}</span>
          <Button
            type="button"
            variant="secondary"
            size="md"
            disabled={!hasNext || loading}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      </section>
    </PaymentPageLayout>
  );
}
