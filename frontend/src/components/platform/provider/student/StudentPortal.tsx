"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  BookOpen,
  Calculator,
  Calendar,
  ChevronRight,
  ClipboardList,
  CreditCard,
  Icon,
  MessageSquare,
  Star,
  User,
} from "@/components/icons";
import { DashboardPageLayout } from "@/components/platform/provider/student/dashboard/DashboardPageLayout";
import {
  getCurrentMembership,
  listOrders,
} from "@/lib/integrate/provider/student/payment/api";
import type { Order, PlanType } from "@/lib/integrate/provider/student/payment/types";
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
  icon: React.ReactNode;
};

type QuickLink = {
  label: string;
  href: string;
  icon: React.ReactNode;
};

const QUICK_TOOLS: readonly QuickTool[] = [
  {
    label: "Lectures",
    href: "/student/lectures",
    icon: <Icon icon={BookOpen} size={18} />,
  },
  {
    label: "Webinars",
    href: "/student/webinars",
    icon: <Icon icon={Calendar} size={18} />,
  },
  {
    label: "Calculator",
    href: "/student/calculator",
    icon: <Icon icon={Calculator} size={18} />,
  },
  {
    label: "Advisor",
    href: "/student/adviser",
    icon: <Icon icon={MessageSquare} size={18} />,
  },
];

const QUICK_LINKS: readonly QuickLink[] = [
  {
    label: "Membership plans",
    href: "/student/payment",
    icon: <Icon icon={Star} size={16} />,
  },
  {
    label: "Webinars",
    href: "/student/webinars",
    icon: <Icon icon={Calendar} size={16} />,
  },
  {
    label: "Order history",
    href: "/student/payment/orders",
    icon: <Icon icon={ClipboardList} size={16} />,
  },
  {
    label: "Payment card",
    href: "/student/payment/card",
    icon: <Icon icon={CreditCard} size={16} />,
  },
];

