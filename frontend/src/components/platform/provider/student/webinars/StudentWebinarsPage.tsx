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
import { listWebinars, type WebinarSummary } from "@/lib/integrate/provider/student/webinars/api";
import { formatWebinarWhen } from "@/lib/integrate/provider/student/webinars/types";
import { formatMoney } from "@/lib/integrate/provider/student/payment/types";

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function StudentWebinarsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [webinars, setWebinars] = useState<WebinarSummary[]>([]);

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

  return (
    <PortalShell
      role="student"
      title="Webinars"
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
              Webinars
            </h1>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
            <WebinarNotificationsBell />
            <WelcomeChip />
          </div>
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
              Live learning
            </p>
            <h2 className="font-sans mt-2 text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl">
              Upcoming webinars
            </h2>
            <p className="text-brand-body mt-2 max-w-2xl text-sm text-[color:var(--dash-muted)] sm:text-base">
              Book a seat, pay securely with your saved card, and join when the session goes live.
            </p>
          </section>

          <section className="dashboard-surface min-w-0 rounded-2xl p-4 sm:p-5 md:p-6">
            {loading ? (
              <p className="text-brand-body py-10 text-center text-[color:var(--dash-faint)]">
                Loading webinars…
              </p>
            ) : webinars.length === 0 ? (
              <p className="text-brand-body py-10 text-center text-[color:var(--dash-faint)]">
                No published webinars yet. Check back soon.
              </p>
            ) : (
              <div className="space-y-3">
                {webinars.map((webinar) => (
                  <article
                    key={webinar.webinar_id}
                    className="rounded-2xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)]/35 p-3.5 sm:p-5"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      {webinar.thumbnail_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={webinar.thumbnail_url}
                          alt=""
                          className="h-24 w-full shrink-0 rounded-xl object-cover sm:h-20 sm:w-32"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-sans text-base font-bold text-[color:var(--dash-text)] sm:text-lg">
                            {webinar.title}
                          </h3>
                          {webinar.is_booked ? (
                            <span className="rounded-full bg-[#DDE466]/25 px-2.5 py-0.5 text-brand-caption font-semibold text-[color:var(--dash-accent)]">
                              Booked
                            </span>
                          ) : null}
                        </div>
                        <p className="text-brand-caption mt-1 text-[color:var(--dash-faint)]">
                          {formatWebinarWhen(webinar.starts_at)}
                          {" · "}
                          {webinar.seats_remaining} seats left
                        </p>
                        {webinar.description ? (
                          <p className="text-brand-body mt-2 line-clamp-2 text-sm text-[color:var(--dash-muted)]">
                            {webinar.description}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
                        <p className="font-sans text-sm font-semibold text-[color:var(--dash-accent)]">
                          {webinar.price > 0
                            ? formatMoney(webinar.price, webinar.currency)
                            : "Free"}
                        </p>
                        <Link
                          href={`/student/webinars/${encodeURIComponent(webinar.webinar_id)}`}
                          className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105"
                        >
                          {webinar.is_booked ? "View booking" : "Book seat"}
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PortalShell>
  );
}
