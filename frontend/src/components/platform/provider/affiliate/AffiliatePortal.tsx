"use client";

import { useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PortalStatCard } from "@/components/platform/provider/PortalStatCard";
import { Button } from "@/components/ui/Button";
import { affiliateNav } from "@/components/platform/provider/affiliate/affiliateNav";
import {
  affiliateDisplayName,
  formatAffiliatePercent,
  useAffiliateProfile,
} from "@/components/platform/provider/affiliate/affiliateProfile";

export function AffiliatePortal() {
  const { profile, inviteInfo, refreshing, error, setError, inviteLink } = useAffiliateProfile();
  const [copySuccess, setCopySuccess] = useState(false);
  const studentCount = inviteInfo?.student_count ?? profile?.student_count ?? 0;
  const invitationQuota = inviteInfo?.invitation_quota ?? profile?.invitation_quota;
  const inviteCode = inviteInfo?.invite_code ?? profile?.invite_code;

  async function copyInviteLink() {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopySuccess(true);
      window.setTimeout(() => setCopySuccess(false), 2500);
    } catch {
      setError("Could not copy invite link. Please copy it manually.");
    }
  }

  return (
    <PortalShell
      role="affiliate"
      title={`Welcome, ${affiliateDisplayName(profile)}`}
      subtitle="Monitor referrals, invitation quota, and commission settings."
      nav={affiliateNav}
    >
      <div className="grid gap-6">
        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        {copySuccess ? <AuthAlert variant="success">Invite link copied.</AuthAlert> : null}

        {refreshing && !profile ? (
          <div className="rounded-2xl border border-black/[0.06] bg-white p-10 text-center">
            <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <PortalStatCard label="Referred students" value={String(studentCount)} hint="Students using your code" />
              <PortalStatCard
                label="Invitation quota"
                value={invitationQuota == null ? "Unlimited" : `${studentCount}/${invitationQuota}`}
                hint="Admin-managed limit"
              />
              <PortalStatCard label="Commission margin" value={formatAffiliatePercent(profile?.margin_percent)} hint="Current rate" />
              <PortalStatCard label="Invite code" value={inviteCode ?? "Not assigned"} hint="Referral identifier" />
            </div>

            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-primary">Referral snapshot</h2>
                    <p className="mt-1 text-sm text-primary/45">
                      Share your invite link and track current referral capacity from one place.
                    </p>
                  </div>
                  <Button variant="primary" size="md" onClick={copyInviteLink} disabled={!inviteLink}>
                    Copy invite link
                  </Button>
                </div>

                <div className="mt-5 rounded-2xl border border-primary/10 bg-[#F5F7FA] p-4">
                  <p className="text-[12px] font-medium uppercase tracking-[0.12em] text-primary/40">Invite link</p>
                  <p className="mt-2 break-all text-sm font-medium text-primary">
                    {inviteLink || "Your invite link will appear after an admin assigns an invite code."}
                  </p>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-xl border border-black/[0.06] bg-white p-4">
                    <p className="text-sm font-medium text-primary">Used quota</p>
                    <p className="mt-1 text-2xl font-semibold text-primary">{studentCount}</p>
                  </div>
                  <div className="rounded-xl border border-black/[0.06] bg-white p-4">
                    <p className="text-sm font-medium text-primary">Available</p>
                    <p className="mt-1 text-2xl font-semibold text-primary">
                      {invitationQuota == null
                        ? "Unlimited"
                        : Math.max(invitationQuota - studentCount, 0)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-black/[0.06] bg-white p-4">
                    <p className="text-sm font-medium text-primary">Status</p>
                    <p className="mt-1 text-2xl font-semibold text-primary">
                      {invitationQuota != null && studentCount >= invitationQuota
                        ? "Full"
                        : "Active"}
                    </p>
                  </div>
                </div>
              </section>

              <aside className="grid gap-5">
                <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
                  <h2 className="text-lg font-semibold text-primary">Quick actions</h2>
                  <div className="mt-5 grid gap-3">
                    <Button href="/affiliate/referrals" variant="secondary" size="md" className="w-full justify-center">
                      Open referrals
                    </Button>
                    <Button href="/affiliate/earnings" variant="secondary" size="md" className="w-full justify-center">
                      View earnings
                    </Button>
                    <Button href="/affiliate/profile" variant="secondary" size="md" className="w-full justify-center">
                      Edit profile
                    </Button>
                  </div>
                </section>

                <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
                  <h2 className="text-lg font-semibold text-primary">Account health</h2>
                  <dl className="mt-4 grid gap-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-primary/45">Email verified</dt>
                      <dd className="font-medium text-primary">{profile?.email_verified ? "Yes" : "No"}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-primary/45">Marketing updates</dt>
                      <dd className="font-medium text-primary">{profile?.marketing_pref ? "On" : "Off"}</dd>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <dt className="text-primary/45">Profile photo</dt>
                      <dd className="font-medium text-primary">{profile?.profile_pic ? "Added" : "Missing"}</dd>
                    </div>
                  </dl>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
    </PortalShell>
  );
}