export function StudentPortal() {
  const [loading, setLoading] = useState(true);
  const [membershipLabel, setMembershipLabel] = useState("—");
  const [membershipStatus, setMembershipStatus] = useState("Loading…");
  const [membershipExpiry, setMembershipExpiry] = useState("—");
  const [planType, setPlanType] = useState<PlanType | null>(null);
  const [orderCount, setOrderCount] = useState("—");
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [nextWebinar, setNextWebinar] = useState<WebinarSummary | null>(null);

  useEffect(() => {
    async function loadSummary() {
      setLoading(true);
      try {
        const [membershipRes, ordersRes, webinarsRes] = await Promise.all([
          getCurrentMembership(),
          listOrders({ page: 1, limit: 4 }),
          listWebinars({ page: 1, limit: 5 }).catch(() => null),
        ]);

        if (membershipRes.membership) {
          setPlanType(membershipRes.membership.plan_type);
          setMembershipLabel(planLabels[membershipRes.membership.plan_type]);
          setMembershipStatus(membershipRes.membership.status);
          setMembershipExpiry(formatDate(membershipRes.membership.end_date));
        } else {
          setPlanType(null);
          setMembershipLabel("No plan");
          setMembershipStatus("Inactive");
          setMembershipExpiry("—");
        }

        setOrderCount(String(ordersRes.pagination.total));
        setRecentOrders(ordersRes.items);
        const upcoming = (webinarsRes?.items ?? [])
          .slice()
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

  return (
    <DashboardPageLayout>
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            {/* Webinar owns the primary slot; membership stays compact beside/below */}
            <NextWebinarCard webinar={nextWebinar} />
            <MembershipCompactCard
              planLabel={membershipLabel}
              planType={planType}
              status={membershipStatus}
              expiry={membershipExpiry}
            />
            <QuickToolsCard />
            <ActivityCard orders={recentOrders} />
          </div>

          <div className="flex min-w-0 flex-col gap-3 sm:gap-4">
            <QuickLinksCard orderCount={orderCount} planType={planType} />
          </div>
        </>
      )}
    </DashboardPageLayout>
  );
}

function NextWebinarCard({ webinar }: { webinar: WebinarSummary | null }) {
  return (
    <section className="dashboard-glass-card relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6">
      <div className="flex items-center justify-between gap-2">
        <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
          Next webinar
        </p>
        <Link
          href="/student/webinars"
          className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-accent)] hover:brightness-110"
        >
          View all
        </Link>
      </div>

      {webinar ? (
        <div className="mt-2 flex flex-col gap-3 sm:mt-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            {webinar.thumbnail_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={webinar.thumbnail_url}
                alt=""
                className="h-36 w-full shrink-0 rounded-xl object-cover sm:h-24 sm:w-40 md:h-28 md:w-44"
              />
            ) : null}
            <div className="min-w-0 flex-1">
              <h2 className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2rem] md:leading-tight">
                {webinar.title}
              </h2>
              <p className="text-brand-caption mt-1.5 text-[color:var(--dash-muted)] sm:mt-2">
                {formatWebinarWhen(webinar.starts_at)}
                {" · "}
                {webinar.price > 0 ? formatMoney(webinar.price, webinar.currency) : "Free"}
                {webinar.is_booked ? " · Booked" : ""}
              </p>
            </div>
          </div>
          <Link
            href={`/student/webinars/${encodeURIComponent(webinar.webinar_id)}`}
            className="font-sans inline-flex min-h-10 shrink-0 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:min-h-11 sm:px-6"
          >
            {webinar.is_booked ? "Open booking" : "Book seat"}
          </Link>
        </div>
      ) : (
        <div className="mt-2 sm:mt-3">
          <h2 className="font-sans text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl">
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

function SkeletonBlock({ className }: { className?: string }) {
  return <span className={cn("dashboard-skeleton-block", className)} aria-hidden />;
}

function DashboardSkeleton() {
  return (
    <>
      <div className="flex min-w-0 flex-col gap-3 sm:gap-4" aria-busy="true" aria-label="Loading dashboard">
        <section className="dashboard-glass-card relative overflow-hidden rounded-2xl p-4 sm:p-5 md:p-6">
          <div className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-3 w-24 rounded-full" />
            <SkeletonBlock className="h-3 w-14 rounded-full" />
          </div>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
            <SkeletonBlock className="h-36 w-full rounded-xl sm:h-24 sm:w-40 md:h-28 md:w-44" />
            <div className="min-w-0 flex-1 space-y-2">
              <SkeletonBlock className="h-8 w-48 rounded-full sm:h-9 sm:w-64" />
              <SkeletonBlock className="h-4 w-40 rounded-full" />
              <SkeletonBlock className="mt-2 h-10 w-28 rounded-full" />
            </div>
          </div>
        </section>

        <section className="dashboard-glass-card rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0 space-y-1.5">
              <SkeletonBlock className="h-2.5 w-20 rounded-full" />
              <SkeletonBlock className="h-4 w-32 rounded-full" />
            </div>
            <SkeletonBlock className="h-9 w-20 rounded-full" />
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
          <div className="flex items-center justify-between gap-2">
            <SkeletonBlock className="h-5 w-32 rounded-full" />
            <SkeletonBlock className="h-4 w-16 rounded-full" />
          </div>
          <div className="mt-4 space-y-2.5">
            {Array.from({ length: 3 }, (_, index) => (
              <div
                key={index}
                className="flex items-center justify-between gap-3 rounded-xl px-2.5 py-2.5 sm:px-3.5 sm:py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <SkeletonBlock className="h-9 w-9 shrink-0 rounded-full" />
                  <div className="min-w-0 space-y-2">
                    <SkeletonBlock className="h-3.5 w-28 rounded-full" />
                    <SkeletonBlock className="h-3 w-20 rounded-full" />
                  </div>
                </div>
                <SkeletonBlock className="h-4 w-14 rounded-full" />
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

function MembershipCompactCard({
  planLabel,
  planType,
  status,
  expiry,
}: {
  planLabel: string;
  planType: PlanType | null;
  status: string;
  expiry: string;
}) {
  const canUpgrade = planType !== "annual";
  return (
    <section className="dashboard-glass-card rounded-2xl px-3.5 py-3 sm:px-4 sm:py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
            Membership
          </p>
          <div className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <span className="font-sans truncate text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-lg">
              {planLabel}
            </span>
            <span className="text-brand-caption font-medium text-[color:var(--dash-faint)]">{status}</span>
          </div>
          <p className="text-brand-caption mt-0.5 text-[color:var(--dash-muted)]">
            Active until {expiry}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          {canUpgrade ? (
            <Link
              href="/student/payment"
              className="font-sans inline-flex min-h-9 items-center justify-center rounded-full bg-[#DDE466] px-3.5 text-xs font-medium text-[#152744] transition hover:brightness-105 sm:px-4 sm:text-sm"
            >
              Upgrade
            </Link>
          ) : (
            <Link
              href="/student/payment"
              className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center justify-center rounded-full px-3.5 text-xs font-medium text-[color:var(--dash-text)] transition sm:px-4 sm:text-sm"
            >
              View plan
            </Link>
          )}
          <Link
            href="/student/payment/orders"
            className="dashboard-pill-soft font-sans inline-flex min-h-9 items-center justify-center rounded-full px-3.5 text-xs font-medium text-[color:var(--dash-text)] transition sm:px-4 sm:text-sm"
          >
            Orders
          </Link>
        </div>
      </div>
    </section>
  );
}

function QuickToolsCard() {
  return (
    <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-accent)] sm:text-lg">
          Quick tools
        </h2>
        <Link href="/student/lectures" className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-accent)] hover:brightness-110">
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

function ActivityCard({ orders }: { orders: Order[] }) {
  return (
    <section className="dashboard-glass-card rounded-2xl p-4 sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-sans text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
          Recent activity
        </h2>
        <Link
          href="/student/payment/orders"
          className="text-brand-caption shrink-0 font-medium text-[color:var(--dash-accent)] hover:brightness-110"
        >
          View all
        </Link>
      </div>

      <div className="mt-4 space-y-2.5">
        {orders.length === 0 ? (
          <p className="text-brand-body py-6 text-center text-[color:var(--dash-faint)]">No orders yet.</p>
        ) : (
          orders.map((order) => (
            <div
              key={order.order_id}
              className="dashboard-row flex items-center justify-between gap-2 rounded-xl px-2.5 py-2.5 sm:gap-3 sm:px-3.5 sm:py-3"
            >
              <div className="flex min-w-0 items-center gap-2.5 sm:gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DDE466]/15 text-[color:var(--dash-accent)]">
                  <Icon icon={Star} size={16} strokeWidth={1.9} />
                </span>
                <div className="min-w-0">
                  <p className="font-sans truncate text-sm font-medium text-[color:var(--dash-text)]">
                    {planLabels[order.plan_type]} plan
                  </p>
                  <p className="text-brand-caption truncate text-[color:var(--dash-faint)]">{formatDate(order.created_at)}</p>
                </div>
              </div>
              <span className="font-sans shrink-0 text-sm font-semibold text-[color:var(--dash-accent)]">
                {formatMoney(order.amount, order.currency)}
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

function QuickLinksCard({
  orderCount,
  planType,
}: {
  orderCount: string;
  planType: PlanType | null;
}) {
  const canUpgrade = planType !== "annual";
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
            {link.label === "Order history" && orderCount !== "—" ? (
              <span className="text-brand-caption rounded-full bg-[color:var(--dash-soft)] px-2 py-0.5 font-medium text-[color:var(--dash-faint)]">
                {orderCount}
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
        {canUpgrade ? (
          <Link
            href="/student/payment"
            className="font-sans inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-4 text-sm font-medium text-[#152744] transition hover:brightness-105"
          >
            Upgrade plan
          </Link>
        ) : (
          <Link
            href="/student/payment"
            className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium text-[color:var(--dash-text)] transition"
          >
            View membership
          </Link>
        )}
        <Link
          href="/student/payment/card"
          className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium text-[color:var(--dash-text)] transition"
        >
          Manage card
        </Link>
      </div>
    </section>
  );
}
