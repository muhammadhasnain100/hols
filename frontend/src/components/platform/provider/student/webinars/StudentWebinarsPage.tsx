"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { WebinarNotificationsBell } from "@/components/platform/provider/student/webinars/WebinarNotificationsBell";
import { ApiRequestError } from "@/lib/integrate/client";
import { formatMoney } from "@/lib/integrate/provider/student/payment/types";
import {
  bookWebinar,
  listWebinars,
  type WebinarSummary,
} from "@/lib/integrate/provider/student/webinars/api";
import { formatWebinarWhen } from "@/lib/integrate/provider/student/webinars/types";
import { cn } from "@/lib/utils";

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function StudentWebinarsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [webinars, setWebinars] = useState<WebinarSummary[]>([]);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listWebinars({ page: 1, limit: 50 });
      setWebinars(data.items);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load webinars.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const handleBook = useCallback(async (webinar: WebinarSummary) => {
    if (webinar.is_booked || webinar.seats_remaining <= 0) return;

    setBookingId(webinar.webinar_id);
    setError(null);
    setSuccess(null);

    try {
      const data = await bookWebinar(webinar.webinar_id);
      setWebinars((prev) =>
        prev.map((item) => (item.webinar_id === webinar.webinar_id ? data.webinar : item)),
      );
      setSuccess(
        data.webinar.price > 0
          ? `Booked “${data.webinar.title}” and payment recorded.`
          : `Booked “${data.webinar.title}”.`,
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not book this webinar.");
    } finally {
      setBookingId(null);
    }
  }, []);

  return (
    <PortalShell
      role="student"
      title="Webinars"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={studentNav}
    >
      <div className="dashboard-screen lectures-page webinars-page min-w-0 overflow-x-hidden">
        <header className="mb-3 flex h-11 min-w-0 items-center gap-2.5 sm:mb-4 sm:h-12 sm:gap-3 md:mb-5 md:gap-4">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={openSidebar}
            className="dashboard-icon-btn flex h-11 w-11 shrink-0 items-center justify-center rounded-lg lg:hidden sm:h-12 sm:w-12"
          >
            <SidebarSvgIcon name="menu" size={18} strokeWidth={2} />
          </button>

          <h1 className="font-sans shrink-0 text-3xl font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)]">
            Webinars
          </h1>

          <div className="min-w-0 flex-1" aria-hidden />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <WebinarNotificationsBell buttonClassName="dashboard-icon-btn relative flex h-11 w-11 items-center justify-center rounded-lg sm:h-12 sm:w-12" />
            <WelcomeChip className="lecture-header-welcome h-11 sm:h-12" />
          </div>
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          {loading ? (
            <div
              className="grid min-w-0 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3"
              aria-busy="true"
              aria-label="Loading webinars"
            >
              {Array.from({ length: 6 }, (_, index) => (
                <WebinarCardSkeleton key={index} index={index} />
              ))}
            </div>
          ) : webinars.length === 0 ? (
            <section className="hols-auth-card flex flex-col items-center justify-center rounded-xl px-4 py-14 text-center sm:py-16">
              <span className="membership-plan-icon !h-12 !w-12" aria-hidden>
                <SidebarSvgIcon name="webinars" size={24} strokeWidth={1.75} />
              </span>
              <p className="font-sans mt-4 text-base font-semibold text-[color:var(--dash-text)]">
                No published webinars yet
              </p>
              <p className="text-brand-caption mt-1.5 max-w-[18rem] text-[color:var(--dash-faint)]">
                New live sessions will show up here when they are scheduled.
              </p>
            </section>
          ) : (
            <div className="grid min-w-0 items-stretch gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-3">
              {webinars.map((webinar, index) => (
                <WebinarCard
                  key={webinar.webinar_id}
                  webinar={webinar}
                  index={index}
                  booking={bookingId === webinar.webinar_id}
                  bookingBusy={bookingId !== null}
                  onBook={() => void handleBook(webinar)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}

function WebinarCardSkeleton({ index }: { index: number }) {
  return (
    <div
      style={{ animationDelay: `${Math.min(index, 7) * 45}ms` }}
      className="membership-plan-card flex min-h-0 flex-col overflow-hidden rounded-xl"
      aria-hidden
    >
      <span className="dashboard-skeleton-block aspect-[16/10] w-full rounded-none" />
      <div className="flex flex-1 flex-col gap-2.5 p-4 sm:p-5">
        <span className="dashboard-skeleton-block h-5 w-3/4 rounded-lg" />
        <span className="dashboard-skeleton-block h-3 w-1/2 rounded-lg" />
        <span className="dashboard-skeleton-block h-3 w-full rounded-lg" />
        <span className="dashboard-skeleton-block mt-auto h-11 w-full rounded-lg" />
      </div>
    </div>
  );
}

function WebinarCard({
  webinar,
  index,
  booking,
  bookingBusy,
  onBook,
}: {
  webinar: WebinarSummary;
  index: number;
  booking: boolean;
  bookingBusy: boolean;
  onBook: () => void;
}) {
  const href = `/student/webinars/${encodeURIComponent(webinar.webinar_id)}`;
  const priceLabel =
    webinar.price > 0 ? formatMoney(webinar.price, webinar.currency) : "Free";
  const soldOut = !webinar.is_booked && webinar.seats_remaining <= 0;

  return (
    <article
      style={{ animationDelay: `${Math.min(index, 11) * 45}ms` }}
      className={cn(
        "membership-plan-card group relative flex min-h-0 flex-col overflow-hidden rounded-xl",
        webinar.is_booked && "membership-plan-card--current",
      )}
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-[color:var(--dash-soft)]">
        {webinar.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={webinar.thumbnail_url}
            alt=""
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center" aria-hidden>
            <span className="membership-plan-icon !h-12 !w-12">
              <SidebarSvgIcon name="webinars" size={24} strokeWidth={1.75} />
            </span>
          </span>
        )}

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#152744]/55 to-transparent" />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {webinar.is_booked ? (
            <span className="rounded-lg bg-[#DDE466] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#152744]">
              Booked
            </span>
          ) : soldOut ? (
            <span className="rounded-lg bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#152744] backdrop-blur-sm">
              Full
            </span>
          ) : (
            <span className="rounded-lg bg-white/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.06em] text-[#152744] backdrop-blur-sm">
              Open
            </span>
          )}
        </div>

        <span className="absolute bottom-3 right-3 rounded-lg bg-[#152744]/78 px-2.5 py-1 font-sans text-xs font-semibold text-white backdrop-blur-sm">
          {priceLabel}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h2 className="font-sans text-base font-bold leading-snug tracking-[0.01em] text-[color:var(--dash-text)] sm:text-lg">
          {webinar.title}
        </h2>

        <div className="mt-2.5 flex flex-col gap-1.5">
          <p className="text-brand-caption inline-flex items-center gap-1.5 text-[color:var(--dash-muted)]">
            <SidebarSvgIcon name="clock" size={13} strokeWidth={1.9} className="shrink-0" />
            <span className="truncate">{formatWebinarWhen(webinar.starts_at)}</span>
          </p>
          <p className="text-brand-caption inline-flex items-center gap-1.5 text-[color:var(--dash-faint)]">
            <SidebarSvgIcon name="users" size={13} strokeWidth={1.9} className="shrink-0" />
            <span>
              {webinar.seats_remaining} {webinar.seats_remaining === 1 ? "seat" : "seats"} left
            </span>
          </p>
        </div>

        {webinar.description ? (
          <p className="text-brand-body mt-3 line-clamp-2 text-sm text-[color:var(--dash-muted)]">
            {webinar.description}
          </p>
        ) : null}

        <div className="mt-auto flex flex-col gap-2 pt-4">
          {webinar.is_booked ? (
            webinar.join_url ? (
              <a
                href={webinar.join_url}
                target="_blank"
                rel="noreferrer"
                className="font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105"
              >
                Join live
                <SidebarSvgIcon name="next" size={14} strokeWidth={2} />
              </a>
            ) : (
              <span className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-medium text-[color:var(--dash-text)]">
                Seat booked
              </span>
            )
          ) : (
            <button
              type="button"
              disabled={bookingBusy || soldOut}
              onClick={onBook}
              className="font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[#DDE466] px-5 text-sm font-medium tracking-[0.01em] text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-55"
            >
              <SidebarSvgIcon name="check" size={15} strokeWidth={2.2} />
              {booking
                ? "Booking…"
                : soldOut
                  ? "Sold out"
                  : webinar.price > 0
                    ? `Pay ${priceLabel} & book`
                    : "Book seat"}
            </button>
          )}

          <Link
            href={href}
            className="dashboard-pill-soft font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-lg px-4 text-sm font-medium text-[color:var(--dash-text)] transition"
          >
            View details
            <SidebarSvgIcon name="next" size={14} strokeWidth={2} />
          </Link>
        </div>
      </div>
    </article>
  );
}
