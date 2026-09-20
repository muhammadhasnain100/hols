"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Check, Copy, Icon } from "@/components/icons";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { DashboardRecentActivity } from "@/components/platform/provider/admin/dashboard/DashboardRecentActivity";
import {
  AffiliateEarningsChart,
  AffiliatePlanMixPie,
  AffiliateWalletPie,
} from "@/components/platform/provider/affiliate/dashboard/AffiliateDashboardCharts";
import { DashboardPageLayout } from "@/components/platform/provider/affiliate/dashboard/DashboardPageLayout";
import { AffiliateWalletCards } from "@/components/platform/provider/affiliate/AffiliateWalletCards";
import {
  formatAffiliatePercent,
  useAffiliateProfile,
} from "@/components/platform/provider/affiliate/affiliateProfile";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getAffiliateDashboard,
  type AffiliateDashboard,
  type DashboardPeriod,
} from "@/lib/integrate/provider/affiliate/dashboard";
import { cn } from "@/lib/utils";

function NavyLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "dashboard-navy-btn font-sans inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-white sm:min-h-10",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function AffiliatePortal() {
  const { profile, inviteInfo, refreshing, error: profileError, inviteLink } = useAffiliateProfile();
  const [period, setPeriod] = useState<DashboardPeriod>("weekly");
  const [dashboard, setDashboard] = useState<AffiliateDashboard | null>(null);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const studentCount = inviteInfo?.student_count ?? profile?.student_count ?? dashboard?.student_count ?? 0;
  const inviteCode = inviteInfo?.invite_code ?? profile?.invite_code ?? dashboard?.invite_code;
  const marginPercent = dashboard?.margin_percent ?? profile?.margin_percent;
  const wallet = dashboard?.wallet;
  const currency = wallet?.currency ?? dashboard?.currency ?? "USD";
  const lockDays = dashboard?.payout_lock_days ?? 7;
  const lockSeconds = dashboard?.payout_lock_seconds;
  const error = dashboardError ?? profileError;
  const loading = (refreshing && !profile) || (dashboardLoading && !dashboard);

  useEffect(() => {
    const controller = new AbortController();
    setDashboardLoading(true);
    setDashboardError(null);
    void getAffiliateDashboard(period, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setDashboard(data);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setDashboard(null);
        setDashboardError(err instanceof ApiRequestError ? err.message : "Failed to load dashboard.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setDashboardLoading(false);
      });
    return () => controller.abort();
  }, [period]);

  return (
    <DashboardPageLayout
      headerAction={
        <NavyLink href="/affiliate/payout" className="min-h-11 px-3.5 sm:min-h-10 sm:px-4">
          Payout
        </NavyLink>
      }
    >
      {error ? (
        <div className="col-span-full">
          <AuthAlert variant="error">{error}</AuthAlert>
        </div>
      ) : null}
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="col-span-full grid min-w-0 gap-3 sm:gap-4">
            <AffiliateWalletCards
              wallet={wallet}
              currency={currency}
              lockDays={lockDays}
              lockSeconds={lockSeconds}
              studentCount={studentCount}
              loading={dashboardLoading}
              order={["pending", "payout", "available", "lock"]}
            />
          </div>

          <div className="flex min-h-0 min-w-0 flex-col gap-3 sm:gap-4">
            <AffiliateEarningsChart
              dashboard={dashboard}
              period={period}
              onPeriodChange={setPeriod}
              loading={dashboardLoading}
            />
            <DashboardRecentActivity className="min-h-0 flex-1" />
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            <AffiliatePlanMixPie dashboard={dashboard} period={period} />
            <AffiliateWalletPie wallet={wallet} />
            <InviteCard
              inviteCode={inviteCode}
              inviteLink={inviteLink}
              studentCount={studentCount}
              marginPercent={marginPercent}
            />
          </div>
        </>
      )}
    </DashboardPageLayout>
  );
}

