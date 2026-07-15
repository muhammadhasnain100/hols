"use client";

import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PortalStatCard } from "@/components/platform/provider/PortalStatCard";
import { affiliateNav } from "@/components/platform/provider/affiliate/affiliateNav";
import {
  formatAffiliatePercent,
  useAffiliateProfile,
} from "@/components/platform/provider/affiliate/affiliateProfile";

export function AffiliateEarningsPage() {
  const { profile, inviteInfo, refreshing, error } = useAffiliateProfile();
  const studentCount = inviteInfo?.student_count ?? profile?.student_count ?? 0;
  const margin = profile?.margin_percent;
  const inviteCode = inviteInfo?.invite_code ?? profile?.invite_code;

  return (
    <PortalShell
      role="affiliate"
      title="Earnings"
      subtitle="Review commission settings and payout readiness."
      nav={affiliateNav}
    >
      <div className="mx-auto grid w-full max-w-5xl gap-5">
        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        {refreshing && !profile ? (
          <div className="rounded-2xl border border-black/[0.06] bg-white p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <PortalStatCard label="Commission margin" value={formatAffiliatePercent(margin)} hint="Admin-managed" />
              <PortalStatCard label="Referred students" value={String(studentCount)} hint="Eligible referral pool" />
              <PortalStatCard label="Payout status" value="Pending" hint="History endpoint pending" />
            </div>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
              <h2 className="text-lg font-semibold text-primary">Commission overview</h2>
              <p className="mt-1 text-sm text-primary/45">
                Your margin is assigned by admin. Earnings history will be shown here once payment/payout records are
                available to affiliates.
              </p>

              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <div className="rounded-2xl border border-primary/10 bg-[#F5F7FA] p-4">
                  <p className="text-sm font-medium text-primary">Current margin</p>
                  <p className="mt-2 text-3xl font-semibold text-primary">{formatAffiliatePercent(margin)}</p>
                </div>
                <div className="rounded-2xl border border-primary/10 bg-[#F5F7FA] p-4">
                  <p className="text-sm font-medium text-primary">Tracked referrals</p>
                  <p className="mt-2 text-3xl font-semibold text-primary">{studentCount}</p>
                </div>
                <div className="rounded-2xl border border-primary/10 bg-[#F5F7FA] p-4">
                  <p className="text-sm font-medium text-primary">Invite code</p>
                  <p className="mt-2 break-all text-xl font-semibold text-primary">
                    {inviteCode ?? "Not assigned"}
                  </p>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
              <h2 className="text-lg font-semibold text-primary">Payout history</h2>
              <p className="mt-1 text-sm text-primary/45">
                This section is prepared for payout rows, but there is no affiliate payout API in the backend yet.
              </p>

              <div className="mt-5 overflow-hidden rounded-2xl border border-black/[0.06]">
                <div className="grid grid-cols-3 bg-[#F5F7FA] px-4 py-3 text-[12px] font-medium uppercase tracking-[0.12em] text-primary/40">
                  <span>Period</span>
                  <span>Status</span>
                  <span className="text-right">Amount</span>
                </div>
                <div className="px-4 py-8 text-center text-sm text-primary/45">
                  Payout history will appear here after the backend returns affiliate earnings records.
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </PortalShell>
  );
}
