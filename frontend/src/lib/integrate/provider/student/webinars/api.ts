import { apiFormRequest, apiRequest } from "@/lib/integrate/client";
import type {
  WebinarCreatePayload,
  WebinarNotification,
  WebinarRegistration,
  WebinarSummary,
  WebinarUpdatePayload,
} from "@/lib/integrate/provider/student/webinars/types";
import type { AdminPaginationMeta } from "@/lib/integrate/provider/admin/users/types";

export type {
  WebinarCreatePayload,
  WebinarNotification,
  WebinarRegistration,
  WebinarSummary,
  WebinarUpdatePayload,
} from "@/lib/integrate/provider/student/webinars/types";

function buildQuery(params: { page?: number; limit?: number }) {
  const search = new URLSearchParams();
  if (params.page) search.set("page", String(params.page));
  if (params.limit) search.set("limit", String(params.limit));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function listWebinars(params: { page?: number; limit?: number } = {}) {
  return apiRequest<{ items: WebinarSummary[]; pagination: AdminPaginationMeta }>(
    `/api/webinars${buildQuery(params)}`,
    { auth: true },
  );
}

export function getWebinar(webinarId: string) {
  return apiRequest<{ webinar: WebinarSummary }>(
    `/api/webinars/${encodeURIComponent(webinarId)}`,
    { auth: true },
  );
}

export function listWebinarNotifications() {
  return apiRequest<{ items: WebinarNotification[] }>("/api/webinars/notifications", {
    auth: true,
  });
}

export function listMyWebinarBookings() {
  return apiRequest<{ items: WebinarRegistration[]; pagination: AdminPaginationMeta }>(
    "/api/webinars/mine",
    { auth: true },
  );
}

export function bookWebinar(webinarId: string, paymentMethodId?: string) {
  return apiRequest<{ registration: WebinarRegistration; webinar: WebinarSummary }>(
    `/api/webinars/${encodeURIComponent(webinarId)}/book`,
    {
      method: "POST",
      auth: true,
      body: paymentMethodId ? { payment_method_id: paymentMethodId } : {},
    },
  );
}

export function createWebinar(payload: WebinarCreatePayload) {
  return apiRequest<{ webinar: WebinarSummary }>("/api/webinars", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function uploadWebinarThumbnail(webinarId: string, file: File) {
  const formData = new FormData();
  formData.append("thumbnail", file);
  return apiFormRequest<{ webinar: WebinarSummary }>(
    `/api/webinars/${encodeURIComponent(webinarId)}/thumbnail`,
    formData,
    { auth: true, method: "POST" },
  );
}

export function updateWebinar(webinarId: string, payload: WebinarUpdatePayload) {
  return apiRequest<{ webinar: WebinarSummary }>(
    `/api/webinars/${encodeURIComponent(webinarId)}`,
    {
      method: "PATCH",
      auth: true,
      body: payload,
    },
  );
}

export function listWebinarRegistrants(
  webinarId: string,
  params: { page?: number; limit?: number } = {},
) {
  return apiRequest<{ items: WebinarRegistration[]; pagination: AdminPaginationMeta }>(
    `/api/webinars/${encodeURIComponent(webinarId)}/registrants${buildQuery(params)}`,
    { auth: true },
  );
}
