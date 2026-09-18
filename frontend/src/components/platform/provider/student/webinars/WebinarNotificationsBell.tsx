"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { readStoredPortalTheme } from "@/components/platform/provider/portal-theme-store";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { formatMoney } from "@/lib/integrate/provider/student/payment/types";
import {
  listWebinarNotifications,
  type WebinarNotification,
} from "@/lib/integrate/provider/student/webinars/api";
import { formatWebinarWhen } from "@/lib/integrate/provider/student/webinars/types";
import { cn } from "@/lib/utils";

type PanelPosition = {
  top: number;
  right: number;
};

export function WebinarNotificationsBell({
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
  const [position, setPosition] = useState<PanelPosition>({ top: 0, right: 16 });
  const [items, setItems] = useState<WebinarNotification[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listWebinarNotifications();
      setItems(data.items);
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
    setPosition({
      top: Math.min(rect.bottom + 8, window.innerHeight - margin),
      right: Math.max(margin, window.innerWidth - rect.right),
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    updatePosition();
    void load();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [load, open, updatePosition]);

  const actionable = items.filter((item) => !item.is_booked).length;
  const theme = mounted ? readStoredPortalTheme() : "light";

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={
          actionable > 0
            ? `Notifications, ${actionable} webinar${actionable === 1 ? "" : "s"} to book`
            : "Notifications"
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
              className="dashboard-popover dashboard-notify-panel"
              style={{ top: position.top, right: position.right }}
            >
              <div className="dashboard-notify-panel-header">
                <h2 id={titleId} className="font-sans text-sm font-semibold tracking-[0.01em]">
                  Notifications
                </h2>
                <p className="dashboard-notify-faint text-brand-caption">
                  {loading ? "Updating…" : actionable > 0 ? `${actionable} new` : "All caught up"}
                </p>
              </div>

              <WebinarNotifyList
                items={items}
                loading={loading}
                onNavigate={() => setOpen(false)}
              />

              <div className="dashboard-notify-panel-footer">
                <Link
                  href="/student/webinars"
                  onClick={() => setOpen(false)}
                  className="font-sans inline-flex min-h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl text-sm font-semibold transition hover:bg-[var(--notify-soft)]"
                >
                  View all webinars
                  <SidebarSvgIcon name="next" size={14} />
                </Link>
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function WebinarNotifyList({
  items,
  loading,
  onNavigate,
}: {
  items: WebinarNotification[];
  loading: boolean;
  onNavigate: () => void;
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
        <p className="font-sans text-sm font-semibold">No webinar updates</p>
        <p className="dashboard-notify-faint text-brand-caption mt-1">
          New sessions will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="dashboard-notify-list">
      {items.map((item) => {
        const booked = Boolean(item.is_booked);
        const meta = [
          formatWebinarWhen(item.starts_at),
          booked ? "Booked" : item.price > 0 ? formatMoney(item.price, item.currency) : "Free",
        ].join(" · ");

        return (
          <Link
            key={item.webinar_id}
            href={`/student/webinars/${encodeURIComponent(item.webinar_id)}`}
            onClick={onNavigate}
            className="dashboard-notify-item"
          >
            <span
              className={cn("dashboard-notify-dot", booked && "dashboard-notify-dot--read")}
              aria-hidden
            />
            <span className="min-w-0 flex-1">
              <span className="font-sans block truncate text-sm font-semibold leading-snug">
                {item.title}
              </span>
              <span className="dashboard-notify-meta text-brand-caption mt-1 block truncate">
                {meta}
              </span>
            </span>
          </Link>
        );
      })}
    </div>
  );
}
