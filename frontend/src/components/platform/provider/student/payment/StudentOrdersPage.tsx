"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PaymentSubnav } from "@/components/platform/provider/student/payment/PaymentSubnav";
import { studentNav } from "@/components/platform/provider/student/studentNav";
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
    // Intentionally only refetch when page changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <PortalShell role="student" title="Orders" nav={studentNav}>
      <div className="mx-auto grid w-full max-w-3xl gap-5">
        <PaymentSubnav />

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
          <h2 className="text-[15px] font-semibold text-primary">Order history</h2>
          <p className="mt-1 text-[13px] text-primary/45">Membership purchases on this account.</p>

          {loading ? (
            <div className="mt-8 flex justify-center py-6">
              <div className="h-8 w-8 animate-pulse rounded-full bg-primary/10" />
            </div>
          ) : orders.length === 0 ? (
            <p className="mt-8 text-[13px] text-primary/45">No orders yet.</p>
          ) : (
            <div className="mt-5 space-y-2.5">
              {orders.map((order) => (
                <div
                  key={order.order_id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-black/[0.05] bg-[#F5F7FA] px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-primary">
                      {planLabels[order.plan_type]} · {formatMoney(order.amount, order.currency)}
                    </p>
                    <p className="mt-0.5 truncate text-[11px] text-primary/40">
                      {formatDate(order.created_at)} · {order.status}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-medium capitalize text-primary/55">
                    {order.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <span className="text-[12px] text-primary/40">Page {page}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={!hasNext || loading}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </Button>
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
