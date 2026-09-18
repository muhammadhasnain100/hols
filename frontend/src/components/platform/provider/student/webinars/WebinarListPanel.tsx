"use client";

import { useState } from "react";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { formatMoney } from "@/lib/integrate/provider/student/payment/types";
import type { WebinarSummary } from "@/lib/integrate/provider/student/webinars/types";
import { formatWebinarWhen } from "@/lib/integrate/provider/student/webinars/types";
import { cn } from "@/lib/utils";

type StatusFilter = "all" | "open" | "booked";

type WebinarListPanelProps = {
  webinars: WebinarSummary[];
  onSelect: (webinarId: string) => void;
};

const FILTERS: Array<{ id: StatusFilter; label: string }> = [
  { id: "all", label: "All" },
  { id: "open", label: "Open" },
  { id: "booked", label: "Booked" },
];

function isBooked(webinar: WebinarSummary) {
  return Boolean(webinar.is_booked);
}

function isSoldOut(webinar: WebinarSummary) {
  return !webinar.is_booked && webinar.seats_remaining <= 0;
}

function isOpenSeat(webinar: WebinarSummary) {
  return !webinar.is_booked && webinar.seats_remaining > 0;
}

function statusLabel(webinar: WebinarSummary) {
  if (isBooked(webinar)) return "Booked";
  if (isSoldOut(webinar)) return "Full";
  return "Open";
}

function actionLabel(webinar: WebinarSummary) {
  if (isBooked(webinar) && webinar.join_url) return "Join";
  if (isBooked(webinar)) return "Open";
  if (isSoldOut(webinar)) return "View";
  return "Book";
}

function priceLabel(webinar: WebinarSummary) {
  return webinar.price > 0 ? formatMoney(webinar.price, webinar.currency) : "Free";
}

export function WebinarListPanel({ webinars, onSelect }: WebinarListPanelProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");

  const openSeats = webinars.filter(isOpenSeat);
  const booked = webinars.filter(isBooked);
  const visibleWebinars =
    filter === "open" ? openSeats : filter === "booked" ? booked : webinars;
  const counts = {
    all: webinars.length,
    open: openSeats.length,
    booked: booked.length,
  };

  const emptyCopy =
    filter === "open"
      ? "No open webinars."
      : filter === "booked"
        ? "No booked webinars yet."
        : "No published webinars yet";

  return (
    <div className="grid min-w-0 gap-3 sm:gap-4">
      {webinars.length > 0 ? (
        <div
          role="tablist"
          aria-label="Filter webinars"
          className="flex min-w-0 items-center gap-1.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {FILTERS.map((item) => {
            const selected = filter === item.id;
            return (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setFilter(item.id)}
                className={cn(
                  "font-sans inline-flex min-h-10 shrink-0 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium tracking-[0.01em] transition",
                  selected
                    ? "dashboard-navy-btn text-white"
                    : "dashboard-pill-soft text-[color:var(--dash-text)]",
                )}
              >
                {item.label}
                <span className={cn("tabular-nums", selected ? "text-white/80" : "text-[color:var(--dash-faint)]")}>
                  {counts[item.id]}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      <section className="dashboard-glass-card min-w-0 overflow-hidden rounded-2xl">
        {webinars.length === 0 ? (
          <div className="flex flex-col items-center px-5 py-12 text-center sm:py-14">
            <span className="dashboard-tool-icon flex h-14 w-14 items-center justify-center rounded-full text-[color:var(--dash-text)]">
              <SidebarSvgIcon name="webinars" size={22} strokeWidth={1.85} />
            </span>
            <p className="font-sans mt-4 text-base font-semibold text-[color:var(--dash-text)] sm:text-lg">
              No published webinars yet
            </p>
            <p className="text-brand-body mt-1.5 max-w-sm text-[color:var(--dash-muted)]">
              New live sessions will show up here when they are scheduled.
            </p>
          </div>
        ) : visibleWebinars.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="font-sans text-sm font-semibold text-[color:var(--dash-text)]">{emptyCopy}</p>
            <p className="text-brand-caption mt-1 text-[color:var(--dash-faint)]">
              Switch the filter to see other sessions.
            </p>
          </div>
        ) : (
          <div className="min-w-0 overflow-x-auto">
            <table className="w-full min-w-[44rem] border-separate border-spacing-0 text-left">
              <thead>
                <tr className="bg-[color:var(--dash-soft)] text-brand-caption font-semibold uppercase tracking-[0.06em] text-[color:var(--dash-faint)]">
                  <th scope="col" className="px-4 py-3 font-semibold sm:px-5">
                    Webinar
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Status
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    When
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Seats
                  </th>
                  <th scope="col" className="px-3 py-3 font-semibold">
                    Price
                  </th>
                  <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-5">
                    <span className="sr-only">Open</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visibleWebinars.map((webinar) => (
                  <tr
                    key={webinar.webinar_id}
                    tabIndex={0}
                    role="button"
                    aria-label={`${webinar.title}, ${statusLabel(webinar)}. ${actionLabel(webinar)}`}
                    className="cursor-pointer outline-none transition hover:bg-[color:var(--dash-soft)] focus-visible:bg-[color:var(--dash-soft)]"
                    onClick={() => onSelect(webinar.webinar_id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onSelect(webinar.webinar_id);
                      }
                    }}
                  >
                    <td className="border-t border-[color:var(--dash-surface-border)] px-4 py-3 sm:px-5">
                      <div className="flex min-w-0 items-center gap-3">
                        {webinar.thumbnail_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={webinar.thumbnail_url}
                            alt=""
                            className="h-9 w-9 shrink-0 rounded-full object-cover"
                          />
                        ) : (
                          <span className="dashboard-tool-icon flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[color:var(--dash-text)]">
                            <SidebarSvgIcon name="webinars" size={15} strokeWidth={1.9} />
                          </span>
                        )}
                        <span className="font-sans min-w-0 truncate text-sm font-semibold text-[color:var(--dash-text)]">
                          {webinar.title}
                        </span>
                      </div>
                    </td>
                    <td className="border-t border-[color:var(--dash-surface-border)] px-3 py-3">
                      <span className="text-brand-caption inline-flex rounded-full bg-[color:var(--dash-soft)] px-2.5 py-1 font-semibold text-[color:var(--dash-text)]">
                        {statusLabel(webinar)}
                      </span>
                    </td>
                    <td className="border-t border-[color:var(--dash-surface-border)] px-3 py-3">
                      <span className="text-brand-caption block max-w-[16rem] truncate text-[color:var(--dash-muted)]">
                        {formatWebinarWhen(webinar.starts_at)}
                      </span>
                    </td>
                    <td className="border-t border-[color:var(--dash-surface-border)] px-3 py-3">
                      <span className="font-sans text-sm tabular-nums text-[color:var(--dash-text)]">
                        {webinar.seats_remaining}
                      </span>
                    </td>
                    <td className="border-t border-[color:var(--dash-surface-border)] px-3 py-3">
                      <span className="text-brand-caption whitespace-nowrap text-[color:var(--dash-muted)]">
                        {priceLabel(webinar)}
                      </span>
                    </td>
                    <td className="border-t border-[color:var(--dash-surface-border)] px-4 py-3 text-right sm:px-5">
                      <span className="inline-flex items-center justify-end gap-1 text-brand-caption font-medium text-[color:var(--dash-navy)]">
                        {actionLabel(webinar)}
                        <SidebarSvgIcon name="next" size={14} />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
