"use client";

import { useEffect, useState } from "react";
import { Icon, Menu } from "@/components/icons";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { DataField, DirectoryMobileRow, StatusBadge } from "@/components/platform/provider/admin/shared";
import { affiliateNav } from "@/components/platform/provider/affiliate/affiliateNav";
import { AffiliateWalletCards } from "@/components/platform/provider/affiliate/AffiliateWalletCards";
import { RequestPayoutDialog } from "@/components/platform/provider/affiliate/RequestPayoutDialog";
import { SidebarSvgIcon } from "@/components/platform/provider/sidebar-icons";
import { DashRightDrawer } from "@/components/platform/provider/student/DashRightDrawer";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getAffiliatePayouts,
  requestAffiliatePayout,
  type AffiliatePayoutItem,
  type AffiliatePayoutOverview,
} from "@/lib/integrate/provider/affiliate/payout";
import { formatDate, formatMoney } from "@/lib/integrate/provider/student/payment/types";
import { cn } from "@/lib/utils";

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

function statusLabel(status?: string) {
  const value = (status || "pending").trim() || "pending";
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function statusTone(status?: string): "accent" | "warn" | "muted" | "neutral" {
  const value = (status || "pending").toLowerCase();
  if (value === "paid" || value === "completed") return "accent";
  if (value === "rejected" || value === "failed") return "warn";
  if (value === "pending") return "muted";
  return "neutral";
}

export function AffiliatePayoutPage() {
  const [overview, setOverview] = useState<AffiliatePayoutOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const wallet = overview?.wallet;
  const currency = wallet?.currency ?? "USD";
  const available = wallet?.available ?? 0;
  const lockDays = overview?.payout_lock_days ?? 7;
  const payouts = overview?.payouts ?? [];
  const busy = loading && !overview;
  const selected = payouts.find((item) => item.payout_id === selectedId) ?? null;

  async function loadPayouts(signal?: AbortSignal) {
    const data = await getAffiliatePayouts(signal);
    if (signal?.aborted) return;
    setOverview(data);
  }

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    void loadPayouts(controller.signal)
      .catch((err) => {
        if (controller.signal.aborted) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof ApiRequestError ? err.message : "Failed to load payouts.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, []);

  function openDialog() {
    setDialogError(null);
    setSuccess(null);
    setDialogOpen(true);
  }

  async function handlePayout(amount?: number) {
    setSubmitting(true);
    setDialogError(null);
    setError(null);
    setSuccess(null);
    try {
      const result = await requestAffiliatePayout(amount);
      setOverview((current) => ({
        wallet: result.wallet,
        payout_lock_days: current?.payout_lock_days ?? lockDays,
        payout_lock_seconds: current?.payout_lock_seconds,
        student_count: current?.student_count ?? 0,
        payouts: [result.payout, ...(current?.payouts ?? [])],
      }));
      setDialogOpen(false);
      setSuccess(
        `Payout requested for ${formatMoney(result.payout.amount, result.payout.currency)}. Waiting for admin review.`,
      );
    } catch (err) {
      setDialogError(err instanceof ApiRequestError ? err.message : "Could not send payout request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <PortalShell
      role="affiliate"
      title="Payout"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={affiliateNav}
    >
      <div className="dashboard-screen lectures-page min-w-0 overflow-x-hidden">
        <header className="mb-4 flex min-h-10 min-w-0 items-center gap-2 sm:mb-5 sm:min-h-12 sm:gap-3 md:gap-4">
          <button
            type="button"
            aria-label="Open sidebar"
            onClick={openSidebar}
            className="dashboard-icon-btn flex h-10 w-10 shrink-0 items-center justify-center rounded-full lg:hidden sm:h-12 sm:w-12"
          >
            <Icon icon={Menu} size={18} />
          </button>
          <h1 className="font-sans min-w-0 truncate text-lg font-bold leading-none tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl">
            Payout
          </h1>
          <div className="min-w-0 flex-1" aria-hidden />
          <button
            type="button"
            onClick={openDialog}
            className="dashboard-navy-btn font-sans inline-flex min-h-11 shrink-0 items-center justify-center gap-1.5 rounded-full px-3.5 text-sm font-medium tracking-[0.01em] text-white sm:min-h-10 sm:px-4"
          >
            <SidebarSvgIcon name="plus" size={15} strokeWidth={2.2} />
            <span className="hidden min-[420px]:inline">Request payout</span>
          </button>
        </header>

        <RequestPayoutDialog
          open={dialogOpen}
          available={available}
          currency={currency}
          lockDays={lockDays}
          isSubmitting={submitting}
          error={dialogError}
          onClose={() => {
            if (!submitting) setDialogOpen(false);
          }}
          onSubmit={(amount) => void handlePayout(amount)}
        />

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          <AffiliateWalletCards
            wallet={wallet}
            currency={currency}
            lockDays={lockDays}
            lockSeconds={overview?.payout_lock_seconds}
            studentCount={overview?.student_count ?? 0}
            loading={busy}
            order={["pending", "payout", "available", "lock"]}
          />

          <section className="dashboard-glass-card min-w-0 overflow-hidden rounded-2xl">
            <div className="flex flex-wrap items-end justify-between gap-2 px-4 py-4 sm:px-5">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                  History
                </p>
                <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg">
                  Payouts
                </h2>
              </div>
              <p className="text-brand-caption text-[color:var(--dash-faint)]">{payouts.length} total</p>
            </div>

            {busy ? (
              <div className="space-y-2 px-4 pb-5 sm:px-5" aria-busy="true" aria-label="Loading payouts">
                {Array.from({ length: 3 }, (_, i) => (
                  <span key={i} className="dashboard-skeleton-block block h-16 w-full rounded-xl" />
                ))}
              </div>
            ) : payouts.length === 0 ? (
              <div className="flex flex-col items-center px-5 py-12 text-center sm:py-14">
                <span className="dashboard-tool-icon flex h-14 w-14 items-center justify-center rounded-full text-[color:var(--dash-text)]">
                  <SidebarSvgIcon name="payment" size={22} strokeWidth={1.85} />
                </span>
                <p className="font-sans mt-4 text-base font-semibold text-[color:var(--dash-text)] sm:text-lg">
                  No payouts yet
                </p>
                <p className="text-brand-body mt-1.5 max-w-sm text-[color:var(--dash-muted)]">
                  Request a payout from available balance. An admin will accept or reject it.
                </p>
              </div>
            ) : (
              <>
                <ul className="grid gap-2.5 px-3.5 pb-4 sm:gap-3 sm:px-5 md:hidden">
                  {payouts.map((item) => (
                    <li key={item.payout_id} className="min-w-0">
                      <DirectoryMobileRow
                        title={formatMoney(item.amount, item.currency || currency)}
                        subtitle={formatDate(item.created_at ?? undefined)}
                        active={selectedId === item.payout_id}
                        ariaLabel={`Open payout ${formatMoney(item.amount, item.currency || currency)}`}
                        onClick={() => setSelectedId(item.payout_id)}
                        stats={[
                          { label: "Status", value: statusLabel(item.status) },
                          { label: "Reference", value: item.payout_id.slice(-8) },
                        ]}
                      />
                    </li>
                  ))}
                </ul>
                <div className="hidden min-w-0 overflow-x-auto md:block">
                  <table className="w-full min-w-[32rem] border-separate border-spacing-0 text-left">
                    <thead>
                      <tr className="bg-[color:var(--dash-soft)] text-brand-caption font-semibold uppercase tracking-[0.06em] text-[color:var(--dash-faint)]">
                        <th scope="col" className="px-4 py-3 font-semibold sm:px-5">
                          Date
                        </th>
                        <th scope="col" className="px-3 py-3 font-semibold">
                          Status
                        </th>
                        <th scope="col" className="px-3 py-3 font-semibold">
                          Reference
                        </th>
                        <th scope="col" className="px-3 py-3 text-right font-semibold">
                          Amount
                        </th>
                        <th scope="col" className="px-4 py-3 text-right font-semibold sm:px-5">
                          <span className="sr-only">Open</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((item) => {
                        const active = selectedId === item.payout_id;
                        return (
                          <tr
                            key={item.payout_id}
                            tabIndex={0}
                            role="button"
                            aria-label={`Open payout ${formatMoney(item.amount, item.currency || currency)}`}
                            className={cn(
                              "cursor-pointer outline-none transition focus-visible:bg-[color:var(--dash-soft)]",
                              active ? "bg-[color:var(--dash-soft)]" : "hover:bg-[color:var(--dash-soft)]",
                            )}
                            onClick={() => setSelectedId(item.payout_id)}
                            onKeyDown={(event) => {
                              if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                setSelectedId(item.payout_id);
                              }
                            }}
                          >
                            <td className="border-t border-[color:var(--dash-surface-border)] px-4 py-3 sm:px-5">
                              <span className="font-sans text-sm font-semibold text-[color:var(--dash-text)]">
                                {formatDate(item.created_at ?? undefined)}
                              </span>
                            </td>
                            <td className="border-t border-[color:var(--dash-surface-border)] px-3 py-3">
                              <span className="text-brand-caption inline-flex rounded-full bg-[color:var(--dash-soft)] px-2.5 py-1 font-semibold text-[color:var(--dash-text)]">
                                {statusLabel(item.status)}
                              </span>
                            </td>
                            <td className="border-t border-[color:var(--dash-surface-border)] px-3 py-3">
                              <span className="font-mono text-brand-caption block max-w-[12rem] truncate text-[color:var(--dash-muted)]">
                                {item.payout_id}
                              </span>
                            </td>
                            <td className="border-t border-[color:var(--dash-surface-border)] px-3 py-3 text-right">
                              <span className="font-sans text-sm font-semibold tabular-nums text-[color:var(--dash-text)]">
                                {formatMoney(item.amount, item.currency || currency)}
                              </span>
                            </td>
                            <td className="border-t border-[color:var(--dash-surface-border)] px-4 py-3 text-right sm:px-5">
                              <span className="inline-flex items-center justify-end gap-1 text-brand-caption font-medium text-[color:var(--dash-accent)]">
                                View
                                <SidebarSvgIcon name="next" size={14} />
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {selected ? (
        <DashRightDrawer
          eyebrow="Payout"
          title={formatMoney(selected.amount, selected.currency || currency)}
          onClose={() => setSelectedId(null)}
        >
          <PayoutDetailPanel payout={selected} currency={currency} />
        </DashRightDrawer>
      ) : null}
    </PortalShell>
  );
}

function PayoutDetailPanel({
  payout,
  currency,
}: {
  payout: AffiliatePayoutItem;
  currency: string;
}) {
  return (
    <div className="grid min-w-0 gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-sans text-2xl font-bold tracking-[0.01em] text-[color:var(--dash-text)]">
            {formatMoney(payout.amount, payout.currency || currency)}
          </p>
          <p className="text-brand-caption mt-1 text-[color:var(--dash-muted)]">
            {formatDate(payout.created_at ?? undefined)}
          </p>
        </div>
        <StatusBadge tone={statusTone(payout.status)}>{statusLabel(payout.status)}</StatusBadge>
      </div>
      <div className="grid gap-3">
        <DataField label="Status" value={statusLabel(payout.status)} />
        <DataField label="Date" value={formatDate(payout.created_at ?? undefined)} />
        <DataField
          label="Reference"
          value={<span className="font-mono text-xs break-all">{payout.payout_id}</span>}
        />
      </div>
    </div>
  );
}
