"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { Icon, Menu } from "@/components/icons";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import {
  DataField,
  DirectoryListSkeleton,
  PaginationControls,
  StatPill,
  StatusBadge,
} from "@/components/platform/provider/admin/shared";
import {
  CreateAffiliateDialog,
  type CreateAffiliateFormValues,
} from "@/components/platform/provider/admin/users/CreateAffiliateDialog";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  createAffiliate,
  getCachedAdminAffiliates,
  listAdminAffiliates,
  updateAffiliateInvitationQuota,
} from "@/lib/integrate/provider/admin/affiliates/api";
import type { AffiliateSummary } from "@/lib/integrate/provider/admin/users/types";
import { formatDate, formatMoney } from "@/lib/integrate/provider/student/payment/types";

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

function formatQuota(affiliate: AffiliateSummary) {
  if (affiliate.invitation_quota == null) return "Unlimited";
  return `${affiliate.student_count} / ${affiliate.invitation_quota}`;
}

function quotaDraftsFromAffiliates(affiliates: AffiliateSummary[]) {
  return Object.fromEntries(
    affiliates.map((affiliate) => [
      affiliate.user_id,
      affiliate.invitation_quota != null ? String(affiliate.invitation_quota) : "",
    ]),
  );
}

function initials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "A";
}

