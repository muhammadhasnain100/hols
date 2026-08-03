"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight, Icon, Star, User, Users } from "@/components/icons";
import { DashboardPageLayout } from "@/components/platform/provider/admin/dashboard/DashboardPageLayout";
import {
  getCachedAdminAffiliates,
  listAdminAffiliates,
} from "@/lib/integrate/provider/admin/affiliates/api";
import { getCachedStudents, listStudents } from "@/lib/integrate/provider/admin/users/api";
import { getCachedAdminPlans, listPlans } from "@/lib/integrate/provider/admin/payment/api";
import {
  displayNameFromUser,
  useStoredUser,
} from "@/lib/integrate/auth/useStoredUser";
import { cn } from "@/lib/utils";

type QuickTool = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

type QuickLink = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const QUICK_TOOLS: readonly QuickTool[] = [
  {
    label: "Students",
    href: "/admin/students",
    icon: <Icon icon={Users} size={18} />,
  },
  {
    label: "Affiliates",
    href: "/admin/affiliates",
    icon: (
      <Icon icon={Users} size={18} />
    ),
  },
  {
    label: "Plans",
    href: "/admin/plans",
    icon: <Icon icon={Star} size={18} />,
  },
  {
    label: "Profile",
    href: "/admin/profile",
    icon: <Icon icon={User} size={18} />,
  },
];

const QUICK_LINKS: readonly QuickLink[] = [
  {
    label: "Manage students",
    href: "/admin/students",
    icon: <Icon icon={Users} size={16} />,
  },
  {
    label: "Manage affiliates",
    href: "/admin/affiliates",
    icon: <Icon icon={Users} size={16} />,
  },
  {
    label: "Plan pricing",
    href: "/admin/plans",
    icon: <Icon icon={Star} size={16} />,
  },
  {
    label: "Account profile",
    href: "/admin/profile",
    icon: <Icon icon={User} size={16} />,
  },
];

export function AdminPortal() {
  const { user, ready } = useStoredUser();
  const [loading, setLoading] = useState(true);
  const [studentTotal, setStudentTotal] = useState("—");
  const [affiliateTotal, setAffiliateTotal] = useState("—");
  const [planCount, setPlanCount] = useState("—");

  useEffect(() => {
    async function loadSummary() {
      // Prefer cached values after mount to avoid SSR/client mismatches.
      const cachedStudents = getCachedStudents({ page: 1, limit: 1 });
      const cachedAffiliates = getCachedAdminAffiliates({ page: 1, limit: 1 });
      const cachedPlans = getCachedAdminPlans();
      if (cachedStudents) setStudentTotal(String(cachedStudents.pagination.total));
      if (cachedAffiliates) setAffiliateTotal(String(cachedAffiliates.pagination.total));
      if (cachedPlans) setPlanCount(String(cachedPlans.length));
      if (cachedStudents && cachedAffiliates && cachedPlans) setLoading(false);

      try {
        const [studentsRes, affiliatesRes, plansRes] = await Promise.all([
          listStudents({ page: 1, limit: 1 }),
          listAdminAffiliates({ page: 1, limit: 1 }),
          listPlans(),
        ]);
        setStudentTotal(String(studentsRes.pagination.total));
        setAffiliateTotal(String(affiliatesRes.pagination.total));
        setPlanCount(String(plansRes.items.length));
      } catch {
        // Keep dashboard usable even if summary calls fail.
      } finally {
        setLoading(false);
      }
    }

    void loadSummary();
  }, []);

  const displayName = ready ? displayNameFromUser(user, "Admin") : "Admin";

  return (
    <DashboardPageLayout>
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            <OverviewHeroCard
              displayName={displayName}
              studentTotal={studentTotal}
              affiliateTotal={affiliateTotal}
              planCount={planCount}
            />
            <QuickToolsCard />
            <StatsCard
              studentTotal={studentTotal}
              affiliateTotal={affiliateTotal}
              planCount={planCount}
            />
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            <QuickLinksCard studentTotal={studentTotal} affiliateTotal={affiliateTotal} />
          </div>
        </>
      )}
    </DashboardPageLayout>
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
          <SkeletonBlock className="mt-3 h-4 w-36 rounded-full" />
          <div className="mt-5 flex flex-wrap gap-2">
            <SkeletonBlock className="h-10 w-24 rounded-full" />
            <SkeletonBlock className="h-10 w-20 rounded-full" />
            <SkeletonBlock className="h-10 w-16 rounded-full" />
          </div>
        </section>

        <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-5 w-28 rounded-full" />
            <SkeletonBlock className="h-4 w-16 rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="flex flex-col items-center gap-2">
                <SkeletonBlock className="h-11 w-11 rounded-full sm:h-12 sm:w-12" />
                <SkeletonBlock className="h-3 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </section>

        <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
          <SkeletonBlock className="h-5 w-32 rounded-full" />
          <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="min-w-0 rounded-xl px-3 py-3">
                <SkeletonBlock className="h-3 w-12 rounded-full" />
                <SkeletonBlock className="mt-2 h-6 w-10 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
        <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
          <div className="space-y-1">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2.5 sm:px-3 sm:py-3"
              >
                <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
                <SkeletonBlock className="h-3.5 flex-1 rounded-full" />
                <SkeletonBlock className="h-4 w-4 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
            <SkeletonBlock className="h-10 w-full rounded-full" />
            <SkeletonBlock className="h-10 w-full rounded-full" />
          </div>
        </section>
      </div>
    </>
  );
}