function InviteCard({
  inviteCode,
  inviteLink,
  studentCount,
  marginPercent,
}: {
  inviteCode?: string | null;
  inviteLink?: string | null;
  studentCount: number;
  marginPercent?: number | null;
}) {
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(null), 1800);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyValue(value: string | null | undefined, field: "code" | "link") {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(field);
      return;
    } catch {
      // Some browsers block clipboard.writeText; fall through to a selectable copy.
    }
    try {
      const input = document.createElement("textarea");
      input.value = value;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.left = "-9999px";
      document.body.appendChild(input);
      input.select();
      const ok = document.execCommand("copy");
      document.body.removeChild(input);
      setCopied(ok ? field : null);
    } catch {
      setCopied(null);
    }
  }

  const code = inviteCode?.trim() || "";
  const link = inviteLink?.trim() || "";

  return (
    <section className="dashboard-hero relative overflow-hidden rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
          Invite students
        </p>
        <Link
          href="/affiliate/customers"
          className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-muted)] hover:text-[color:var(--dash-text)]"
        >
          Customers
        </Link>
      </div>

      <p className="text-brand-caption mt-2 text-[color:var(--dash-muted)]">
        {studentCount} referred · {formatAffiliatePercent(marginPercent)} margin
      </p>

      <div className="mt-3 grid min-w-0 gap-2">
        <InviteCopyRow
          label="Code"
          value={code || "Not assigned"}
          displayClassName="font-mono text-base font-bold tracking-[0.12em] sm:text-lg"
          canCopy={Boolean(code)}
          copied={copied === "code"}
          actionLabel="Copy code"
          onCopy={() => void copyValue(code, "code")}
        />
        <InviteCopyRow
          label="Invite link"
          value={link || "Your invite link appears after a code is assigned."}
          displayClassName="text-sm font-medium"
          canCopy={Boolean(link)}
          copied={copied === "link"}
          actionLabel="Copy link"
          onCopy={() => void copyValue(link, "link")}
        />
      </div>
    </section>
  );
}

function InviteCopyRow({
  label,
  value,
  displayClassName,
  canCopy,
  copied,
  actionLabel,
  onCopy,
}: {
  label: string;
  value: string;
  displayClassName: string;
  canCopy: boolean;
  copied: boolean;
  actionLabel: string;
  onCopy: () => void;
}) {
  return (
    <div className="dashboard-row flex min-w-0 items-center gap-3 rounded-xl px-3 py-2.5 sm:px-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-brand-caption font-medium text-[color:var(--dash-faint)]">{label}</p>
        <p
          className={cn(
            "font-sans mt-0.5 truncate text-[color:var(--dash-text)]",
            displayClassName,
          )}
          title={value}
        >
          {value}
        </p>
      </div>
      <button
        type="button"
        onClick={onCopy}
        disabled={!canCopy}
        aria-label={copied ? `${actionLabel} copied` : actionLabel}
        className="dashboard-navy-btn font-sans inline-flex min-h-11 w-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-0 text-sm font-medium tracking-[0.01em] text-white disabled:pointer-events-none disabled:opacity-50 min-[380px]:w-auto min-[380px]:px-3.5 sm:min-h-10 sm:px-4"
      >
        <Icon icon={copied ? Check : Copy} size={14} strokeWidth={2} />
        <span className="hidden min-[380px]:inline">{copied ? "Copied" : actionLabel}</span>
      </button>
    </div>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <span className={cn("dashboard-skeleton-block", className)} aria-hidden />;
}

function DashboardSkeleton() {
  return (
    <>
      <div className="col-span-full grid min-w-0 gap-3 sm:gap-4" aria-busy="true" aria-label="Loading dashboard">
        <div className="grid min-w-0 grid-cols-2 gap-2.5 sm:grid-cols-4 sm:gap-3">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={`money-${index}`} className="dashboard-glass-card min-w-0 rounded-2xl px-3.5 py-3 sm:px-4 sm:py-4">
              <SkeletonBlock className="h-3 w-16 rounded-full" />
              <SkeletonBlock className="mt-2 h-6 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
          <SkeletonBlock className="h-5 w-28 rounded-full" />
          <SkeletonBlock className="mt-4 h-52 w-full rounded-2xl" />
        </section>
        <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
          <SkeletonBlock className="h-5 w-32 rounded-full" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 4 }, (_, index) => (
              <SkeletonBlock key={index} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </section>
      </div>
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
          <SkeletonBlock className="h-5 w-32 rounded-full" />
          <SkeletonBlock className="mx-auto mt-4 h-44 w-44 rounded-full" />
        </section>
        <section className="dashboard-hero rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-3 w-28 rounded-full" />
            <SkeletonBlock className="h-3 w-16 rounded-full" />
          </div>
          <SkeletonBlock className="mt-3 h-3 w-40 rounded-full" />
          <div className="mt-3 grid gap-2">
            <SkeletonBlock className="h-14 w-full rounded-xl" />
            <SkeletonBlock className="h-14 w-full rounded-xl" />
          </div>
        </section>
      </div>
    </>
  );
}
