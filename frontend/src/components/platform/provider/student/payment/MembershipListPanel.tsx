"use client";

import Link from "next/link";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import {
  PLAN_META,
  daysUntil,
  isCurrentPlan,
  monthlyEquivalent,
  savingsVersusMonthly,
  sortedPlans,
} from "@/components/platform/provider/student/payment/membershipPlans";
import type { Membership, PaymentCard, Plan, PlanType } from "@/lib/integrate/provider/student/payment/types";
import { formatDate, formatMoney, planLabels } from "@/lib/integrate/provider/student/payment/types";
import { cn } from "@/lib/utils";

type MembershipListPanelProps = {
  plans: Plan[];
  membership: Membership | null;
  card: PaymentCard | null;
  activePlanType: PlanType | null;
  onSelect: (planType: PlanType) => void;
};

export function MembershipListPanel({
  plans,
  membership,
  card,
  activePlanType,
  onSelect,
}: MembershipListPanelProps) {
  const ordered = sortedPlans(plans);
  const monthly = ordered.find((plan) => plan.plan_type === "monthly") ?? null;

  return (
    <div className="grid min-w-0 gap-4 sm:gap-5">
      <MembershipStatusBar membership={membership} card={card} />

      {ordered.length === 0 ? (
        <div className="dashboard-glass-card flex flex-col items-center rounded-2xl px-5 py-12 text-center sm:py-14">
          <span className="dashboard-tool-icon flex h-14 w-14 items-center justify-center rounded-full text-[color:var(--dash-text)]">
            <SidebarSvgIcon name="plans" size={22} strokeWidth={1.85} />
          </span>
          <p className="font-sans mt-4 text-base font-semibold text-[color:var(--dash-text)] sm:text-lg">
            No membership plans yet
          </p>
        </div>
      ) : (
        <div className="grid min-w-0 items-stretch gap-3 sm:gap-4 lg:grid-cols-3 lg:items-end">
          {ordered.map((plan) => (
            <PlanCard
              key={plan.plan_type}
              plan={plan}
              membership={membership}
              monthly={monthly}
              selected={activePlanType === plan.plan_type}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function MembershipStatusBar({
  membership,
  card,
}: {
  membership: Membership | null;
  card: PaymentCard | null;
}) {
  const remaining = daysUntil(membership?.end_date);

  return (
    <section className="dashboard-glass-card flex min-w-0 flex-col gap-3 rounded-2xl px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
      <div className="min-w-0">
        {membership ? (
          <p className="font-sans truncate text-sm font-semibold text-[color:var(--dash-text)] sm:text-base">
            {planLabels[membership.plan_type]}
            <span className="font-medium text-[color:var(--dash-muted)]">
              {" "}
              ·{" "}
              {remaining == null
                ? `until ${formatDate(membership.end_date)}`
                : remaining === 0
                  ? "ended"
                  : `${remaining}d left`}
            </span>
          </p>
        ) : (
          <p className="font-sans text-sm font-semibold text-[color:var(--dash-text)] sm:text-base">
            Choose a package
          </p>
        )}
      </div>

      <Link
        href="/student/profile/card"
        className="text-brand-caption inline-flex min-h-10 shrink-0 cursor-pointer items-center gap-1.5 font-semibold text-[color:var(--dash-text)]"
      >
        <SidebarSvgIcon name="payment" size={14} strokeWidth={1.9} />
        {card ? card.card_number_masked : "Add card"}
      </Link>
    </section>
  );
}

function PlanCard({
  plan,
  membership,
  monthly,
  selected,
  onSelect,
}: {
  plan: Plan;
  membership: Membership | null;
  monthly: Plan | null;
  selected: boolean;
  onSelect: (planType: PlanType) => void;
}) {
  const meta = PLAN_META[plan.plan_type];
  const current = isCurrentPlan(plan, membership);
  const featured = Boolean(meta.favourite) && !current;
  const savings = savingsVersusMonthly(plan, monthly);
  const perMonth = monthlyEquivalent(plan);
  const priceLabel = formatMoney(plan.price, plan.currency || "USD");
  const badge = current ? "Yours" : meta.badge;

  return (
    <article
      onClick={() => {
        if (!current) onSelect(plan.plan_type);
      }}
      className={cn(
        "membership-plan-card relative flex h-full min-w-0 flex-col overflow-hidden rounded-[1.35rem] p-4 sm:p-5",
        featured && "membership-plan-card--favourite lg:min-h-[22.5rem] lg:p-6",
        current && "membership-plan-card--current",
        selected && "ring-2 ring-[color:var(--dash-navy)]/25",
        !current && "cursor-pointer",
      )}
    >
      <div className="flex min-h-7 items-center justify-between gap-2">
        {badge ? (
          <span
            className={cn(
              "membership-plan-badge",
              current
                ? "membership-plan-badge--current"
                : featured
                  ? "membership-plan-badge--favourite"
                  : "membership-plan-badge--value",
            )}
          >
            {badge}
          </span>
        ) : (
          <span className="membership-plan-badge membership-plan-badge--spacer" aria-hidden>
            &nbsp;
          </span>
        )}
        {savings ? (
          <span className="text-brand-caption font-semibold text-[color:var(--dash-amount)]">
            Save {savings.percent}%
          </span>
        ) : null}
      </div>

      <h3 className="font-sans mt-4 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)]">
        {planLabels[plan.plan_type]}
      </h3>

      <p className="mt-3 flex flex-wrap items-end gap-x-2 gap-y-1">
        <span className="font-sans text-[2rem] font-bold leading-none tracking-[0.01em] tabular-nums text-[color:var(--dash-text)]">
          {priceLabel}
        </span>
        <span className="text-brand-caption pb-0.5 font-medium text-[color:var(--dash-faint)]">
          {perMonth ? `${formatMoney(perMonth, plan.currency || "USD")}/mo` : meta.period}
        </span>
      </p>

      <ul className="mt-5 flex flex-1 flex-col gap-2.5">
        {meta.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5">
            <span className="membership-plan-check" aria-hidden>
              <SidebarSvgIcon name="check" size={11} strokeWidth={2.6} />
            </span>
            <span className="text-sm text-[color:var(--dash-muted)]">{feature}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        {current ? (
          <span className="dashboard-pill-soft font-sans inline-flex min-h-11 w-full items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)]">
            Current plan
          </span>
        ) : (
          <button
            type="button"
            onClick={() => onSelect(plan.plan_type)}
            className={cn(
              "font-sans inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-full px-5 text-sm font-semibold tracking-[0.01em] transition",
              featured
                ? "membership-plan-cta membership-plan-cta--favourite"
                : "membership-plan-cta",
            )}
          >
            {membership ? "Switch" : "Get this plan"}
          </button>
        )}
      </div>
    </article>
  );
}
