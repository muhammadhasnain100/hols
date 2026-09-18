"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardPageLayout } from "@/components/platform/provider/student/dashboard/DashboardPageLayout";
import {
  SidebarSvgIcon,
  type SidebarIconName,
} from "@/components/platform/provider/sidebar-icons";
import {
  getCurrentMembership,
  listOrders,
  listPlans,
} from "@/lib/integrate/provider/student/payment/api";
import type { Order } from "@/lib/integrate/provider/student/payment/types";
import {
  formatDate,
  formatMoney,
  planLabels,
} from "@/lib/integrate/provider/student/payment/types";
import { listWebinars, type WebinarSummary } from "@/lib/integrate/provider/student/webinars/api";
import { formatWebinarWhen } from "@/lib/integrate/provider/student/webinars/types";
import { cn } from "@/lib/utils";

type QuickTool = {
  label: string;
  href: string;
  icon: SidebarIconName;
};

type QuickLink = {
  label: string;
  href: string;
  icon: SidebarIconName;
  badge?: "plans" | "webinars";
};

const QUICK_TOOLS: readonly QuickTool[] = [
  {
    label: "Lectures",
    href: "/student/lectures",
    icon: "lectures",
  },
  {
    label: "Webinars",
    href: "/student/webinars",
    icon: "webinars",
  },
  {
    label: "Calculator",
    href: "/student/calculator",
    icon: "calculator",
  },
  {
    label: "Advisor",
    href: "/student/adviser",
    icon: "adviser",
  },
];

const QUICK_LINKS: readonly QuickLink[] = [
  {
    label: "Membership plans",
    href: "/student/payment",
    icon: "plans",
    badge: "plans",
  },
  {
    label: "Webinars",
    href: "/student/webinars",
    icon: "webinars",
    badge: "webinars",
  },
  {
    label: "Order history",
    href: "/student/profile/orders",
    icon: "orders",
  },
  {
    label: "Payment card",
    href: "/student/profile/card",
    icon: "payment",
  },
];

function membershipProgress(start?: string | null, end?: string | null) {
  if (!start || !end) return 0;
  const from = new Date(start).getTime();
  const to = new Date(end).getTime();
  if (!Number.isFinite(from) || !Number.isFinite(to) || to <= from) return 0;
  return Math.min(1, Math.max(0, (Date.now() - from) / (to - from)));
}

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
        "dashboard-navy-btn font-sans inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] text-white",
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function StudentPortal() {
  const [loading, setLoading] = useState(true);
  const [membershipLabel, setMembershipLabel] = useState("—");
  const [membershipStatus, setMembershipStatus] = useState("Loading…");
  const [membershipExpiry, setMembershipExpiry] = useState("—");
  const [membershipStart, setMembershipStart] = useState<string | null>(null);
  const [membershipEnd, setMembershipEnd] = useState<string | null>(null);
  const [planCount, setPlanCount] = useState<number | null>(null);
  const [webinarCount, setWebinarCount] = useState<number | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [nextWebinar, setNextWebinar] = useState<WebinarSummary | null>(null);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      try {
        const [membershipRes, ordersRes, webinarsRes, plansRes] = await Promise.all([
          getCurrentMembership(),
          listOrders({ page: 1, limit: 4 }),
          listWebinars({ page: 1, limit: 8 }).catch(() => null),
          listPlans().catch(() => null),
        ]);

        if (membershipRes.membership) {
          setMembershipLabel(planLabels[membershipRes.membership.plan_type]);
          setMembershipStatus(membershipRes.membership.status);
          setMembershipExpiry(formatDate(membershipRes.membership.end_date));
          setMembershipStart(membershipRes.membership.start_date);
          setMembershipEnd(membershipRes.membership.end_date);
        } else {
          setMembershipLabel("No plan");
          setMembershipStatus("Inactive");
          setMembershipExpiry("—");
          setMembershipStart(null);
          setMembershipEnd(null);
        }

        setRecentOrders(ordersRes.items);
        setPlanCount(plansRes?.items.length ?? null);
        setWebinarCount(webinarsRes?.pagination.total ?? webinarsRes?.items.length ?? null);

        const now = Date.now();
        const upcoming = (webinarsRes?.items ?? [])
          .filter((item) => {
            const start = new Date(item.starts_at).getTime();
            if (!Number.isFinite(start) || start < now) return false;
            return item.status !== "cancelled" && item.status !== "completed";
          })
          .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
        setNextWebinar(upcoming[0] ?? null);
      } catch {
        setMembershipStatus("Could not load");
      } finally {
        setLoading(false);
      }
    }

    void loadSummary();
  }, []);

  const badges = {
    plans: planCount,
    webinars: webinarCount,
  };

  return (
    <DashboardPageLayout>
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            <NextWebinarCard webinar={nextWebinar} />
            <MembershipRingCard
              planLabel={membershipLabel}
              status={membershipStatus}
              expiry={membershipExpiry}
              progress={membershipProgress(membershipStart, membershipEnd)}
            />
            <QuickToolsCard />
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            <QuickLinksCard badges={badges} />
            <ActivityCard orders={recentOrders} />
          </div>
        </>
      )}
    </DashboardPageLayout>
  );
}

