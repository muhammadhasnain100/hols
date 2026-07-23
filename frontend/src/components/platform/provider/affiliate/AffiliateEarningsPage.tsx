"use client";

import Link from "next/link";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { StatPill } from "@/components/platform/provider/admin/shared";
import { affiliateNav } from "@/components/platform/provider/affiliate/affiliateNav";
import {
  formatAffiliatePercent,
  useAffiliateProfile,
} from "@/components/platform/provider/affiliate/affiliateProfile";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

export function AffiliateEarningsPage() {
  const { profile, inviteInfo, refreshing, error } = useAffiliateProfile();
  const studentCount = inviteInfo?.student_count ?? profile?.student_count ?? 0;
  const margin = profile?.margin_percent;
  const inviteCode = inviteInfo?.invite_code ?? profile?.invite_code;

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
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                <path d="M4 7h16M4 12h10M4 17h16" />
              </svg>
            </button>
            <h1 className="font-sans truncate text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl">
              Earnings
            </h1>
          </div>
          <WelcomeChip fallbackName="Affiliate" />
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
            <div className="flex flex-col gap-3.5 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                  Commission
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
                  <span className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                    {refreshing && !profile ? "—" : formatAffiliatePercent(margin)}
                  </span>
                  <span className="mb-0.5 text-brand-caption font-medium text-[color:var(--dash-faint)]">
                    margin
                  </span>
                </div>
                <p className="text-brand-body mt-2 text-sm text-[color:var(--dash-muted)] sm:text-base">
                  <span className="sm:hidden">Admin-assigned margin. Payouts coming soon.</span>
                  <span className="hidden sm:inline">
                    Your margin is assigned by admin. Payout history will appear when available.
                  </span>
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
                  <span className="sm:hidden">Margin</span>
                  <span className="hidden sm:inline">Commission margin</span>
                </>
              }
              value={formatAffiliatePercent(margin)}
            />
            <StatPill
              label={
                <>
                  <span className="sm:hidden">Referred</span>
                  <span className="hidden sm:inline">Referred students</span>
                </>
              }
              value={String(studentCount)}
            />
            <StatPill
              label={
                <>
                  <span className="sm:hidden">Payout</span>
                  <span className="hidden sm:inline">Payout status</span>
                </>
              }
              value="Pending"
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
              Payout history
            </h2>
            <p className="text-brand-body mt-1 text-sm text-[color:var(--dash-muted)]">
              Payout rows will show here once the affiliate earnings API is available.
            </p>
            <div className="mt-4 -mx-1 overflow-x-auto px-1 sm:mx-0 sm:px-0">
              <div className="min-w-[18rem] overflow-hidden rounded-xl border border-[color:var(--dash-surface-border)]">
                <div className="grid grid-cols-3 bg-[color:var(--dash-soft)] px-3 py-3 text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)] sm:px-4">
                  <span>Period</span>
                  <span>Status</span>
                  <span className="text-right">Amount</span>
                </div>
                <div className="px-3 py-8 text-center text-sm text-[color:var(--dash-muted)] sm:px-4 sm:py-10">
                  No payout records yet.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </PortalShell>
  );
}
