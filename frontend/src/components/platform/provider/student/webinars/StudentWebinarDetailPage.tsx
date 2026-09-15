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
  getWebinar,
  type WebinarSummary,
} from "@/lib/integrate/provider/student/webinars/api";
import { formatWebinarWhen } from "@/lib/integrate/provider/student/webinars/types";

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function StudentWebinarDetailPage({ webinarId }: { webinarId: string }) {
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [webinar, setWebinar] = useState<WebinarSummary | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWebinar(webinarId);
      setWebinar(data.webinar);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load webinar.");
    } finally {
      setLoading(false);
    }
  }, [webinarId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function handleBook() {
    setBooking(true);
    setError(null);
    setSuccess(null);
    try {
      const data = await bookWebinar(webinarId);
      setWebinar(data.webinar);
      setSuccess(
        data.webinar.price > 0
          ? "Seat booked and payment recorded."
          : "Seat booked successfully.",
      );
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not book this webinar.");
    } finally {
      setBooking(false);
    }
  }

  return (
    <PortalShell
      role="student"
      title="Webinar"
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

          <h1 className="font-sans min-w-0 truncate text-3xl font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)]">
            Webinar
          </h1>

          <div className="min-w-0 flex-1" aria-hidden />

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <WebinarNotificationsBell buttonClassName="dashboard-icon-btn relative flex h-11 w-11 items-center justify-center rounded-lg sm:h-12 sm:w-12" />
            <WelcomeChip className="lecture-header-welcome h-11 sm:h-12" />
          </div>
        </header>

        <div className="mb-3 sm:mb-4">
          <Link
            href="/student/webinars"
            className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3.5 text-sm font-medium tracking-[0.01em] text-[color:var(--dash-muted)] transition hover:text-[color:var(--dash-text)]"
          >
            <SidebarSvgIcon name="previous" size={14} strokeWidth={2} />
            Back to webinars
          </Link>
        </div>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          {loading || !webinar ? (
            <div className="grid min-w-0 gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.85fr)]">
              <div className="membership-plan-card overflow-hidden rounded-xl">
                <span className="dashboard-skeleton-block aspect-[16/9] w-full rounded-none" />
                <div className="space-y-3 p-4 sm:p-5 md:p-6">
                  <span className="dashboard-skeleton-block h-3 w-40 rounded-lg" />
                  <span className="dashboard-skeleton-block h-8 w-3/4 rounded-lg" />
                  <span className="dashboard-skeleton-block h-4 w-full rounded-lg" />
                  <span className="dashboard-skeleton-block h-4 w-5/6 rounded-lg" />
                </div>
              </div>
              <div className="membership-plan-card h-fit rounded-xl p-4 sm:p-5">
                <span className="dashboard-skeleton-block h-5 w-28 rounded-lg" />
                <span className="dashboard-skeleton-block mt-4 h-10 w-full rounded-lg" />
                <span className="dashboard-skeleton-block mt-3 h-10 w-full rounded-lg" />
                <span className="dashboard-skeleton-block mt-6 h-11 w-full rounded-lg" />
              </div>
            </div>
          ) : (
            <div className="grid min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.85fr)]">
              <section className="membership-plan-card overflow-hidden rounded-xl">
                <div className="relative aspect-[16/9] bg-[color:var(--dash-soft)]">
                  {webinar.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={webinar.thumbnail_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center" aria-hidden>
                      <span className="membership-plan-icon !h-14 !w-14">
                        <SidebarSvgIcon name="webinars" size={28} strokeWidth={1.75} />
                      </span>
                    </span>
                  )}
                </div>

                <div className="p-4 sm:p-5 md:p-6">
                  <p className="text-brand-caption inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                    <SidebarSvgIcon name="clock" size={13} strokeWidth={1.9} />
                    {formatWebinarWhen(webinar.starts_at)}
                  </p>
                  <h2 className="font-sans mt-2 text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[1.85rem] md:leading-tight">
                    {webinar.title}
                  </h2>
                  {webinar.description ? (
                    <p className="text-brand-body mt-3 max-w-3xl leading-relaxed text-[color:var(--dash-muted)]">
                      {webinar.description}
                    </p>
                  ) : (
                    <p className="text-brand-body mt-3 text-[color:var(--dash-faint)]">
                      Details for this live session will be shared closer to the start time.
                    </p>
                  )}
                </div>
              </section>

              <aside className="membership-plan-card sticky top-4 h-fit rounded-xl p-4 sm:p-5 md:p-6">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                  Booking
                </p>

                <div className="mt-4 space-y-3">
                  <BookingStat
                    icon="payment"
                    label="Price"
                    value={
                      webinar.price > 0
                        ? formatMoney(webinar.price, webinar.currency)
                        : "Free"
                    }
                  />
                  <BookingStat
                    icon="users"
                    label="Seats left"
                    value={String(webinar.seats_remaining)}
                  />
                  <BookingStat
                    icon={webinar.is_booked ? "check" : "webinars"}
                    label="Status"
                    value={webinar.is_booked ? "Booked" : "Open"}
                  />
                </div>

                <div className="membership-plan-divider my-5" />

                <div className="flex flex-col gap-2">
                  {webinar.is_booked ? (
                    webinar.join_url ? (
                      <a
                        href={webinar.join_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105"
                      >
                        Join live
                        <SidebarSvgIcon name="next" size={14} strokeWidth={2} />
                      </a>
                    ) : (
                      <span className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center rounded-lg px-5 text-sm font-medium text-[color:var(--dash-text)]">
                        Join link coming soon
                      </span>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled={booking || webinar.seats_remaining <= 0}
                      onClick={() => void handleBook()}
                      className="font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 disabled:opacity-60"
                    >
                      <SidebarSvgIcon name="check" size={15} strokeWidth={2.2} />
                      {booking
                        ? "Booking…"
                        : webinar.price > 0
                          ? `Pay ${formatMoney(webinar.price, webinar.currency)} & book`
                          : "Book free seat"}
                    </button>
                  )}

                  {webinar.price > 0 && !webinar.is_booked ? (
                    <Link
                      href="/student/payment/card"
                      className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-lg px-5 text-sm font-medium text-[color:var(--dash-text)]"
                    >
                      <SidebarSvgIcon name="payment" size={14} strokeWidth={1.9} />
                      Manage card
                    </Link>
                  ) : null}
                </div>

                {webinar.price > 0 && !webinar.is_booked ? (
                  <p className="text-brand-caption mt-4 text-[color:var(--dash-faint)]">
                    Paid bookings charge your saved HOLS payment card.
                  </p>
                ) : null}
              </aside>
            </div>
          )}
        </div>
      </div>
    </PortalShell>
  );
}

function BookingStat({
  icon,
  label,
  value,
}: {
  icon: "payment" | "users" | "check" | "webinars";
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-[color:var(--dash-soft)] px-3 py-2.5">
      <span className="membership-plan-icon !h-9 !w-9 shrink-0" aria-hidden>
        <SidebarSvgIcon name={icon} size={15} strokeWidth={1.9} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-brand-caption text-[color:var(--dash-faint)]">{label}</p>
        <p className="font-sans truncate text-sm font-semibold text-[color:var(--dash-text)]">
          {value}
        </p>
      </div>
    </div>
  );
}
