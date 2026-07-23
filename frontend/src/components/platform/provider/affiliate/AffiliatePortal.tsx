"use client";

import Link from "next/link";
import { useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { DashboardPageLayout } from "@/components/platform/provider/affiliate/dashboard/DashboardPageLayout";
import {
  affiliateDisplayName,
  formatAffiliatePercent,
  useAffiliateProfile,
} from "@/components/platform/provider/affiliate/affiliateProfile";
import { cn } from "@/lib/utils";

type QuickTool = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const QUICK_TOOLS: readonly QuickTool[] = [
  {
    label: "Referrals",
    href: "/affiliate/referrals",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    label: "Earnings",
    href: "/affiliate/earnings",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/affiliate/profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.7-3.3 4.3-5 8-5s6.3 1.7 8 5" />
      </svg>
    ),
  },
];

export function AffiliatePortal() {
  const { profile, inviteInfo, refreshing, error, setError, inviteLink } = useAffiliateProfile();
  const [copied, setCopied] = useState<"code" | "url" | "hero" | null>(null);
  const studentCount = inviteInfo?.student_count ?? profile?.student_count ?? 0;
  const invitationQuota = inviteInfo?.invitation_quota ?? profile?.invitation_quota;
  const inviteCode = inviteInfo?.invite_code ?? profile?.invite_code;
  const quotaLabel = invitationQuota == null ? "Unlimited" : `${studentCount}/${invitationQuota}`;
  const available =
    invitationQuota == null ? "Unlimited" : String(Math.max(invitationQuota - studentCount, 0));
  const status =
    invitationQuota != null && studentCount >= invitationQuota ? "Full" : "Active";
  const displayName = affiliateDisplayName(profile);

  async function copyText(value: string | undefined | null, field: "code" | "url" | "hero") {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      window.setTimeout(() => setCopied(null), 1800);
      setError(null);
    } catch {
      setError("Could not copy. Please copy it manually.");
    }
  }

  return (
    <DashboardPageLayout>
      {error ? (
        <div className="col-span-full">
          <AuthAlert variant="error">{error}</AuthAlert>
        </div>
      ) : null}
      {refreshing && !profile ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            <section className="dashboard-glass-card relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                Affiliate overview
              </p>
              <div className="mt-2 flex min-w-0 flex-wrap items-end gap-x-2 gap-y-1">
                <span className="font-sans max-w-full min-w-0 break-words text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.5rem] md:leading-none">
                  {displayName}
                </span>
                <span className="mb-0.5 text-brand-caption font-medium text-[color:var(--dash-faint)] sm:mb-1">
                  Partner
                </span>
              </div>
              <p className="text-brand-body mt-2 text-sm text-[color:var(--dash-muted)] sm:text-base">
                <span className="sm:hidden">
                  {studentCount} referred · {formatAffiliatePercent(profile?.margin_percent)}
                </span>
                <span className="hidden sm:inline">
                  {studentCount} referred · {quotaLabel} quota · {formatAffiliatePercent(profile?.margin_percent)} margin
                </span>
              </p>

              <div className="mt-4 grid w-full grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:mt-5 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5">
                <HeroPill href="/affiliate/referrals" variant="solid">
                  Referrals
                </HeroPill>
                <HeroPill href="/affiliate/earnings" variant="soft">
                  Earnings
                </HeroPill>
                <button
                  type="button"
                  onClick={() => copyText(inviteLink, "hero")}
                  disabled={!inviteLink}
                  className="dashboard-pill-soft font-sans col-span-2 inline-flex min-h-10 w-full items-center justify-center rounded-full px-3 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-50 min-[420px]:col-span-1 sm:w-auto sm:px-5"
                >
                  {copied === "hero" ? "Copied" : "Copy link"}
                </button>
              </div>
            </section>

            <section className="dashboard-glass-card rounded-2xl p-3.5 sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-accent)] sm:text-lg">
                  Quick tools
                </h2>
                <Link
                  href="/affiliate/referrals"
                  className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-accent)] hover:brightness-110"
                >
                  View all
                </Link>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                {QUICK_TOOLS.map((tool) => (
                  <Link key={tool.href} href={tool.href} className="group flex min-w-0 flex-col items-center gap-2">
                    <span className="dashboard-tool-icon flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--dash-text)] transition sm:h-12 sm:w-12 group-hover:text-[#152744]">
                      {tool.icon}
                    </span>
                    <span className="text-brand-caption max-w-full truncate text-center text-[color:var(--dash-muted)] group-hover:text-[color:var(--dash-text)]">
                      {tool.label}
                    </span>
                  </Link>
                ))}
              </div>
            </section>

            <section className="dashboard-glass-card rounded-2xl p-3.5 sm:p-5">
              <h2 className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                Referral stats
              </h2>
              <div className="mt-4 grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-3">
                {[
                  { label: "Students", value: String(studentCount), hint: "Using your code" },
                  { label: "Available", value: available, hint: "Remaining invites" },
                  { label: "Status", value: status, hint: "Quota health" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="dashboard-row min-w-0 rounded-xl px-3 py-3 sm:px-3.5 sm:py-3.5"
                  >
                    <p className="text-brand-caption font-medium text-[color:var(--dash-faint)]">{stat.label}</p>
                    <p className="font-sans mt-1 break-words text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl">
                      {stat.value}
                    </p>
                    <p className="text-brand-caption mt-0.5 hidden text-[color:var(--dash-dim)] sm:block">{stat.hint}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            <section className="dashboard-glass-card min-w-0 rounded-2xl p-3.5 sm:p-5">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                    Share
                  </p>
                  <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                    Invite link
                  </h2>
                </div>
                <Link
                  href="/affiliate/referrals"
                  className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-accent)] hover:brightness-110"
                >
                  Referrals
                </Link>
              </div>
              <p className="text-brand-body mt-1 text-sm text-[color:var(--dash-muted)]">
                Students should sign up from this link so your referral code is attached.
              </p>

              <div className="mt-4 grid min-w-0 gap-2">
                <CopyField
                  label="Invite code"
                  value={inviteCode ?? "Not assigned"}
                  copyValue={inviteCode}
                  copied={copied === "code"}
                  onCopy={() => copyText(inviteCode, "code")}
                  valueClassName="text-base font-semibold"
                />
                <CopyField
                  label="Shareable URL"
                  value={
                    inviteLink ||
                    "An admin must assign your invite code before referrals can be tracked."
                  }
                  copyValue={inviteLink}
                  copied={copied === "url"}
                  onCopy={() => copyText(inviteLink, "url")}
                  valueClassName="text-sm font-medium"
                />
                <div className="dashboard-row min-w-0 rounded-xl px-3 py-3">
                  <p className="text-brand-caption font-medium text-[color:var(--dash-faint)]">Commission</p>
                  <p className="font-sans mt-1 text-sm font-semibold text-[color:var(--dash-text)]">
                    {formatAffiliatePercent(profile?.margin_percent)}
                  </p>
                </div>
              </div>
            </section>

            <section className="dashboard-glass-card rounded-2xl p-3.5 sm:p-5">
              <h2 className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                Account health
              </h2>
              <div className="mt-3 space-y-1">
                <HealthRow label="Email verified" value={profile?.email_verified ? "Yes" : "No"} />
                <HealthRow label="Marketing updates" value={profile?.marketing_pref ? "On" : "Off"} />
                <HealthRow label="Profile photo" value={profile?.profile_pic ? "Added" : "Missing"} />
              </div>
              <Link
                href="/affiliate/profile"
                className="dashboard-pill-soft font-sans mt-4 inline-flex min-h-10 w-full items-center justify-center rounded-full px-4 text-sm font-medium text-[color:var(--dash-text)] transition"
              >
                Edit profile
              </Link>
            </section>
          </div>
        </>
      )}
    </DashboardPageLayout>
  );
}