function OverviewHeroCard({
  displayName,
  studentTotal,
  affiliateTotal,
  planCount,
}: {
  displayName: string;
  studentTotal: string;
  affiliateTotal: string;
  planCount: string;
}) {
  return (
    <section className="dashboard-glass-card relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
      <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
        Admin overview
      </p>
      <div className="mt-2 flex min-w-0 flex-wrap items-end gap-x-2 gap-y-1">
        <span className="font-sans max-w-full min-w-0 break-words text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.5rem] md:leading-none">
          {displayName}
        </span>
        <span className="mb-0.5 text-brand-caption font-medium text-[color:var(--dash-faint)] sm:mb-1">
          Administrator
        </span>
      </div>
      <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">
        <span className="sm:hidden">
          {studentTotal} students · {affiliateTotal} affiliates
        </span>
        <span className="hidden sm:inline">
          {studentTotal} students · {affiliateTotal} affiliates · {planCount} plans
        </span>
      </p>

      <div className="mt-4 grid w-full grid-cols-1 gap-2 min-[380px]:grid-cols-3 sm:mt-5 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5">
        <HeroPill href="/admin/students" variant="solid">
          Students
        </HeroPill>
        <HeroPill href="/admin/affiliates" variant="soft">
          Affiliates
        </HeroPill>
        <HeroPill href="/admin/plans" variant="soft">
          Plans
        </HeroPill>
      </div>
    </section>
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

function QuickToolsCard() {
  return (
    <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-accent)] sm:text-lg">
          Quick tools
        </h2>
        <Link
          href="/admin/students"
          className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-accent)] hover:brightness-110"
        >
          View all
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-3">
        {QUICK_TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group flex flex-col items-center gap-2">
            <span className="dashboard-tool-icon flex h-11 w-11 items-center justify-center rounded-full text-[color:var(--dash-text)] transition sm:h-12 sm:w-12 group-hover:text-[#152744]">
              {tool.icon}
            </span>
            <span className="text-brand-caption text-center text-[color:var(--dash-muted)] group-hover:text-[color:var(--dash-text)]">
              {tool.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function StatsCard({
  studentTotal,
  affiliateTotal,
  planCount,
}: {
  studentTotal: string;
  affiliateTotal: string;
  planCount: string;
}) {
  const stats = [
    { label: "Students", value: studentTotal, hint: "Registered learners" },
    { label: "Affiliates", value: affiliateTotal, hint: "Referral partners" },
    { label: "Plans", value: planCount, hint: "Membership tiers" },
  ];

  return (
    <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
          Platform stats
        </h2>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
        {stats.map((stat) => (
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
  );
}

function QuickLinksCard({
  studentTotal,
  affiliateTotal,
}: {
  studentTotal: string;
  affiliateTotal: string;
}) {
  return (
    <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
      <div className="space-y-1">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="dashboard-row group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition sm:gap-3 sm:px-3 sm:py-3"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)] transition group-hover:bg-[#DDE466]/15 group-hover:text-[color:var(--dash-accent)]">
              {link.icon}
            </span>
            <span className="font-sans min-w-0 flex-1 truncate text-sm font-medium text-[color:var(--dash-muted)]">
              {link.label}
            </span>
            {link.label === "Manage students" && studentTotal !== "—" ? (
              <span className="text-brand-caption rounded-full bg-[color:var(--dash-soft)] px-2 py-0.5 font-medium text-[color:var(--dash-faint)]">
                {studentTotal}
              </span>
            ) : null}
            {link.label === "Manage affiliates" && affiliateTotal !== "—" ? (
              <span className="text-brand-caption rounded-full bg-[color:var(--dash-soft)] px-2 py-0.5 font-medium text-[color:var(--dash-faint)]">
                {affiliateTotal}
              </span>
            ) : null}
            <Icon
              icon={ChevronRight}
              size={16}
              className="shrink-0 text-[color:var(--dash-dim)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--dash-muted)]"
            />
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
        <Link
          href="/admin/students"
          className="font-sans inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-4 text-sm font-medium text-[#152744] transition hover:brightness-105"
        >
          Open students
        </Link>
        <Link
          href="/admin/plans"
          className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium text-[color:var(--dash-text)] transition"
        >
          Manage plans
        </Link>
      </div>
    </section>
  );
}
