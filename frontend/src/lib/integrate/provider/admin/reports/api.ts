import { apiRequest, getApiBaseUrl } from "@/lib/integrate/client";
import type { AdminPaginationMeta } from "@/lib/integrate/provider/admin/users/types";

export type ReportOrderItem = {
  order_id: string;
  created_at?: string | null;
  status?: string | null;
  plan_type?: string | null;
  amount: number;
  currency: string;
  student_user_id?: string | null;
  student_name?: string | null;
  student_email?: string | null;
  affiliate_id?: string | null;
  affiliate_name?: string | null;
  affiliate_email?: string | null;
  affiliate_commission?: number | null;
  platform_profit?: number | null;
  gateway_transaction_id?: string | null;
  payment_processor?: string | null;
  payment_method_id?: string | null;
};

export type ReportTotals = {
  order_count: number;
  revenue: number;
  commission: number;
  profit: number;
  currency: string;
};

export type ReportOrderList = {
  items: ReportOrderItem[];
  pagination: AdminPaginationMeta;
  totals: ReportTotals;
  date_from?: string | null;
  date_to?: string | null;
};

export type ReportDownloadProgress = {
  current: number;
  total: number;
  percent: number;
  message?: string;
};

type ReportWsEvent = {
  type: "start" | "batch" | "complete" | "error";
  current?: number;
  total?: number;
  percent?: number;
  items?: ReportOrderItem[];
  message?: string;
};

function buildQuery(params: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listReportOrders(
  params: {
    page?: number;
    limit?: number;
  } = {},
  signal?: AbortSignal,
) {
  return apiRequest<ReportOrderList>(`/api/admin/reports/orders${buildQuery(params)}`, {
    auth: true,
    signal,
  });
}

export function reportWebsocketUrl(params: Record<string, string>) {
  const http = getApiBaseUrl();
  const ws = http.replace(/^http/i, "ws");
  const search = new URLSearchParams(params);
  return `${ws}/api/admin/reports/export?${search.toString()}`;
}

export function downloadReportOrders(options: {
  dateFrom: string;
  dateTo: string;
  token: string;
  onProgress?: (progress: ReportDownloadProgress) => void;
  signal?: AbortSignal;
}) {
  const { dateFrom, dateTo, token, onProgress, signal } = options;

  return new Promise<ReportOrderItem[]>((resolve, reject) => {
    const socket = new WebSocket(
      reportWebsocketUrl({
        token,
        date_from: dateFrom,
        date_to: dateTo,
      }),
    );
    const rows: ReportOrderItem[] = [];
    let settled = false;
    let completed = false;

    const finish = (error?: Error) => {
      if (settled) return;
      settled = true;
      signal?.removeEventListener("abort", onAbort);
      if (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING) {
        socket.close();
      }
      if (error) reject(error);
      else resolve(rows);
    };

    function onAbort() {
      finish(new DOMException("Download cancelled", "AbortError"));
    }

    signal?.addEventListener("abort", onAbort);

    socket.onmessage = (event) => {
      let payload: ReportWsEvent | null = null;
      try {
        payload = JSON.parse(String(event.data)) as ReportWsEvent;
      } catch {
        finish(new Error("Unexpected report download message."));
        return;
      }
      if (!payload) return;

      if (payload.type === "error") {
        finish(new Error(payload.message || "Failed to export report."));
        return;
      }

      if (payload.items?.length) {
        rows.push(...payload.items);
      }

      onProgress?.({
        current: payload.current ?? rows.length,
        total: payload.total ?? rows.length,
        percent: payload.percent ?? 0,
      });

      if (payload.type === "complete") {
        completed = true;
        finish();
      }
    };

    socket.onerror = () => {
      finish(new Error("Could not connect to the report download."));
    };

    socket.onclose = () => {
      if (settled) return;
      if (completed) {
        finish();
        return;
      }
      finish(new Error("Report download closed before it finished."));
    };
  });
}
