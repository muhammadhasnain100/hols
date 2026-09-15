"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { formatMoney } from "@/lib/integrate/provider/student/payment/types";
import {
  listWebinarNotifications,
  type WebinarNotification,
} from "@/lib/integrate/provider/student/webinars/api";
import { formatWebinarWhen } from "@/lib/integrate/provider/student/webinars/types";
import { cn } from "@/lib/utils";

function NotificationAssetIcon({ size = 22 }: { size?: number }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/assets/icon/notification.svg"
      alt=""
      width={size}
      height={size}
      className="shrink-0"
      draggable={false}
    />
  );
}

export function WebinarNotificationsBell({
  buttonClassName,
}: {
  buttonClassName?: string;
} = {}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<WebinarNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    void listWebinarNotifications()
      .then((data) => {
        if (!cancelled) setItems(data.items);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const actionable = items.filter((item) => !item.is_booked).length;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={
          actionable > 0
            ? `Notifications, ${actionable} webinar${actionable === 1 ? "" : "s"} to book`
            : "Notifications"
        }
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          buttonClassName ??
            "dashboard-icon-btn relative flex h-9 w-9 items-center justify-center rounded-lg",
          "text-transparent [&_img]:opacity-100",
          open && "ring-2 ring-[#DDE466]/70",
        )}
      >
        <NotificationAssetIcon size={22} />
        {actionable > 0 ? (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DDE466] px-1 text-[10px] font-bold leading-none text-[#152744] shadow-sm">
            {actionable > 9 ? "9+" : actionable}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-label="Webinar notifications"
          className="dashboard-popover absolute right-0 z-50 mt-2 w-[min(22.5rem,calc(100vw-1.5rem))] overflow-hidden rounded-2xl"
        >
          <div className="flex items-start justify-between gap-3 border-b border-[color:var(--dash-surface-border)] px-4 py-3.5">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <NotificationAssetIcon size={20} />
                <p className="font-sans text-sm font-semibold text-[color:var(--dash-text)]">
                  Webinar updates
                </p>
              </div>
              <p className="text-brand-caption mt-1 text-[color:var(--dash-faint)]">
                Upcoming sessions you can book or join
              </p>
            </div>
            {actionable > 0 ? (
              <span className="shrink-0 rounded-lg bg-[#DDE466] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#152744]">
                {actionable} new
              </span>
            ) : null}
          </div>

          <div className="max-h-[min(28rem,70vh)] space-y-2.5 overflow-y-auto p-3">
            {loading ? (
              <div className="space-y-2.5" aria-busy="true" aria-label="Loading notifications">
                {Array.from({ length: 3 }, (_, index) => (
                  <div
                    key={index}
                    className="dashboard-glass-card rounded-xl p-3"
                  >
                    <div className="flex gap-3">
                      <span className="dashboard-skeleton-block h-14 w-14 shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1 space-y-2 py-0.5">
                        <span className="dashboard-skeleton-block h-3.5 w-[75%] rounded-full" />
                        <span className="dashboard-skeleton-block h-3 w-1/2 rounded-full" />
                        <span className="dashboard-skeleton-block mt-1 h-8 w-24 rounded-lg" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : items.length === 0 ? (
              <div className="dashboard-glass-card rounded-xl px-4 py-8 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-lg bg-[#DDE466]/25 text-[color:var(--dash-accent)]">
                  <SidebarSvgIcon name="webinars" size={20} />
                </span>
                <p className="font-sans mt-3 text-sm font-semibold text-[color:var(--dash-text)]">
                  No upcoming webinars
                </p>
                <p className="text-brand-caption mt-1 text-[color:var(--dash-faint)]">
                  New sessions will show up here first.
                </p>
              </div>
            ) : (
              items.map((item) => (
                <article
                  key={item.webinar_id}
                  className="dashboard-glass-card overflow-hidden rounded-xl p-3"
                >
                  <div className="flex gap-3">
                    {item.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnail_url}
                        alt=""
                        className="h-14 w-14 shrink-0 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-[#DDE466]/20 text-[color:var(--dash-accent)]">
                        <SidebarSvgIcon name="webinars" size={22} />
                      </span>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-sans line-clamp-2 text-sm font-semibold leading-snug text-[color:var(--dash-text)]">
                          {item.title}
                        </h3>
                        {item.is_booked ? (
                          <span className="shrink-0 rounded-lg bg-[#DDE466]/30 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#152744]">
                            Booked
                          </span>
                        ) : null}
                      </div>

                      <p className="text-brand-caption mt-1 flex items-center gap-1 text-[color:var(--dash-muted)]">
                        <SidebarSvgIcon name="clock" size={12} className="shrink-0" />
                        <span className="truncate">{formatWebinarWhen(item.starts_at)}</span>
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <span className="font-sans text-xs font-semibold text-[color:var(--dash-accent)]">
                          {item.price > 0
                            ? formatMoney(item.price, item.currency)
                            : "Free"}
                        </span>
                        {typeof item.seats_remaining === "number" ? (
                          <span className="text-brand-caption text-[color:var(--dash-faint)]">
                            {item.seats_remaining} seats left
                          </span>
                        ) : null}
                      </div>

                      <p className="text-brand-caption mt-1 line-clamp-2 text-[color:var(--dash-faint)]">
                        {item.body}
                      </p>

                      <Link
                        href={`/student/webinars/${encodeURIComponent(item.webinar_id)}`}
                        onClick={() => setOpen(false)}
                        className="font-sans mt-2.5 inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg bg-[#DDE466] px-3.5 text-xs font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105"
                      >
                        {item.is_booked ? "Open booking" : "Book seat"}
                        <SidebarSvgIcon name="next" size={14} />
                      </Link>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>

          <div className="border-t border-[color:var(--dash-surface-border)] px-3 py-2.5">
            <Link
              href="/student/webinars"
              onClick={() => setOpen(false)}
              className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-text)] transition"
            >
              View all webinars
              <SidebarSvgIcon name="next" size={15} />
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
