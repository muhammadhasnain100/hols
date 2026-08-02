"use client";

import { cn } from "@/lib/utils";
import { formatMoney } from "@/lib/integrate/provider/student/payment/types";

type AffiliateEarningsMeterProps = {
  totalEarned: number;
  nextMilestone: number;
  currency?: string;
  pendingPayout?: number;
  orderCount?: number;
  /** Compact card for the dashboard; full for the earnings page hero. */
  variant?: "card" | "hero";
  className?: string;
  loading?: boolean;
};

export function AffiliateEarningsMeter({
  totalEarned,
  nextMilestone,
  currency = "USD",
  pendingPayout,
  orderCount,
  variant = "card",
  className,
  loading = false,
}: AffiliateEarningsMeterProps) {
  const milestone = Math.max(nextMilestone || 100, 1);
  const progress = Math.min(1, Math.max(0, totalEarned / milestone));
  const percentLabel = `${Math.round(progress * 100)}%`;
  const remaining = Math.max(milestone - totalEarned, 0);

  return (
    <section
      className={cn(
        "dashboard-glass-card relative overflow-hidden rounded-2xl",
        variant === "hero" ? "p-3.5 sm:p-5 md:p-6" : "p-3.5 sm:p-5",
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
            {variant === "hero" ? "Total earned" : "Earnings"}
          </p>
          <p
            className={cn(
              "font-sans mt-1 font-bold tracking-[0.01em] text-[color:var(--dash-text)]",
              variant === "hero"
                ? "text-xl sm:text-2xl md:text-[2.25rem] md:leading-none"
                : "text-xl sm:text-2xl",
            )}
          >
            {loading ? "—" : formatMoney(totalEarned, currency)}
          </p>
          <p className="text-brand-body mt-1.5 text-sm text-[color:var(--dash-muted)]">
            {loading
              ? "Loading commission total…"
              : orderCount != null
                ? `${orderCount} commission${orderCount === 1 ? "" : "s"} · ${formatMoney(pendingPayout ?? totalEarned, currency)} pending payout`
                : `${formatMoney(pendingPayout ?? totalEarned, currency)} pending payout`}
          </p>
        </div>
        <span className="text-brand-caption shrink-0 rounded-full bg-[#DDE466]/15 px-2.5 py-1 font-semibold text-[#DDE466]">
          {loading ? "—" : percentLabel}
        </span>
      </div>

      <div className="mt-4">
        <div
          className="h-2 overflow-hidden rounded-full bg-[color:var(--dash-soft)]"
          role="meter"
          aria-label="Earnings toward next milestone"
          aria-valuemin={0}
          aria-valuemax={milestone}
          aria-valuenow={Math.min(totalEarned, milestone)}
        >
          <div
            className="h-full rounded-full bg-[#DDE466] transition-[width] duration-700 ease-out"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-brand-caption text-[color:var(--dash-faint)]">
          <span>{loading ? "—" : formatMoney(0, currency)}</span>
          <span>
            {loading
              ? "—"
              : remaining > 0
                ? `${formatMoney(remaining, currency)} to ${formatMoney(milestone, currency)}`
                : `Milestone ${formatMoney(milestone, currency)} reached`}
          </span>
        </div>
      </div>
    </section>
  );
}
