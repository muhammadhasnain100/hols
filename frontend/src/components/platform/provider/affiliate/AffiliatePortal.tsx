"use client";

import { Button } from "@/components/ui/Button";
import { PortalShell, portalIcons } from "@/components/platform/provider/PortalShell";
import { PortalStatCard } from "@/components/platform/provider/PortalStatCard";

const nav = [
  { label: "Dashboard", href: "/affiliate", icon: portalIcons.dashboard },
  { label: "Referrals", href: "/affiliate#referrals", icon: portalIcons.referrals },
  { label: "Earnings", href: "/affiliate#earnings", icon: portalIcons.earnings },
  { label: "Profile", href: "/affiliate#profile", icon: portalIcons.profile },
];

const referrals = [
  { name: "Jane Doe", joined: "Jul 2, 2026", plan: "Monthly", status: "Active" },
  { name: "Chris Lee", joined: "Jun 18, 2026", plan: "Annual", status: "Active" },
  { name: "Morgan Reed", joined: "Jun 4, 2026", plan: "Biannual", status: "Trial" },
];

const payouts = [
  { month: "June 2026", amount: "$420.00", status: "Paid" },
  { month: "May 2026", amount: "$385.50", status: "Paid" },
  { month: "April 2026", amount: "$312.00", status: "Paid" },
];

export function AffiliatePortal() {
  return (
    <PortalShell
      role="affiliate"
      title="Affiliate Dashboard"
      subtitle="Monitor referrals, invite links, and commission performance."
      nav={nav}
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="grid gap-6">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <PortalStatCard label="Referred students" value="42" trend="+6 this month" />
            <PortalStatCard label="Conversion rate" value="18%" hint="Signup to paid plan" />
            <PortalStatCard label="Commission margin" value="15%" hint="Current tier" />
          </div>

          <div id="referrals" className="glass-panel rounded-3xl p-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/40 pb-5">
              <div>
                <h2 className="font-sans text-lg font-semibold text-primary">Recent Referrals</h2>
                <p className="mt-1 text-sm text-muted">Students who joined through your invite link.</p>
              </div>
              <Button variant="secondary" size="sm">
                Copy invite link
              </Button>
            </div>

            <div className="mt-5 space-y-3">
              {referrals.map((referral) => (
                <div
                  key={referral.name}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/10 bg-white/70 px-4 py-4"
                >
                  <div>
                    <p className="font-medium text-primary">{referral.name}</p>
                    <p className="mt-1 text-sm text-muted">Joined {referral.joined}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-primary">{referral.plan}</p>
                    <p className="mt-1 text-xs text-muted">{referral.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <aside className="grid gap-6">
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="font-sans text-lg font-semibold text-primary">Invite Link</h2>
            <p className="mt-2 text-sm text-muted">Share this link with clinics and students you refer.</p>
            <div className="mt-5 rounded-2xl border border-primary/10 bg-white/80 px-4 py-3 text-sm text-primary">
              https://hols.app/register?ref=AFF-001
            </div>
            <Button variant="primary" size="md" className="mt-5 w-full justify-center">
              Copy link
            </Button>
          </div>

          <div id="earnings" className="glass-panel rounded-3xl p-6">
            <h2 className="font-sans text-lg font-semibold text-primary">Earnings</h2>
            <p className="mt-2 text-sm text-muted">Dummy payout history for your affiliate account.</p>
            <div className="mt-5 space-y-3">
              {payouts.map((payout) => (
                <div
                  key={payout.month}
                  className="flex items-center justify-between rounded-2xl border border-primary/10 bg-white/70 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-medium text-primary">{payout.month}</p>
                    <p className="text-xs text-muted">{payout.status}</p>
                  </div>
                  <p className="text-sm font-semibold text-primary">{payout.amount}</p>
                </div>
              ))}
            </div>
          </div>

          <div id="profile" className="glass-panel rounded-3xl p-6">
            <h2 className="font-sans text-lg font-semibold text-primary">Affiliate Profile</h2>
            <p className="mt-2 text-sm text-muted">
              Update your clinic details, invite code, and payout preferences.
            </p>
            <Button variant="glass" size="md" className="mt-5 w-full justify-center">
              Edit profile
            </Button>
          </div>
        </aside>
      </div>
    </PortalShell>
  );
}