function HeroPill({
  href,
  variant,
  children,
}: {
  href: string;
  variant: "solid" | "soft";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-sans inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium tracking-[0.01em] transition sm:w-auto sm:px-5",
        variant === "solid"
          ? "bg-[#DDE466] text-[#152744] hover:brightness-105"
          : "dashboard-pill-soft text-[color:var(--dash-text)]",
      )}
    >
      {children}
    </Link>
  );
}

function HealthRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="dashboard-row flex min-w-0 items-center justify-between gap-3 rounded-xl px-3 py-2.5">
      <span className="text-brand-caption min-w-0 truncate text-[color:var(--dash-faint)]">{label}</span>
      <span className="font-sans shrink-0 text-sm font-medium text-[color:var(--dash-text)]">{value}</span>
    </div>
  );
}

const copyIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
    <rect x="9" y="9" width="13" height="13" rx="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const checkIcon = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

function CopyField({
  label,
  value,
  copyValue,
  copied,
  onCopy,
  valueClassName,
}: {
  label: string;
  value: string;
  copyValue?: string | null;
  copied: boolean;
  onCopy: () => void;
  valueClassName?: string;
}) {
  const canCopy = Boolean(copyValue);
  return (
    <div className="dashboard-row min-w-0 overflow-hidden rounded-xl px-3 py-3">
      <div className="flex items-start justify-between gap-2">
        <p className="text-brand-caption min-w-0 font-medium text-[color:var(--dash-faint)]">{label}</p>
        <button
          type="button"
          onClick={onCopy}
          disabled={!canCopy}
          aria-label={copied ? `${label} copied` : `Copy ${label}`}
          className="dashboard-pill-soft font-sans inline-flex h-8 shrink-0 items-center gap-1 rounded-full px-2.5 text-xs font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-40"
        >
          {copied ? checkIcon : copyIcon}
          <span className="hidden min-[360px]:inline">{copied ? "Copied" : "Copy"}</span>
        </button>
      </div>
      <p
        className={`font-sans mt-1 break-all text-[color:var(--dash-text)] [overflow-wrap:anywhere] ${valueClassName ?? "text-sm font-medium"}`}
      >
        {value}
      </p>
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <span className={cn("dashboard-skeleton-block", className)} aria-hidden />;
}

function DashboardSkeleton() {
  return (
    <>
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4" aria-busy="true" aria-label="Loading dashboard">
        <section className="dashboard-glass-card relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6">
          <SkeletonBlock className="h-3 w-28 rounded-full" />
          <SkeletonBlock className="mt-3 h-8 w-40 rounded-full sm:h-10 sm:w-52" />
          <SkeletonBlock className="mt-3 h-4 w-48 rounded-full" />
        </section>
        <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
          <SkeletonBlock className="h-5 w-28 rounded-full" />
          <div className="mt-4 grid grid-cols-3 gap-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <SkeletonBlock className="h-11 w-11 rounded-full" />
                <SkeletonBlock className="h-3 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
          <SkeletonBlock className="h-5 w-32 rounded-full" />
          <SkeletonBlock className="mt-3 h-16 w-full rounded-xl" />
        </section>
      </div>
    </>
  );
}
