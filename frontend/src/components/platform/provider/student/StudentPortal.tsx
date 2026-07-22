"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DashboardPageLayout } from "@/components/platform/provider/student/dashboard/DashboardPageLayout";
import { getStoredUser } from "@/lib/integrate/auth/storage";
import {
  getCurrentMembership,
  listOrders,
} from "@/lib/integrate/provider/student/payment/api";
import type { Order } from "@/lib/integrate/provider/student/payment/types";
import {
  formatDate,
  formatMoney,
  planLabels,
} from "@/lib/integrate/provider/student/payment/types";
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
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    ),
  },
  {
    label: "Calculator",
    href: "/student/calculator",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M8 6h8M8 10h8M8 14h2M12 14h2M16 14h2M8 18h2M12 18h2M16 18h2" />
      </svg>
    ),
  },
  {
    label: "Adviser",
    href: "/student/adviser",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        <path d="M8 9h8M8 13h5" />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/student/profile",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.7-3.3 4.3-5 8-5s6.3 1.7 8 5" />
      </svg>
    ),
  },
];

const QUICK_LINKS: readonly QuickLink[] = [
  {
    label: "Membership plans",
    href: "/student/payment",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
      </svg>
    ),
  },
  {
    label: "Order history",
    href: "/student/payment/orders",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" />
        <path d="M9 12h6M9 16h4" />
      </svg>
    ),
  },
  {
    label: "Payment card",
    href: "/student/payment/card",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <path d="M2 10h20" />
      </svg>
    ),
  },
  {
    label: "Account profile",
    href: "/student/profile",
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 20c1.7-3.3 4.3-5 8-5s6.3 1.7 8 5" />
      </svg>
    ),
  },
];

export function StudentPortal() {
  const user = getStoredUser();
  const [membershipLabel, setMembershipLabel] = useState("—");
  const [membershipStatus, setMembershipStatus] = useState("Loading…");
  const [membershipExpiry, setMembershipExpiry] = useState("—");
  const [orderCount, setOrderCount] = useState("—");
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);

  useEffect(() => {
    async function loadSummary() {
      try {
        const [membershipRes, ordersRes] = await Promise.all([
          getCurrentMembership(),
          listOrders({ page: 1, limit: 4 }),
        ]);

        if (membershipRes.membership) {
          setMembershipLabel(planLabels[membershipRes.membership.plan_type]);
          setMembershipStatus(membershipRes.membership.status);
          setMembershipExpiry(formatDate(membershipRes.membership.end_date));
        } else {
          setMembershipLabel("No plan");
          setMembershipStatus("Inactive");
          setMembershipExpiry("—");
        }

        setOrderCount(String(ordersRes.pagination.total));
        setRecentOrders(ordersRes.items);
      } catch {
        setMembershipStatus("Could not load");
      }
    }

    void loadSummary();
  }, []);

  const firstName =
    typeof user?.profile?.first_name === "string" ? user.profile.first_name : "";
  const lastName = typeof user?.profile?.last_name === "string" ? user.profile.last_name : "";
  const displayName =
    firstName && lastName ? `${firstName} ${lastName}` : firstName || "Student";

  return (
    <DashboardPageLayout displayName={displayName}>
      <div className="flex flex-col gap-4">
        <MembershipHeroCard planLabel={membershipLabel} status={membershipStatus} expiry={membershipExpiry} />
        <QuickToolsCard />
        <ActivityCard orders={recentOrders} />
      </div>

      <div className="flex flex-col gap-4">
        <QuickLinksCard orderCount={orderCount} />
      </div>
    </DashboardPageLayout>
  );
}

function MembershipHeroCard({
  planLabel,
  status,
  expiry,
}: {
  planLabel: string;
  status: string;
  expiry: string;
}) {
  return (
    <section className="dashboard-hero relative overflow-hidden rounded-2xl p-5 md:p-6">
      <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
        Membership status
      </p>
      <div className="mt-2 flex items-end gap-2">
        <span className="font-sans text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] md:text-[2.5rem] md:leading-none">
          {planLabel}
        </span>
        <span className="mb-1 text-brand-caption font-medium text-[color:var(--dash-faint)]">{status}</span>
      </div>
      <p className="text-brand-body mt-2 text-[color:var(--dash-muted)]">Active until {expiry}</p>

      <div className="mt-5 flex flex-wrap gap-2.5">
        <HeroPill href="/student/payment" variant="solid">
          Upgrade
        </HeroPill>
        <HeroPill href="/student/payment/orders" variant="soft">
          Orders
        </HeroPill>
        <HeroPill href="/student/payment/card" variant="soft">
          Card
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
        "font-sans inline-flex min-h-10 items-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] transition",
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
    <section className="dashboard-surface rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)]">Quick tools</h2>
        <Link href="/student/lectures" className="text-brand-caption font-medium text-[color:var(--dash-accent)] hover:brightness-110">
          View all
        </Link>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2 sm:gap-3">
        {QUICK_TOOLS.map((tool) => (
          <Link key={tool.href} href={tool.href} className="group flex flex-col items-center gap-2">
            <span className="dashboard-tool-icon flex h-12 w-12 items-center justify-center rounded-full text-[color:var(--dash-text)] transition group-hover:text-[#152744]">
              {tool.icon}
            </span>
            <span className="text-brand-caption text-center text-[color:var(--dash-muted)]">{tool.label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function ActivityCard({ orders }: { orders: Order[] }) {
  return (
    <section className="dashboard-surface rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-sans text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)]">Recent activity</h2>
        <Link
          href="/student/payment/orders"
          className="text-brand-caption font-medium text-[color:var(--dash-accent)] hover:brightness-110"
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
              className="dashboard-row flex items-center justify-between gap-3 rounded-xl px-3.5 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#DDE466]/15 text-[color:var(--dash-accent)]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden>
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.77 5.82 22 7 14.14l-5-4.87 6.91-1.01L12 2z" />
                  </svg>
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

function QuickLinksCard({ orderCount }: { orderCount: string }) {
  return (
    <section className="dashboard-surface rounded-2xl p-5">
      <div className="space-y-1">
        {QUICK_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="dashboard-row group flex items-center gap-3 rounded-xl px-3 py-3 transition"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)] transition group-hover:bg-[#DDE466]/15 group-hover:text-[color:var(--dash-accent)]">
              {link.icon}
            </span>
            <span className="font-sans flex-1 text-sm font-medium text-[color:var(--dash-muted)]">{link.label}</span>
            {link.label === "Order history" && orderCount !== "—" ? (
              <span className="text-brand-caption rounded-full bg-[color:var(--dash-soft)] px-2 py-0.5 font-medium text-[color:var(--dash-faint)]">
                {orderCount}
              </span>
            ) : null}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="shrink-0 text-[color:var(--dash-dim)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--dash-muted)]"
              aria-hidden
            >
              <path d="M9 18l6-6-6-6" />
            </svg>
          </Link>
        ))}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        <Link
          href="/student/payment"
          className="font-sans inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-4 text-sm font-medium text-[#152744] transition hover:brightness-105"
        >
          Upgrade plan
        </Link>
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