export function AdminAffiliatesPage() {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [savingQuotaFor, setSavingQuotaFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateSummary[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [quotaDrafts, setQuotaDrafts] = useState<Record<string, string>>({});
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const loadAffiliates = useCallback(async () => {
    const cachedPage = getCachedAdminAffiliates({ page, limit: 15 });
    if (cachedPage) {
      setAffiliates(cachedPage.items);
      setTotal(cachedPage.pagination.total);
      setHasNext(cachedPage.pagination.has_next);
      setHasPrevious(cachedPage.pagination.has_previous);
      setQuotaDrafts(quotaDraftsFromAffiliates(cachedPage.items));
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await listAdminAffiliates({ page, limit: 15 });
      setAffiliates(data.items);
      setTotal(data.pagination.total);
      setHasNext(data.pagination.has_next);
      setHasPrevious(data.pagination.has_previous);
      setQuotaDrafts(quotaDraftsFromAffiliates(data.items));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load affiliates.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAffiliates();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAffiliates]);

  function openCreateDialog() {
    setDialogError(null);
    setError(null);
    setCreateOpen(true);
  }

  async function handleCreateAffiliate(values: CreateAffiliateFormValues) {
    setCreating(true);
    setDialogError(null);
    setSuccess(null);

    try {
      const data = await createAffiliate({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        password: values.password || undefined,
        margin_percent: Number(values.margin_percent),
        invitation_quota: values.invitation_quota ? Number(values.invitation_quota) : undefined,
      });

      setCreateOpen(false);
      setSuccess(
        data.credential_email_queued
          ? "Affiliate created and credential email queued."
          : "Affiliate created.",
      );

      if (page === 1) {
        await loadAffiliates();
      } else {
        setPage(1);
      }
    } catch (err) {
      setDialogError(err instanceof ApiRequestError ? err.message : "Could not create affiliate.");
    } finally {
      setCreating(false);
    }
  }

  async function handleQuotaSave(affiliateId: string) {
    const draft = quotaDrafts[affiliateId]?.trim() ?? "";
    const quota = Number(draft);

    if (!draft || Number.isNaN(quota) || quota < 0) {
      setError("Invitation quota must be a number greater than or equal to 0.");
      return;
    }

    setSavingQuotaFor(affiliateId);
    setError(null);
    setSuccess(null);

    try {
      const data = await updateAffiliateInvitationQuota(affiliateId, {
        invitation_quota: quota,
      });
      setAffiliates((current) =>
        current.map((affiliate) =>
          affiliate.user_id === affiliateId ? data.affiliate : affiliate,
        ),
      );
      setQuotaDrafts((current) => ({
        ...current,
        [affiliateId]: String(data.affiliate.invitation_quota ?? ""),
      }));
      setSuccess("Invitation quota updated.");
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Could not update invitation quota.");
    } finally {
      setSavingQuotaFor(null);
    }
  }

  const visibleStudentCount = affiliates.reduce((sum, affiliate) => sum + affiliate.student_count, 0);
  const visibleQuotaTotal = affiliates.reduce(
    (sum, affiliate) => sum + (affiliate.invitation_quota ?? 0),
    0,
  );
  const atCapacityCount = affiliates.filter(
    (affiliate) =>
      affiliate.invitation_quota != null && affiliate.student_count >= affiliate.invitation_quota,
  ).length;
  const visibleTotalEarned = affiliates.reduce(
    (sum, affiliate) => sum + (affiliate.total_earned ?? 0),
    0,
  );
  const earningsCurrency =
    affiliates.find((affiliate) => affiliate.earnings_currency)?.earnings_currency ?? "USD";

  return (
    <PortalShell
      role="admin"
      title="Affiliates"
      showPageHeader={false}
      contentFlush
      brandBackdrop
      nav={adminNav}
    >
      <div className="dashboard-screen min-w-0 overflow-x-hidden">
        <header className="mb-3 flex items-center justify-between gap-2 sm:mb-5 sm:gap-4">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              aria-label="Open sidebar"
              onClick={openSidebar}
              className="dashboard-icon-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full lg:hidden"
            >
              <Icon icon={Menu} size={18} />
            </button>
            <h1 className="font-sans truncate text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-xl md:text-2xl">
              Affiliates
            </h1>
          </div>
          <WelcomeChip fallbackName="Admin" />
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
          {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

          <section className="dashboard-hero relative overflow-hidden rounded-2xl px-4 py-3.5 sm:px-5 sm:py-5 md:px-6 md:py-6">
            <div className="flex w-full flex-col gap-3.5 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                  Partner network
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
                  <span className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                    {loading ? "—" : total}
                  </span>
                  <span className="mb-0.5 text-brand-caption font-medium text-[color:var(--dash-faint)]">
                    {total === 1 ? "affiliate" : "affiliates"}
                  </span>
                </div>
                <p className="text-brand-body mt-2 text-sm text-[color:var(--dash-muted)] sm:text-base">
                  Full partner details, referral counts, commission earned, and invitation quotas in one place.
                </p>
              </div>

              <div className="grid w-full shrink-0 grid-cols-2 gap-2 sm:ml-auto sm:flex sm:w-auto sm:justify-end sm:gap-2.5 lg:shrink-0">
                <Link
                  href="/admin/students"
                  className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-[color:var(--dash-text)] transition sm:px-5"
                >
                  Students
                </Link>
                <button
                  type="button"
                  onClick={openCreateDialog}
                  className="font-sans inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-3 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:px-5"
                >
                  <span className="sm:hidden">Add</span>
                  <span className="hidden sm:inline">Add affiliate</span>
                </button>
              </div>
            </div>
          </section>

          <div className="grid min-w-0 gap-2.5 grid-cols-2 md:grid-cols-3 xl:grid-cols-5 sm:gap-3">
            <StatPill label="Total affiliates" value={loading ? "—" : String(total)} />
            <StatPill
              label={
                <>
                  <span className="sm:hidden">Students</span>
                  <span className="hidden sm:inline">Students (this page)</span>
                </>
              }
              value={loading ? "—" : String(visibleStudentCount)}
            />
            <StatPill
              label={
                <>
                  <span className="sm:hidden">Earned</span>
                  <span className="hidden sm:inline">Total earned</span>
                </>
              }
              value={loading ? "—" : formatMoney(visibleTotalEarned, earningsCurrency)}
            />
            <StatPill label="Quota total" value={loading ? "—" : String(visibleQuotaTotal)} />
            <StatPill label="At capacity" value={loading ? "—" : String(atCapacityCount)} />
          </div>

          <section className="dashboard-surface min-w-0 rounded-2xl p-4 sm:p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                  Accounts
                </p>
                <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg md:text-xl">
                  All affiliates
                </h2>
              </div>
              <span className="text-brand-caption font-medium text-[color:var(--dash-accent)]">
                Page {page}
              </span>
            </div>

            <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
              {loading && affiliates.length === 0 ? (
                <DirectoryListSkeleton />
              ) : affiliates.length === 0 ? (
                <div className="py-10 text-center">
                  <p className="text-brand-body text-[color:var(--dash-faint)]">No affiliates found.</p>
                  <button
                    type="button"
                    onClick={openCreateDialog}
                    className="font-sans mt-3 inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105"
                  >
                    Create first affiliate
                  </button>
                </div>
              ) : (
                affiliates.map((affiliate) => {
                  const atCapacity =
                    affiliate.invitation_quota != null &&
                    affiliate.student_count >= affiliate.invitation_quota;
                  const draft = quotaDrafts[affiliate.user_id] ?? "";
                  const quotaChanged =
                    draft.trim() !== "" &&
                    Number(draft) !== Number(affiliate.invitation_quota ?? NaN);
                  const fullName =
                    `${affiliate.first_name} ${affiliate.last_name}`.trim() || "Affiliate";
                  const profileHref = affiliate.user_id
                    ? `/admin/users/${encodeURIComponent(affiliate.user_id)}`
                    : null;

                  return (
                    <article
                      key={affiliate.user_id || affiliate.email}
                      className="relative z-0 min-w-0 overflow-hidden rounded-2xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)]/35 p-3.5 transition hover:bg-[color:var(--dash-soft)]/55 sm:p-5"
                    >
                      <div className="relative z-10 flex flex-col gap-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DDE466]/20 font-sans text-sm font-bold text-[color:var(--dash-accent)] sm:h-14 sm:w-14 sm:text-base">
                            {initials(affiliate.first_name, affiliate.last_name)}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex min-w-0 flex-wrap items-center gap-2">
                              {profileHref ? (
                                <Link
                                  href={profileHref}
                                  className="font-sans min-w-0 max-w-full break-words text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] underline-offset-2 transition hover:text-[color:var(--dash-accent)] hover:underline sm:text-lg"
                                >
                                  {fullName}
                                </Link>
                              ) : (
                                <h3 className="font-sans min-w-0 max-w-full break-words text-base font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-lg">
                                  {fullName}
                                </h3>
                              )}
                              {atCapacity ? (
                                <StatusBadge tone="warn">At capacity</StatusBadge>
                              ) : (
                                <StatusBadge tone="accent">Active</StatusBadge>
                              )}
                            </div>
                            <p className="text-brand-body mt-1 break-all text-sm text-[color:var(--dash-muted)] sm:break-normal sm:truncate">
                              {affiliate.email}
                            </p>
                          </div>
                        </div>

                        {profileHref ? (
                          <Link
                            href={profileHref}
                            prefetch
                            className="relative z-20 dashboard-pill-soft font-sans inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full px-5 text-sm font-medium text-[color:var(--dash-text)] transition sm:min-h-10 sm:w-auto"
                          >
                            View profile
                          </Link>
                        ) : (
                          <span className="font-sans inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-soft)] px-5 text-sm font-medium text-[color:var(--dash-faint)] sm:min-h-10 sm:w-auto">
                            Unavailable
                          </span>
                        )}
                      </div>

                      <div className="mt-3.5 grid grid-cols-1 gap-3 border-t border-[color:var(--dash-surface-border)] pt-3.5 min-[420px]:grid-cols-2 lg:grid-cols-3 sm:mt-4 sm:pt-4">
                        <DataField label="Email" value={affiliate.email} className="min-[420px]:col-span-2 lg:col-span-1" />
                        <DataField
                          label="Invite code"
                          value={
                            affiliate.invite_code ? (
                              <span className="font-mono tracking-wide">{affiliate.invite_code}</span>
                            ) : (
                              "—"
                            )
                          }
                        />
                        <DataField
                          label="Students"
                          value={
                            <span className="text-[color:var(--dash-accent)]">
                              {affiliate.student_count}
                            </span>
                          }
                        />
                        <DataField
                          label="Margin"
                          value={
                            affiliate.margin_percent != null
                              ? `${affiliate.margin_percent}%`
                              : "—"
                          }
                        />
                        <DataField
                          label="Total earned"
                          value={
                            <span className="text-[color:var(--dash-accent)]">
                              {formatMoney(
                                affiliate.total_earned ?? 0,
                                affiliate.earnings_currency ?? "USD",
                              )}
                            </span>
                          }
                        />
                        <DataField label="Quota usage" value={formatQuota(affiliate)} />
                        <DataField
                          label="Joined"
                          value={affiliate.created_at ? formatDate(affiliate.created_at) : "—"}
                        />
                      </div>

                      <div className="mt-3.5 flex flex-col gap-3 rounded-xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)]/60 px-3 py-3 sm:mt-4 sm:flex-row sm:items-end sm:gap-3 sm:px-4 sm:py-3.5">
                        <div className="grid min-w-0 w-full flex-1 gap-2">
                          <label
                            htmlFor={`quota-${affiliate.user_id}`}
                            className="dashboard-field-label"
                          >
                            Update invitation quota
                          </label>
                          <input
                            id={`quota-${affiliate.user_id}`}
                            type="number"
                            min={0}
                            value={draft}
                            placeholder="Enter quota (0 or higher)"
                            onChange={(e) =>
                              setQuotaDrafts((current) => ({
                                ...current,
                                [affiliate.user_id]: e.target.value,
                              }))
                            }
                            className="dashboard-field w-full min-w-0"
                          />
                        </div>
                        <button
                          type="button"
                          disabled={
                            savingQuotaFor === affiliate.user_id ||
                            !quotaChanged ||
                            draft.trim() === ""
                          }
                          onClick={() => void handleQuotaSave(affiliate.user_id)}
                          className="font-sans inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 disabled:pointer-events-none disabled:opacity-50 sm:w-auto sm:min-w-[9rem]"
                        >
                          {savingQuotaFor === affiliate.user_id ? "Saving…" : "Save quota"}
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <PaginationControls
              page={page}
              total={total}
              hasNext={hasNext}
              hasPrevious={hasPrevious}
              loading={loading}
              onPrevious={() => setPage((current) => Math.max(1, current - 1))}
              onNext={() => setPage((current) => current + 1)}
            />
          </section>
        </div>
      </div>

      <CreateAffiliateDialog
        open={createOpen}
        isSubmitting={creating}
        error={dialogError}
        onClose={() => {
          if (!creating) setCreateOpen(false);
        }}
        onSubmit={(values) => void handleCreateAffiliate(values)}
      />
    </PortalShell>
  );
}
