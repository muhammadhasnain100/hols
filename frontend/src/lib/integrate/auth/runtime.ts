"use client";

import { refreshAccessTokenForSession } from "@/lib/integrate/client";
import {
  getLastTokenRefreshAt,
  getStoredUser,
  notifyAuthLogout,
} from "@/lib/integrate/auth/storage";
import type { UserRole } from "@/lib/integrate/auth/types";
import { listCourses } from "@/lib/integrate/provider/student/lectures";
import { getStudentProfile } from "@/lib/integrate/provider/student/profile/api";
import {
  getCard,
  getCurrentMembership,
  listPlans,
  listOrders,
} from "@/lib/integrate/provider/student/payment/api";

const TEN_MINUTES_MS = 10 * 60 * 1000;
let refreshTimer: number | null = null;
let prefetchPromise: Promise<void> | null = null;

async function refreshIfDue() {
  const lastRefresh = getLastTokenRefreshAt() ?? 0;
  if (Date.now() - lastRefresh < TEN_MINUTES_MS) return;
  const token = await refreshAccessTokenForSession();
  if (!token) {
    notifyAuthLogout();
  }
}

async function prefetchStudentData() {
  await Promise.allSettled([
    getStudentProfile(),
    getCurrentMembership(),
    listOrders({ page: 1, limit: 1 }),
    listOrders({ page: 1, limit: 10 }),
    listPlans(),
    getCard(),
    // Static lecture catalog is session-cached, so refreshes reuse it without a network call.
    listCourses({ page: 1, limit: 12 }),
  ]);
}

function prefetchPortalData(role: UserRole) {
  const user = getStoredUser();
  const prefetchKey = user ? `hols_prefetched_${user.user_id}_${role}` : null;
  if (!prefetchKey || sessionStorage.getItem(prefetchKey) === "true") return;
  if (prefetchPromise) return;
  sessionStorage.setItem(prefetchKey, "true");

  prefetchPromise = (async () => {
    if (role === "student") {
      await prefetchStudentData();
    }
  })().finally(() => {
    prefetchPromise = null;
  });
}

export function startPortalAuthRuntime(role: UserRole) {
  if (typeof window === "undefined") return;

  prefetchPortalData(role);

  if (refreshTimer) return;
  refreshTimer = window.setInterval(() => {
    void refreshIfDue();
  }, TEN_MINUTES_MS);
}

export function stopPortalAuthRuntime() {
  if (refreshTimer) {
    window.clearInterval(refreshTimer);
    refreshTimer = null;
  }
}
