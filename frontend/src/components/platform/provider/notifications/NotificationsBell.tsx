"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { readStoredPortalTheme } from "@/components/platform/provider/portal-theme-store";
import { useUnreadNotificationsCount } from "@/components/platform/provider/notifications/NotificationsLiveSync";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { getStoredUser } from "@/lib/integrate/auth/storage";
import {
  formatNotificationWhen,
  getUnreadNotificationsCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  notificationsInboxPath,
  NOTIFICATIONS_CHANGED_EVENT,
  setUnreadNotificationsCount,
  type AppNotification,
} from "@/lib/integrate/provider/notifications";
import { cn } from "@/lib/utils";

type PanelPosition = {
  top: number;
  right: number;
  left?: number;
  maxHeight?: number;
  sheet?: boolean;
};

const PREVIEW_LIMIT = 8;

export function NotificationsBell({
  buttonClassName,
}: {
  buttonClassName?: string;
} = {}) {
  const titleId = useId();
  const panelId = useId();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<PanelPosition>({ top: 0, right: 16, sheet: false });
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [nowMs, setNowMs] = useState<number | null>(null);
  const unreadCount = useUnreadNotificationsCount();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listNotifications({ page: 1, limit: PREVIEW_LIMIT });
      setItems(data.items);
      setUnreadNotificationsCount(data.unread_count || 0);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePosition = useCallback(() => {
    const rect = buttonRef.current?.getBoundingClientRect();
    if (!rect) return;
    const margin = 12;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const sheet = vw < 480;
    const preferred = rect.bottom + 8;
    const minTop = margin;
    const maxTop = Math.max(minTop, vh - margin - 220);
    const top = Math.min(Math.max(preferred, minTop), maxTop);
    const maxHeight = Math.max(220, vh - top - margin);

    if (sheet) {
      setPosition({ top, right: margin, left: margin, maxHeight, sheet: true });
      return;
    }

    const width = Math.min(360, vw - margin * 2);
    let right = Math.max(margin, vw - rect.right);
    if (right + width > vw - margin) {
      right = Math.max(margin, vw - margin - width);
    }
    setPosition({ top, right, left: undefined, maxHeight, sheet: false });
  }, []);

  useEffect(() => {
    setMounted(true);
    setNowMs(Date.now());
    void load();
  }, [load]);

  useEffect(() => {
    function refresh() {
      void load();
    }
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
  }, [load]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    const onPointer = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointer);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("mousedown", onPointer);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, updatePosition]);

  const markOne = async (item: AppNotification) => {
    if (item.read) return;
    setItems((current) =>
      current.map((row) => (row.notification_id === item.notification_id ? { ...row, read: true } : row)),
    );
    setUnreadNotificationsCount(Math.max(0, getUnreadNotificationsCount() - 1));
    try {
      const result = await markNotificationRead(item.notification_id);
      setUnreadNotificationsCount(result.unread_count);
    } catch {
      void load();
    }
  };

  const markAll = async () => {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadNotificationsCount(0);
    try {
      await markAllNotificationsRead();
    } catch {
      void load();
    }
  };

  const unreadLabel = unreadCount > 99 ? "99+" : String(unreadCount);
  const theme = mounted ? readStoredPortalTheme() : "light";
  const inboxHref = notificationsInboxPath(getStoredUser()?.role);
  const previewItems = items.slice(0, PREVIEW_LIMIT);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={
          mounted && unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-controls={open ? panelId : undefined}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          buttonClassName ??
            "dashboard-notify-btn relative flex h-10 w-10 items-center justify-center rounded-full sm:h-12 sm:w-12",
        )}
      >
        <SidebarSvgIcon name="bell" size={18} strokeWidth={1.8} />
        {mounted && unreadCount > 0 ? <span className="dashboard-notify-badge">{unreadLabel}</span> : null}
      </button>

      {mounted && open
        ? createPortal(
            <div
              ref={panelRef}
              id={panelId}
              role="dialog"
              aria-modal="false"
              aria-labelledby={titleId}
              data-theme={theme}
              data-lenis-prevent
              className={cn(
                "dashboard-popover dashboard-notify-panel",
                position.sheet && "dashboard-notify-panel--sheet",
              )}
              style={{
                top: position.top,
                right: position.right,
                left: position.left,
                maxHeight: position.maxHeight,
              }}
            >
              <div className="dashboard-notify-panel-header">
                <h2 id={titleId} className="font-sans min-w-0 text-sm font-semibold tracking-[0.01em]">
                  Notifications
                </h2>
                <div className="flex min-w-0 shrink-0 items-center gap-1">
                  <p className="dashboard-notify-faint text-brand-caption">
                    {loading ? "Updating…" : unreadCount > 0 ? `${unreadCount} unread` : "All caught up"}
                  </p>
                  {position.sheet ? (
                    <button
                      type="button"
                      aria-label="Close notifications"
                      onClick={() => setOpen(false)}
                      className="adviser-onboarding-close inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                    >
                      <SidebarSvgIcon name="cross" size={22} strokeWidth={2.2} />
                    </button>
                  ) : null}
                </div>
              </div>

              <NotificationList
                items={previewItems}
                loading={loading}
                nowMs={nowMs}
                onOpen={async (item) => {
                  await markOne(item);
                  setOpen(false);
                }}
              />

              <div className="dashboard-notify-panel-footer">
                <button
                  type="button"
                  onClick={() => void markAll()}
                  disabled={unreadCount === 0}
                  className="font-sans inline-flex min-h-11 flex-1 cursor-pointer items-center justify-center rounded-xl px-3 text-sm font-semibold transition hover:bg-[var(--notify-soft)] disabled:cursor-default disabled:opacity-50"
                >
                  Mark all read
                </button>
                <Link
                  href={inboxHref}
                  onClick={() => setOpen(false)}
                  className="dashboard-navy-btn font-sans inline-flex min-h-11 flex-1 items-center justify-center rounded-xl px-3 text-sm font-semibold text-white"
                >
                  View all
                </Link>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function NotificationList({
  items,
  loading,
  nowMs,
  onOpen,
}: {
  items: AppNotification[];
  loading: boolean;
  nowMs?: number | null;
  onOpen: (item: AppNotification) => void;
}) {
  if (loading && items.length === 0) {
    return (
      <div className="dashboard-notify-list py-1" aria-busy="true" aria-label="Loading notifications">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex gap-3 px-4 py-3">
            <span className="dashboard-skeleton-block mt-1.5 h-2 w-2 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <span className="dashboard-skeleton-block h-3.5 w-[78%] rounded-full" />
              <span className="dashboard-skeleton-block h-3 w-[52%] rounded-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="px-4 py-8 text-center">
        <p className="font-sans text-sm font-semibold">No notifications yet</p>
        <p className="dashboard-notify-faint text-brand-caption mt-1">New activity will show up here.</p>
      </div>
    );
  }

  return (
    <div className="dashboard-notify-list">
      {items.map((item) => {
        const href = item.href || "#";
        const inner = (
          <>
            <span
              className={cn("dashboard-notify-dot", item.read && "dashboard-notify-dot--read")}
              aria-hidden
            />
            <span className="min-w-0 flex-1 overflow-hidden">
              <span className="font-sans block text-sm font-semibold leading-snug break-words">{item.title}</span>
              <span className="dashboard-notify-meta text-brand-caption mt-1 line-clamp-2 block break-words">
                {item.body}
              </span>
              {item.created_at ? (
                <span className="dashboard-notify-faint mt-1 block text-[0.68rem]">
                  {formatNotificationWhen(item.created_at, nowMs)}
                </span>
              ) : null}
            </span>
          </>
        );

        if (item.href) {
          return (
            <Link
              key={item.notification_id}
              href={href}
              onClick={() => onOpen(item)}
              className={cn("dashboard-notify-item", !item.read && "dashboard-notify-item--unread")}
            >
              {inner}
            </Link>
          );
        }

        return (
          <button
            key={item.notification_id}
            type="button"
            onClick={() => onOpen(item)}
            className={cn("dashboard-notify-item w-full text-left", !item.read && "dashboard-notify-item--unread")}
          >
            {inner}
          </button>
        );
      })}
    </div>
  );
}
