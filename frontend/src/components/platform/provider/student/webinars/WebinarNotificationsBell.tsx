"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Bell, Icon } from "@/components/icons";
import {
  listWebinarNotifications,
  type WebinarNotification,
} from "@/lib/integrate/provider/student/webinars/api";
import { formatWebinarWhen } from "@/lib/integrate/provider/student/webinars/types";
import { cn } from "@/lib/utils";

export function WebinarNotificationsBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<WebinarNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const isDark =
    typeof document !== "undefined" &&
    (rootRef.current?.closest(".portal-shell")?.getAttribute("data-theme") === "dark" ||
      document.querySelector(".portal-shell")?.getAttribute("data-theme") === "dark");

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
    window.addEventListener("mousedown", onPointerDown);
    return () => window.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const unread = items.filter((item) => !item.is_booked).length;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="dashboard-icon-btn relative flex h-9 w-9 items-center justify-center rounded-full"
      >
        <Icon icon={Bell} size={16} />
        {unread > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#DDE466]" />
        ) : null}
      </button>

      {open ? (
        <div
          data-theme={isDark ? "dark" : "light"}
          className="dashboard-popover absolute right-0 z-50 mt-2 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-2xl"
          style={{
            backgroundColor: isDark ? "rgba(16, 30, 54, 0.97)" : "rgba(244, 247, 251, 0.97)",
            backgroundImage: isDark
              ? "linear-gradient(165deg, rgba(56, 83, 164, 0.42) 0%, rgba(20, 38, 68, 0.22) 100%)"
              : "linear-gradient(165deg, rgba(255, 255, 255, 0.75) 0%, rgba(255, 255, 255, 0.3) 100%)",
            border: isDark
              ? "1px solid rgba(141, 195, 225, 0.38)"
              : "1px solid rgba(21, 39, 68, 0.14)",
            backdropFilter: "blur(28px) saturate(170%)",
            WebkitBackdropFilter: "blur(28px) saturate(170%)",
            boxShadow: isDark
              ? "inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 18px 48px rgba(0, 0, 0, 0.5)"
              : "inset 0 1px 0 rgba(255, 255, 255, 0.85), 0 18px 48px rgba(10, 18, 36, 0.22)",
          }}
        >
          <div
            className={cn(
              "border-b px-3.5 py-3",
              isDark ? "border-white/10" : "border-[color:var(--dash-surface-border)]",
            )}
          >
            <p className="font-sans text-sm font-semibold text-[color:var(--dash-text)]">
              Webinar updates
            </p>
            <p className="text-brand-caption mt-0.5 text-[color:var(--dash-faint)]">
              Upcoming sessions you can book or join
            </p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {loading ? (
              <p className="text-brand-caption px-3.5 py-6 text-center text-[color:var(--dash-faint)]">
                Loading…
              </p>
            ) : items.length === 0 ? (
              <p className="text-brand-caption px-3.5 py-6 text-center text-[color:var(--dash-faint)]">
                No upcoming webinars right now.
              </p>
            ) : (
              items.map((item) => (
                <Link
                  key={item.webinar_id}
                  href={`/student/webinars/${encodeURIComponent(item.webinar_id)}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "block border-b px-3.5 py-3 transition last:border-b-0",
                    isDark
                      ? "border-white/10 hover:bg-white/10"
                      : "border-[color:var(--dash-surface-border)] hover:bg-[color:var(--dash-soft)]/55",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-sans text-sm font-semibold text-[color:var(--dash-text)]">
                      {item.title}
                    </p>
                    {item.is_booked ? (
                      <span className="shrink-0 rounded-full bg-[#DDE466]/25 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-accent)]">
                        Booked
                      </span>
                    ) : null}
                  </div>
                  <p className="text-brand-caption mt-1 text-[color:var(--dash-muted)]">
                    {item.body}
                  </p>
                  <p className="text-brand-caption mt-1 text-[color:var(--dash-faint)]">
                    {formatWebinarWhen(item.starts_at)}
                  </p>
                </Link>
              ))
            )}
          </div>
          <div
            className={cn(
              "border-t px-3.5 py-2.5",
              isDark ? "border-white/10" : "border-[color:var(--dash-surface-border)]",
            )}
          >
            <Link
              href="/student/webinars"
              onClick={() => setOpen(false)}
              className="font-sans text-sm font-medium text-[color:var(--dash-accent)] underline-offset-2 hover:underline"
            >
              View all webinars
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