function NextWebinarCard({ webinar }: { webinar: WebinarSummary | null }) {
  return (
    <section className="dashboard-glass-card relative overflow-hidden rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
          Next webinar
        </p>
        <Link
          href="/student/webinars"
          className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-muted)] hover:text-[color:var(--dash-text)]"
        >
          View All
        </Link>
      </div>

      {webinar ? (
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
          <div className="min-w-0">
            <h2 className="font-sans truncate text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl">
              {webinar.title}
            </h2>
            <p className="text-brand-caption mt-1 text-[color:var(--dash-muted)]">
              {formatWebinarWhen(webinar.starts_at)}
              {" · "}
              {webinar.price > 0 ? formatMoney(webinar.price, webinar.currency) : "Free"}
            </p>
          </div>
          <NavyLink
            href={`/student/webinars/${encodeURIComponent(webinar.webinar_id)}`}
            className="w-full shrink-0 sm:w-auto"
          >
            {webinar.is_booked ? "Open" : "View"}
            <SidebarSvgIcon name="next" size={15} />
          </NavyLink>
        </div>
      ) : (
        <div className="mt-3">
          <h2 className="font-sans text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-lg">
            No upcoming webinars
          </h2>
          <p className="text-brand-caption mt-1 text-[color:var(--dash-muted)]">
            Check back soon — new sessions appear here first.
          </p>
        </div>
      )}
    </section>
  );
}

