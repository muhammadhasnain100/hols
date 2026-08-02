"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Icon, Menu } from "@/components/icons";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { StatPill } from "@/components/platform/provider/admin/shared";
import { AffiliateEarningsMeter } from "@/components/platform/provider/affiliate/AffiliateEarningsMeter";
import { affiliateNav } from "@/components/platform/provider/affiliate/affiliateNav";
import {
  formatAffiliatePercent,
  useAffiliateProfile,
} from "@/components/platform/provider/affiliate/affiliateProfile";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import {
  getAffiliateEarnings,
  type AffiliateEarnings,
} from "@/lib/integrate/provider/affiliate/earnings";
import { ApiRequestError } from "@/lib/integrate/client";
import { formatDate, formatMoney, planLabels } from "@/lib/integrate/provider/student/payment/types";

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function AffiliateEarningsPage() {
  const { profile, inviteInfo, refreshing, error: profileError } = useAffiliateProfile();
  const [earnings, setEarnings] = useState<AffiliateEarnings | null>(null);
  const [earningsLoading, setEarningsLoading] = useState(true);
  const [earningsError, setEarningsError] = useState<string | null>(null);

  const studentCount = inviteInfo?.student_count ?? profile?.student_count ?? 0;
  const margin = earnings?.margin_percent ?? profile?.margin_percent;
  const inviteCode = inviteInfo?.invite_code ?? profile?.invite_code;
  const currency = earnings?.currency ?? "USD";
  const error = earningsError ?? profileError;

  useEffect(() => {
    const controller = new AbortController();
    setEarningsLoading(true);
    setEarningsError(null);
    void getAffiliateEarnings(controller.signal)
      .then((data) => {
        if (!controller.signal.aborted) setEarnings(data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setEarningsError(
          err instanceof ApiRequestError ? err.message : "Failed to load earnings.",
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setEarningsLoading(false);
      });
    return () => controller.abort();
  }, []);

  const loading = (refreshing && !profile) || (earningsLoading && !earnings);

  return (
    <PortalShell
      role="affiliate"
      title="Earnings"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={affiliateNav}
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
              Earnings
            </h1>
          </div>
          <WelcomeChip fallbackName="Affiliate" />
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <AffiliateEarningsMeter
            variant="hero"
            totalEarned={earnings?.total_earned ?? 0}
            nextMilestone={earnings?.next_milestone ?? 100}
            currency={currency}
            pendingPayout={earnings?.pending_payout ?? 0}
            orderCount={earnings?.order_count ?? 0}
            loading={loading}
          />

          <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
            <div className="flex flex-col gap-3.5 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                  Commission
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
                  <span className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                    {loading ? "—" : formatAffiliatePercent(margin)}
                  </span>
                  <span className="mb-0.5 text-brand-caption font-medium text-[color:var(--dash-faint)]">
                    margin
                  </span>
                </div>
                <p className="text-brand-body mt-2 text-sm text-[color:var(--dash-muted)] sm:text-base">
                  Your margin is assigned by admin. Totals update when referred students purchase a plan.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5">
                <Link
                  href="/affiliate/referrals"
                  className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-[color:var(--dash-text)] transition sm:px-5"
                >
                  Referrals
                </Link>
                <Link
                  href="/affiliate"
                  className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-3 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:px-5"
                >
                  <span className="sm:hidden">Home</span>
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              </div>
            </div>
          </section>

          <div className="grid min-w-0 grid-cols-1 gap-2.5 min-[420px]:grid-cols-3 sm:gap-3">
            <StatPill
              label={
                <>
                  <span className="sm:hidden">Earned</span>
                  <span className="hidden sm:inline">Total earned</span>
                </>
              }
              value={loading ? "—" : formatMoney(earnings?.total_earned ?? 0, currency)}
            />
            <StatPill
              label={
                <>
                  <span className="sm:hidden">Pending</span>
                  <span className="hidden sm:inline">Pending payout</span>
                </>
              }
              value={loading ? "—" : formatMoney(earnings?.pending_payout ?? 0, currency)}
            />
            <StatPill
              label={
                <>
                  <span className="sm:hidden">Paid</span>
                  <span className="hidden sm:inline">Paid out</span>
                </>
              }
              value={loading ? "—" : formatMoney(earnings?.paid_out ?? 0, currency)}
            />
          </div>

          <section className="dashboard-surface min-w-0 overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              Overview
            </p>
            <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
              Commission details
            </h2>
            <div className="mt-4 grid min-w-0 gap-2.5 sm:grid-cols-3">
              <div className="dashboard-row min-w-0 rounded-xl px-3.5 py-3.5">
                <p className="text-brand-caption font-medium text-[color:var(--dash-faint)]">Current margin</p>
                <p className="font-sans mt-1 text-2xl font-bold text-[color:var(--dash-text)]">
                  {formatAffiliatePercent(margin)}
                </p>
              </div>
              <div className="dashboard-row min-w-0 rounded-xl px-3.5 py-3.5">
                <p className="text-brand-caption font-medium text-[color:var(--dash-faint)]">Tracked referrals</p>
                <p className="font-sans mt-1 text-2xl font-bold text-[color:var(--dash-text)]">{studentCount}</p>
              </div>
              <div className="dashboard-row min-w-0 rounded-xl px-3.5 py-3.5">
                <p className="text-brand-caption font-medium text-[color:var(--dash-faint)]">Invite code</p>
                <p className="font-sans mt-1 break-all text-lg font-bold text-[color:var(--dash-text)]">
                  {inviteCode ?? "Not assigned"}
                </p>
              </div>
            </div>
          </section>

          <section className="dashboard-surface min-w-0 overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
              History
            </p>
            <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
              Commission history
            </h2>
            <p className="text-brand-body mt-1 text-sm text-[color:var(--dash-muted)]">
              Commission from referred student plan purchases. Payouts remain pending until processed.
            </p>
            <div className="mt-4 -mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
              <div className="min-w-[20rem] overflow-hidden rounded-xl border border-[color:var(--dash-surface-border)]">
                <div className="grid grid-cols-3 bg-[color:var(--dash-soft)] px-3 py-3 text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)] sm:px-4">
                  <span>Order</span>
                  <span>Status</span>
                  <span className="text-right">Commission</span>
                </div>
                {loading ? (
                  <div className="px-3 py-8 text-center text-sm text-[color:var(--dash-muted)] sm:px-4 sm:py-10">
                    Loading commissions…
                  </div>
                ) : earnings?.items?.length ? (
                  <ul className="divide-y divide-[color:var(--dash-surface-border)]">
                    {earnings.items.map((item) => {
                      const plan =
                        item.plan_type && item.plan_type in planLabels
                          ? planLabels[item.plan_type as keyof typeof planLabels]
                          : item.plan_type ?? "Plan";
                      return (
                        <li
                          key={item.order_id}
                          className="grid grid-cols-3 px-3 py-3 text-sm text-[color:var(--dash-text)] sm:px-4"
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{plan}</span>
                            <span className="text-brand-caption text-[color:var(--dash-faint)]">
                              {formatDate(item.created_at ?? undefined)}
                            </span>
                          </span>
                          <span className="capitalize text-[color:var(--dash-muted)]">
                            {item.status || "paid"}
                          </span>
                          <span className="text-right font-semibold text-[color:var(--dash-accent)]">
                            {formatMoney(item.commission, item.currency || currency)}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <div className="px-3 py-8 text-center text-sm text-[color:var(--dash-muted)] sm:px-4 sm:py-10">
                    No commission records yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </PortalShell>
  );
}
