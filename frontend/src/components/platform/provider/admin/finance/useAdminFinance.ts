"use client";

import { useEffect, useState } from "react";
import {
  emptyAdminFinance,
  getAdminSales,
  getCachedAdminSales,
  type AdminFinance,
  type SalesOverview,
} from "@/lib/integrate/provider/admin/sales";
import { ADMIN_STATS_CHANGED_EVENT } from "@/lib/integrate/provider/notifications";

export function useAdminFinance() {
  const [overview, setOverview] = useState<SalesOverview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const cachedSales = getCachedAdminSales();
      if (cachedSales && !cancelled) {
        setOverview(cachedSales);
        setLoading(false);
      }
      try {
        const next = await getAdminSales();
        if (!cancelled) setOverview(next);
      } catch {
        // Keep the last stored dashboard totals.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    window.addEventListener(ADMIN_STATS_CHANGED_EVENT, load);
    window.addEventListener("focus", load);
    return () => {
      cancelled = true;
      window.removeEventListener(ADMIN_STATS_CHANGED_EVENT, load);
      window.removeEventListener("focus", load);
    };
  }, []);

  const currency = overview?.finance?.currency || overview?.currency || "USD";
  const finance: AdminFinance = overview?.finance ?? emptyAdminFinance(currency);
  return {
    overview,
    finance,
    currency,
    loading: loading && !overview,
    reload: () => getAdminSales().then(setOverview),
  };
}