function MembershipRing({
  progress,
  label,
  status = "",
  caption,
}: {
  progress: number;
  label: string;
  status?: string;
  caption?: string;
}) {
  const size = 236;
  const stroke = 22;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = circumference * 0.035;
  const usable = Math.max(circumference - gap * 2, 1);
  const completedRatio = Math.min(0.98, Math.max(0.02, progress || 0.02));
  const completedLen = usable * completedRatio;
  const remainingLen = usable - completedLen;
  const isActive = (status ?? "").toLowerCase() === "active";

  return (
    <div className="membership-progress-ring relative h-[14.5rem] w-[14.5rem] sm:h-[16.5rem] sm:w-[16.5rem]">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="h-full w-full -rotate-90"
        aria-hidden
      >
        <circle
          data-seg="track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--dash-ring-left)"
          strokeWidth={stroke}
          opacity={0.28}
        />
        <circle
          data-seg="done"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--dash-ring-done)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${completedLen} ${circumference - completedLen}`}
        />
        <circle
          data-seg="left"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--dash-ring-left)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${remainingLen} ${circumference - remainingLen}`}
          strokeDashoffset={-(completedLen + gap)}
        />
      </svg>
      <div className="absolute inset-[15%] flex flex-col items-center justify-center px-1 text-center">
        <p className="flex flex-wrap items-center justify-center gap-1.5">
          <span className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl">
            {label}
          </span>
          {status ? (
            <span
              className={cn(
                "inline-flex items-center rounded-full px-1.5 py-px text-[9px] font-semibold lowercase tracking-[0.04em] text-white",
                isActive ? "bg-[#22c55e]" : "bg-[color:var(--dash-dim)]",
              )}
            >
              {status}
            </span>
          ) : null}
        </p>
        {caption ? (
          <p className="text-brand-caption mt-1.5 whitespace-nowrap leading-snug text-[color:var(--dash-muted)]">
            {caption}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function MembershipRingCard({
  planLabel,
  status,
  expiry,
  progress,
}: {
  planLabel: string;
  status: string;
  expiry: string;
  progress: number;
}) {
  const caption = expiry === "—" ? "No active membership" : `Active until ${expiry}`;

  return (
    <section className="dashboard-glass-card membership-progress-card rounded-2xl p-4 sm:p-5 md:p-6">
      <p className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-accent)] sm:text-lg">
        Membership
      </p>

      <div className="membership-progress-body mt-3">
        <div
          className="mx-auto shrink-0 md:mx-0"
          role="img"
          aria-label={`${planLabel} membership, ${Math.round(progress * 100)}% of the current term completed. ${caption}`}
        >
          <MembershipRing
            progress={progress}
            label={planLabel}
            status={status}
            caption={caption}
          />
        </div>

        <div className="membership-progress-actions">
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 md:justify-end">
            <span className="text-brand-caption inline-flex items-center gap-1.5 text-[color:var(--dash-muted)]">
              <span className="h-1.5 w-4 rounded-full bg-[color:var(--dash-ring-done)]" />
              Days Completed
            </span>
            <span className="text-brand-caption inline-flex items-center gap-1.5 text-[color:var(--dash-muted)]">
              <span className="membership-progress-swatch-left h-1.5 w-4 rounded-full bg-[color:var(--dash-ring-left)]" />
              Days Left
            </span>
          </div>
          <div className="flex justify-center gap-2 md:justify-end">
            <NavyLink href="/student/payment" className="min-h-9 px-4">
              View Plan
            </NavyLink>
            <NavyLink href="/student/profile/orders" className="min-h-9 px-4">
              Orders
            </NavyLink>
          </div>
        </div>
      </div>
    </section>
  );
}

function SkeletonBlock({ className }: { className?: string }) {
  return <span className={cn("dashboard-skeleton-block", className)} aria-hidden />;
}

