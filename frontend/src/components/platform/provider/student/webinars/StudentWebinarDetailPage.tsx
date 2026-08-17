"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { Icon, Menu } from "@/components/icons";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { WebinarNotificationsBell } from "@/components/platform/provider/student/webinars/WebinarNotificationsBell";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  bookWebinar,
  getWebinar,
  type WebinarSummary,
} from "@/lib/integrate/provider/student/webinars/api";
import { formatWebinarWhen } from "@/lib/integrate/provider/student/webinars/types";
import { formatMoney } from "@/lib/integrate/provider/student/payment/types";

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
      <div className="dashboard-screen min-w-0 overflow-x-hidden">
        <header className="mb-3 flex items-center justify-between gap-2 sm:mb-5 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={openSidebar}
              className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full lg:hidden"
            >
              <Icon icon={Menu} size={18} />
            </button>
            <h1 className="font-sans truncate text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl">
              Book webinar
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <WebinarNotificationsBell />
            <WelcomeChip />
          </div>
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          {loading || !webinar ? (
            <div className="dashboard-surface rounded-2xl p-10 text-center">
              <p className="text-brand-body text-[color:var(--dash-faint)]">
                {loading ? "Loading…" : "Webinar not found."}
              </p>
            </div>
          ) : (
            <>
              <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
                {webinar.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={webinar.thumbnail_url}
                    alt=""
                    className="mb-4 aspect-[16/9] w-full max-h-64 rounded-xl object-cover"
                  />
                ) : null}
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                  {formatWebinarWhen(webinar.starts_at)}
                </p>
                <h2 className="font-sans mt-2 text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-3xl">
                  {webinar.title}
                </h2>
                {webinar.description ? (
                  <p className="text-brand-body mt-3 max-w-3xl text-[color:var(--dash-muted)]">
                    {webinar.description}
                  </p>
                ) : null}
              </section>

              <section className="dashboard-surface rounded-2xl p-4 sm:p-5 md:p-6">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Detail label="Price" value={webinar.price > 0 ? formatMoney(webinar.price, webinar.currency) : "Free"} />
                  <Detail label="Seats left" value={String(webinar.seats_remaining)} />
                  <Detail label="Status" value={webinar.is_booked ? "Booked" : "Open"} />
                </div>

                <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {webinar.is_booked ? (
                    webinar.join_url ? (
                      <a
                        href={webinar.join_url}
                        target="_blank"
                        rel="noreferrer"
                        className="font-sans inline-flex min-h-11 items-center justify-center rounded-full bg-[#DDE466] px-6 text-sm font-medium text-[#152744] transition hover:brightness-105"
                      >
                        Join live
                      </a>
                    ) : (
                      <span className="dashboard-pill-soft font-sans inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-medium">
                        Join link coming soon
                      </span>
                    )
                  ) : (
                    <button
                      type="button"
                      disabled={booking || webinar.seats_remaining <= 0}
                      onClick={() => void handleBook()}
                      className="font-sans inline-flex min-h-11 items-center justify-center rounded-full bg-[#DDE466] px-6 text-sm font-medium text-[#152744] transition hover:brightness-105 disabled:opacity-60"
                    >
                      {booking
                        ? "Booking…"
                        : webinar.price > 0
                          ? `Pay ${formatMoney(webinar.price, webinar.currency)} & book`
                          : "Book free seat"}
                    </button>
                  )}
                  <Link
                    href="/student/webinars"
                    className="dashboard-pill-soft font-sans inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-medium"
                  >
                    Back to webinars
                  </Link>
                  {webinar.price > 0 && !webinar.is_booked ? (
                    <Link
                      href="/student/payment/card"
                      className="dashboard-pill-soft font-sans inline-flex min-h-11 items-center justify-center rounded-full px-6 text-sm font-medium"
                    >
                      Manage card
                    </Link>
                  ) : null}
                </div>

                {webinar.price > 0 && !webinar.is_booked ? (
                  <p className="text-brand-caption mt-4 text-[color:var(--dash-faint)]">
                    Paid bookings use your saved HOLS payment card.
                  </p>
                ) : null}
              </section>
            </>
          )}
        </div>
      </div>
    </PortalShell>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)]/40 px-3.5 py-3">
      <p className="text-brand-caption text-[color:var(--dash-faint)]">{label}</p>
      <p className="font-sans mt-1 text-sm font-semibold text-[color:var(--dash-text)]">{value}</p>
    </div>
  );
}
