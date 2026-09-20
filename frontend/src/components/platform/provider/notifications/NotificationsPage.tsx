"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { Icon, Menu } from "@/components/icons";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import {
  DirectoryFilterPills,
  PaginationControls,
} from "@/components/platform/provider/admin/shared";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { affiliateNav } from "@/components/platform/provider/affiliate/affiliateNav";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { ApiRequestError } from "@/lib/integrate/client";
import type { UserRole } from "@/lib/integrate/auth/types";
import {
  formatNotificationWhen,
  getUnreadNotificationsCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATIONS_CHANGED_EVENT,
  setUnreadNotificationsCount,
  type AppNotification,
} from "@/lib/integrate/provider/notifications";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 15;

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

function navForRole(role: UserRole) {
  if (role === "admin") return adminNav;
  if (role === "affiliate") return affiliateNav;
  return studentNav;
}

export function NotificationsPage({ role }: { role: UserRole }) {
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listNotifications({
        page,
        limit: PAGE_SIZE,
        unread: filter === "unread",
      });
      setItems(data.items);
      setUnreadCount(data.unread_count || 0);
      setUnreadNotificationsCount(data.unread_count || 0);
      setTotal(data.pagination.total);
      setHasNext(Boolean(data.pagination.has_next));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load notifications.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [filter, page]);

  useEffect(() => {
    setNowMs(Date.now());
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    function refresh() {
      void load();
    }
    window.addEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener(NOTIFICATIONS_CHANGED_EVENT, refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [load]);

  async function markOne(item: AppNotification) {
    if (item.read) return;
    setItems((current) =>
      current.map((row) => (row.notification_id === item.notification_id ? { ...row, read: true } : row)),
    );
    setUnreadCount((count) => Math.max(0, count - 1));
    setUnreadNotificationsCount(Math.max(0, getUnreadNotificationsCount() - 1));
    try {
      const result = await markNotificationRead(item.notification_id);
      setUnreadCount(result.unread_count);
      setUnreadNotificationsCount(result.unread_count);
    } catch {
      void load();
    }
  }

  async function markAll() {
    setItems((current) => current.map((item) => ({ ...item, read: true })));
    setUnreadCount(0);
    setUnreadNotificationsCount(0);
    try {
      await markAllNotificationsRead();
      if (filter === "unread") {
        setItems([]);
        setTotal(0);
        setHasNext(false);
      }
    } catch {
      void load();
    }
  }

  const busy = loading && items.length === 0;
  const emptyLabel =
    filter === "unread" ? "No unread notifications" : "No notifications yet";
  const emptyHint =
    filter === "unread"
      ? "You’re all caught up. New activity will show here."
      : "Orders, signups, and account activity will appear in this inbox.";
  const inboxCountLabel = busy
    ? "Loading…"
    : filter === "unread"
      ? `${total} unread`
      : unreadCount > 0
        ? `${unreadCount} unread · ${total} total`
        : `${total} total`;

  return (
    <PortalShell
      role={role}
      title="Notifications"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={navForRole(role)}
    >
      <div className="dashboard-screen lectures-page min-w-0 overflow-x-hidden">
        <header className="mb-4 flex min-h-10 min-w-0 items-center gap-2 sm:mb-5 sm:min-h-12 sm:gap-3 md:gap-4">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={openSidebar}
            className="dashboard-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full lg:hidden sm:h-12 sm:w-12"
          >
            <Icon icon={Menu} size={18} />
          </button>
          <h1 className="font-sans min-w-0 flex-1 truncate text-lg font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl">
            Notifications
          </h1>
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <div className="flex w-full min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
            <DirectoryFilterPills
              label="Notification filter"
              value={filter}
              onChange={(value) => {
                setFilter(value);
                setPage(1);
              }}
              options={[
                { id: "all", label: "All" },
                { id: "unread", label: "Unread" },
              ]}
            />
            <button
              type="button"
              disabled={unreadCount === 0 || loading}
              onClick={() => void markAll()}
              className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full px-4 text-sm font-medium disabled:pointer-events-none disabled:opacity-50 sm:h-10 sm:min-h-10 sm:w-auto"
            >
              Mark all read
            </button>
          </div>

          <section className="dashboard-glass-card min-w-0 overflow-hidden rounded-2xl">
            <div className="flex flex-wrap items-end justify-between gap-2 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                  Inbox
                </p>
                <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                  {filter === "unread" ? "Unread activity" : "All notifications"}
                </h2>
              </div>
              <p className="text-brand-caption text-[color:var(--dash-faint)]">{inboxCountLabel}</p>
            </div>

            {busy ? (
              <div className="space-y-2 px-4 pb-5 sm:px-5" aria-busy="true" aria-label="Loading notifications">
                {Array.from({ length: 4 }, (_, index) => (
                  <span key={index} className="dashboard-skeleton-block block h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-12 text-center sm:py-14">
                <span className="dashboard-tool-icon flex h-14 w-14 items-center justify-center rounded-full text-[color:var(--dash-text)]">
                  <SidebarSvgIcon name="bell" size={22} strokeWidth={1.85} />
                </span>
                <p className="font-sans mt-4 text-base font-semibold text-[color:var(--dash-text)] sm:text-lg">
                  {emptyLabel}
                </p>
                <p className="text-brand-body mt-1.5 max-w-sm text-[color:var(--dash-muted)]">{emptyHint}</p>
              </div>
            ) : (
              <ul className="grid min-w-0 gap-2.5 px-3.5 pb-4 sm:gap-3 sm:px-5">
                {items.map((item) => {
                  const when = formatNotificationWhen(item.created_at, nowMs);
                  const inner = (
                    <>
                      <span
                        className={cn("dashboard-notify-dot mt-1.5", item.read && "dashboard-notify-dot--read")}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1 overflow-hidden">
                        <span className="flex min-w-0 flex-col gap-0.5 sm:flex-row sm:items-start sm:justify-between sm:gap-3">
                          <span className="font-sans min-w-0 text-sm font-semibold leading-snug text-[color:var(--dash-text)]">
                            {item.title}
                          </span>
                          {when ? (
                            <span className="text-brand-caption shrink-0 text-[color:var(--dash-faint)]">
                              {when}
                            </span>
                          ) : null}
                        </span>
                        <span className="text-brand-body mt-1 block text-sm leading-relaxed break-words text-[color:var(--dash-muted)]">
                          {item.body}
                        </span>
                        {!item.read ? (
                          <span className="text-brand-caption mt-2 inline-flex rounded-full bg-[color:var(--dash-surface)] px-2 py-0.5 font-semibold text-[color:var(--dash-text)]">
                            Unread
                          </span>
                        ) : null}
                      </span>
                      {item.href ? (
                        <span
                          className="inline-flex h-6 w-6 shrink-0 items-center justify-center text-[color:var(--dash-accent)]"
                          aria-hidden
                        >
                          <SidebarSvgIcon name="next" size={18} strokeWidth={2.2} />
                        </span>
                      ) : null}
                    </>
                  );

                  const className = cn(
                    "notify-inbox-item flex min-h-11 w-full min-w-0 items-start gap-3 overflow-hidden rounded-2xl bg-[color:var(--dash-soft)]/80 px-4 py-4 text-left",
                    !item.read && "notify-inbox-item--unread",
                  );

                  if (item.href) {
                    return (
                      <li key={item.notification_id} className="min-w-0">
                        <Link
                          href={item.href}
                          onClick={() => void markOne(item)}
                          className={className}
                        >
                          {inner}
                        </Link>
                      </li>
                    );
                  }

                  return (
                    <li key={item.notification_id} className="min-w-0">
                      <button type="button" onClick={() => void markOne(item)} className={className}>
                        {inner}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {!busy && total > 0 ? (
              <div className="px-4 pb-4 sm:px-5">
                <PaginationControls
                  page={page}
                  total={total}
                  pageCount={Math.max(1, Math.ceil(total / PAGE_SIZE))}
                  hasNext={hasNext}
                  hasPrevious={page > 1}
                  loading={loading}
                  onPrevious={() => setPage((value) => Math.max(1, value - 1))}
                  onNext={() => setPage((value) => value + 1)}
                />
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </PortalShell>
  );
}
