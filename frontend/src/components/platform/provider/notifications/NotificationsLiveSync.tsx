"use client";

import { useEffect, useSyncExternalStore } from "react";
import { getAccessToken } from "@/lib/integrate/auth/storage";
import {
  ADMIN_STATS_ACTIONS,
  listNotifications,
  notificationWebsocketUrl,
  notifyAdminStatsChanged,
  notifyNotificationsChanged,
  setUnreadNotificationsCount,
  subscribeUnreadNotifications,
  getUnreadNotificationsCount,
  getUnreadNotificationsServerSnapshot,
  type NotificationWsEvent,
} from "@/lib/integrate/provider/notifications";

export function useUnreadNotificationsCount() {
  return useSyncExternalStore(
    subscribeUnreadNotifications,
    getUnreadNotificationsCount,
    getUnreadNotificationsServerSnapshot,
  );
}

/** Keeps the sidebar unread badge live on every portal page. */
export function NotificationsLiveSync() {
  useEffect(() => {
    let closed = false;
    const token = getAccessToken();
    if (!token) {
      return () => {
        closed = true;
      };
    }

    void listNotifications({ page: 1, limit: 1 })
      .then((data) => {
        if (!closed) setUnreadNotificationsCount(data.unread_count || 0);
      })
      .catch(() => {
        /* Keep the last known count if a page refetch fails. */
      });

    let socket: WebSocket | null = null;
    let pingTimer: number | undefined;
    let retryTimer: number | undefined;
    let attempt = 0;

    const connect = () => {
      const access = getAccessToken();
      if (!access || closed) return;
      socket = new WebSocket(notificationWebsocketUrl(access));
      socket.onopen = () => {
        attempt = 0;
        pingTimer = window.setInterval(() => {
          if (socket?.readyState === WebSocket.OPEN) socket.send("ping");
        }, 25000);
      };
      socket.onmessage = (event) => {
        let payload: NotificationWsEvent | null = null;
        try {
          payload = JSON.parse(String(event.data)) as NotificationWsEvent;
        } catch {
          return;
        }
        if (!payload) return;
        if (typeof payload.unread_count === "number") {
          setUnreadNotificationsCount(payload.unread_count);
        }
        if (payload.type === "hello") return;
        if (payload.type === "notification" || payload.type === "read" || payload.type === "read_all") {
          notifyNotificationsChanged();
          if (payload.type === "notification" && payload.item?.action && ADMIN_STATS_ACTIONS.has(payload.item.action)) {
            notifyAdminStatsChanged();
          }
        }
      };
      socket.onclose = () => {
        if (pingTimer) window.clearInterval(pingTimer);
        if (closed) return;
        attempt += 1;
        retryTimer = window.setTimeout(connect, Math.min(15000, 1000 * 2 ** Math.min(attempt, 4)));
      };
    };

    connect();
    return () => {
      closed = true;
      if (pingTimer) window.clearInterval(pingTimer);
      if (retryTimer) window.clearTimeout(retryTimer);
      socket?.close();
    };
  }, []);

  return null;
}