function DashboardSkeleton() {
  return (
    <>
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4" aria-busy="true" aria-label="Loading dashboard">
        <section className="dashboard-glass-card relative overflow-hidden rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-3 w-24 rounded-full" />
            <SkeletonBlock className="h-3 w-14 rounded-full" />
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-6 w-48 rounded-full" />
              <SkeletonBlock className="h-4 w-40 rounded-full" />
            </div>
            <SkeletonBlock className="h-10 w-28 rounded-full" />
          </div>
        </section>

        <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5 md:p-6">
          <SkeletonBlock className="h-5 w-28 rounded-full" />
          <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <SkeletonBlock className="mx-auto h-52 w-52 rounded-full sm:h-60 sm:w-60 md:mx-0" />
            <div className="flex flex-col items-center gap-3 md:items-end">
              <SkeletonBlock className="h-3 w-40 rounded-full" />
              <div className="flex gap-2">
                <SkeletonBlock className="h-9 w-24 rounded-full" />
                <SkeletonBlock className="h-9 w-20 rounded-full" />
              </div>
            </div>
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
                <SkeletonBlock className="h-12 w-12 rounded-full" />
                <SkeletonBlock className="h-3 w-14 rounded-full" />
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
                <SkeletonBlock className="h-5 w-5 shrink-0 rounded-full" />
                <SkeletonBlock className="h-3.5 flex-1 rounded-full" />
                <SkeletonBlock className="h-7 w-7 shrink-0 rounded-full" />
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
            <SkeletonBlock className="h-10 w-full rounded-full" />
            <SkeletonBlock className="h-10 w-full rounded-full" />
          </div>
        </section>

        <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
          <div className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-5 w-32 rounded-full" />
            <SkeletonBlock className="h-4 w-16 rounded-full" />
          </div>
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 3 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-3 px-2 py-2.5">
                <div className="flex min-w-0 items-center gap-3">
                  <SkeletonBlock className="h-5 w-5 shrink-0 rounded-full" />
                  <SkeletonBlock className="h-3.5 w-28 rounded-full" />
                </div>
                <SkeletonBlock className="h-4 w-14 rounded-full" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function QuickToolsCard() {
  return (
    <section className="dashboard-glass-card rounded-2xl p-3.5 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
          Quick tools
        </h2>
        <Link
          href="/student/lectures"
          className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-muted)] hover:text-[color:var(--dash-text)]"
        >
          View all
        </Link>
      </div>

      <div className="mt-3.5 grid grid-cols-2 gap-2.5 min-[420px]:gap-3 sm:mt-4 sm:grid-cols-4">
        {QUICK_TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group flex flex-col items-center gap-2 rounded-xl px-1 py-1.5">
            <span className="dashboard-tool-icon flex h-12 w-12 items-center justify-center rounded-full text-[color:var(--dash-text)] transition-colors group-hover:text-[#DDE466]">
              <SidebarSvgIcon name={tool.icon} size={18} />
            </span>
            <span className="text-brand-caption text-center text-[color:var(--dash-muted)] transition-colors group-hover:text-[color:var(--dash-text)]">
              {tool.label}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ActivityCard({ orders }: { orders: Order[] }) {
  return (
    <section className="dashboard-glass-card rounded-2xl p-3.5 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
          Recent Activity
        </h2>
        <Link
          href="/student/profile/orders"
          className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-muted)] hover:text-[color:var(--dash-text)]"
        >
          View all
        </Link>
      </div>

      <div className="mt-3.5 space-y-1 sm:mt-4">
        {orders.length === 0 ? (
          <p className="text-brand-body py-6 text-center text-[color:var(--dash-faint)]">No orders yet.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.order_id}
              className="dashboard-row flex min-w-0 items-center justify-between gap-2 rounded-xl px-2 py-2.5 sm:gap-3 sm:px-1 sm:py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[color:var(--dash-text)]">
                  <SidebarSvgIcon
                    name={order.plan_type === "annual" ? "plans" : order.plan_type === "monthly" ? "webinars" : "payment"}
                    size={16}
                  />
                </span>
                <p className="font-sans truncate text-sm font-medium text-[color:var(--dash-text)]">
                  {planLabels[order.plan_type]} plan
                </p>
              </div>
              <span className="font-sans shrink-0 text-sm font-semibold text-[color:var(--dash-amount)]">
                +{formatMoney(order.amount, order.currency)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function QuickLinksCard({
  badges,
}: {
  badges: { plans: number | null; webinars: number | null };
}) {
  return (
    <section className="dashboard-glass-card rounded-2xl p-3.5 sm:p-5">
      <div className="space-y-0.5">
        {QUICK_LINKS.map((link) => {
          const count = link.badge ? badges[link.badge] : null;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="dashboard-row group flex items-center gap-3 rounded-xl px-2 py-2.5 transition sm:px-1 sm:py-3"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center text-[color:var(--dash-text)]">
                <SidebarSvgIcon name={link.icon} size={18} />
              </span>
              <span className="font-sans min-w-0 flex-1 truncate text-sm font-medium text-[color:var(--dash-text)]">
                {link.label}
              </span>
              {count != null ? <span className="dashboard-count-badge">{count}</span> : null}
              <SidebarSvgIcon
                name="next"
                size={16}
                className="shrink-0 text-[color:var(--dash-dim)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--dash-muted)]"
              />
            </Link>
          );
        })}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-2.5 min-[380px]:grid-cols-2">
        <NavyLink href="/student/lectures">Open lectures</NavyLink>
        <NavyLink href="/student/payment">Manage plans</NavyLink>
      </div>
    </section>
  );
}
