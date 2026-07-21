"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalCardButtonDisplay, usePortalCardButtonHover } from "@/components/platform/provider/PortalCardButton";
import {
  portalCardBodyClass,
  portalCardTitleClass,
  portalSectionDescClass,
  portalSectionEyebrowClass,
  portalSectionTitleClass,
} from "@/components/platform/provider/portal-styles";
import { PortalStatCard } from "@/components/platform/provider/PortalStatCard";
import { DashboardPageLayout } from "@/components/platform/provider/student/dashboard/DashboardPageLayout";
import { ApiRequestError } from "@/lib/integrate/client";
import { getStoredUser } from "@/lib/integrate/auth/storage";
import {
  getCard,
  getCurrentMembership,
  listOrders,
} from "@/lib/integrate/provider/student/payment/api";
import {
  formatDate,
  planLabels,
} from "@/lib/integrate/provider/student/payment/types";
import { cn } from "@/lib/utils";

type QuickAction = {
  title: string;
  description: string;
  href: string;
  cta: string;
  variant: "primary" | "secondary";
};

const BILLING_ACTIONS: readonly QuickAction[] = [
  {
    title: "Membership",
    description: "View plans and purchase access.",
    href: "/student/payment",
    cta: "Open membership",
    variant: "primary",
  },
  {
    title: "Orders",
    description: "Review purchase history.",
    href: "/student/payment/orders",
    cta: "View orders",
    variant: "secondary",
  },
  {
    title: "Payment card",
    description: "Add or update your saved card.",
    href: "/student/payment/card",
    cta: "Manage card",
    variant: "secondary",
  },
];

const LEARNING_ACTIONS: readonly QuickAction[] = [
  {
    title: "Lectures",
    description: "Browse courses and lessons.",
    href: "/student/lectures",
    cta: "Open lectures",
    variant: "primary",
  },
  {
    title: "Calculator",
    description: "Peptide dosing helper.",
    href: "/student/calculator",
    cta: "Open calculator",
    variant: "secondary",
  },
  {
    title: "Peptide Adviser",
    description: "Patient intake and peptide recommendations.",
    href: "/student/adviser",
    cta: "Open adviser",
    variant: "secondary",
  },
  {
    title: "Profile",
    description: "Name, address, and photo.",
    href: "/student/profile",
    cta: "Open profile",
    variant: "secondary",
  },
];

export function StudentPortal() {
  const user = getStoredUser();
  const [membershipLabel, setMembershipLabel] = useState("—");
  const [membershipHint, setMembershipHint] = useState("Loading…");
  const [cardLabel, setCardLabel] = useState("—");
  const [orderCount, setOrderCount] = useState("—");

  useEffect(() => {
    async function loadSummary() {
      try {
        const [membershipRes, ordersRes] = await Promise.all([
          getCurrentMembership(),
          listOrders({ page: 1, limit: 1 }),
        ]);

        if (membershipRes.membership) {
          setMembershipLabel(planLabels[membershipRes.membership.plan_type]);
          setMembershipHint(
            `${membershipRes.membership.status} · until ${formatDate(membershipRes.membership.end_date)}`,
          );
        } else {
          setMembershipLabel("None");
          setMembershipHint("No active membership");
        }

        setOrderCount(String(ordersRes.pagination.total));

        try {
          const cardRes = await getCard();
          setCardLabel(cardRes.card.card_number_masked);
        } catch (err) {
          if (err instanceof ApiRequestError && err.status === 404) {
            setCardLabel("Not added");
          }
        }
      } catch {
        setMembershipHint("Could not load membership");
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
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <PortalStatCard label="Membership" value={membershipLabel} hint={membershipHint} />
        <PortalStatCard label="Saved card" value={cardLabel} hint="Used for plan purchases" />
        <PortalStatCard label="Orders" value={orderCount} hint="Total purchases" />
      </div>

      <DashboardSection
        eyebrow="Billing"
        title="Quick actions"
        description="Manage membership, orders, and payment details."
        actions={BILLING_ACTIONS}
      />

      <DashboardSection
        eyebrow="Learning"
        title="Continue learning"
        description="Access lectures, tools, and your profile."
        actions={LEARNING_ACTIONS}
      />
    </DashboardPageLayout>
  );
}

function DashboardSection({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions: readonly QuickAction[];
}) {
  return (
    <section>
      <p className={portalSectionEyebrowClass}>{eyebrow}</p>
      <h2 className={portalSectionTitleClass}>{title}</h2>
      <p className={portalSectionDescClass}>{description}</p>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        {actions.map((action) => (
          <DashboardActionCard key={action.href} action={action} />
        ))}
      </div>
    </section>
  );
}

function DashboardActionCard({ action }: { action: QuickAction }) {
  const { onMouseEnter, onMouseLeave, containerRef, fillRef, labelRef } =
    usePortalCardButtonHover(action.variant);

  return (
    <Link
      href={action.href}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        "group flex h-full flex-col rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(21,39,68,0.06)] transition",
        "hover:shadow-[0_4px_14px_rgba(21,39,68,0.08)]",
      )}
    >
      <h3 className={portalCardTitleClass}>{action.title}</h3>
      <p className={portalCardBodyClass}>{action.description}</p>
      <PortalCardButtonDisplay
        variant={action.variant}
        className="mt-4"
        containerRef={containerRef}
        fillRef={fillRef}
        labelRef={labelRef}
      >
        {action.cta}
      </PortalCardButtonDisplay>
    </Link>
  );
}
