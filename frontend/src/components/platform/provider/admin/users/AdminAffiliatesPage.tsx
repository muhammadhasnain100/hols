"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PortalStatCard } from "@/components/platform/provider/PortalStatCard";
import { PaginationControls, UserLink } from "@/components/platform/provider/admin/shared";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  createAffiliate,
  getCachedAdminAffiliates,
  listAdminAffiliates,
  updateAffiliateInvitationQuota,
} from "@/lib/integrate/provider/admin/affiliates/api";
import type { AffiliateSummary } from "@/lib/integrate/provider/admin/users/types";
import { formatDate } from "@/lib/integrate/provider/student/payment/types";
import { inputClassName } from "@/lib/form-styles";

type CreateAffiliateForm = {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  margin_percent: string;
  invitation_quota: string;
};

const emptyForm: CreateAffiliateForm = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  margin_percent: "",
  invitation_quota: "",
};

function formatQuota(affiliate: AffiliateSummary) {
  if (affiliate.invitation_quota == null) return "Unlimited";
  return `${affiliate.student_count}/${affiliate.invitation_quota}`;
}

function isValidMargin(value: string) {
  const margin = Number(value);
  return value.trim() !== "" && Number.isFinite(margin) && margin > 0 && margin < 100;
}

function quotaDraftsFromAffiliates(affiliates: AffiliateSummary[]) {
  return Object.fromEntries(
    affiliates.map((affiliate) => [
      affiliate.user_id,
      affiliate.invitation_quota != null ? String(affiliate.invitation_quota) : "",
    ]),
  );
}

export function AdminAffiliatesPage() {
  const cachedFirstPage = getCachedAdminAffiliates({ page: 1, limit: 15 });
  const [loading, setLoading] = useState(!cachedFirstPage);
  const [creating, setCreating] = useState(false);
  const [savingQuotaFor, setSavingQuotaFor] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateSummary[]>(cachedFirstPage?.items ?? []);
  const [form, setForm] = useState<CreateAffiliateForm>(emptyForm);
  const [createOpen, setCreateOpen] = useState(false);
  const [quotaDrafts, setQuotaDrafts] = useState<Record<string, string>>(
    quotaDraftsFromAffiliates(cachedFirstPage?.items ?? []),
  );
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(cachedFirstPage?.pagination.total ?? 0);
  const [hasNext, setHasNext] = useState(cachedFirstPage?.pagination.has_next ?? false);
  const [hasPrevious, setHasPrevious] = useState(cachedFirstPage?.pagination.has_previous ?? false);

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
  }, [
    page,
    setAffiliates,
    setError,
    setHasNext,
    setHasPrevious,
    setLoading,
    setQuotaDrafts,
    setTotal,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadAffiliates();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadAffiliates]);

  async function handleCreateAffiliate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    setSuccess(null);

    const margin = form.margin_percent.trim();
    const quota = form.invitation_quota.trim();
    if (!isValidMargin(margin)) {
      setError("Margin percent must be greater than 0 and less than 100.");
      setCreating(false);
      return;
    }

    try {
      const data = await createAffiliate({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password.trim() || undefined,
        margin_percent: Number(margin),
        invitation_quota: quota ? Number(quota) : undefined,
      });

      setForm(emptyForm);
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
      setError(err instanceof ApiRequestError ? err.message : "Could not create affiliate.");
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
  const createMarginValid = isValidMargin(form.margin_percent);

  return (
    <PortalShell
      role="admin"
      title="Affiliates"
      subtitle="Create affiliates, track referred students, and manage invitation quota."
      nav={adminNav}
    >
      <div className="mx-auto grid w-full max-w-5xl gap-5">
        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
        {success ? <AuthAlert variant="success">{success}</AuthAlert> : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <PortalStatCard label="Total affiliates" value={String(total)} hint="Admin-managed accounts" />
          <PortalStatCard label="Visible students" value={String(visibleStudentCount)} hint="Current page referrals" />
          <PortalStatCard label="Visible quota" value={String(visibleQuotaTotal)} hint="Blank quotas are unlimited" />
          <PortalStatCard label="At capacity" value={String(atCapacityCount)} hint="Current page affiliates" />
        </div>

        <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold text-primary">Affiliate management</h2>
              <p className="mt-1 text-[13px] text-primary/45">
                Add affiliates, track referred students, and adjust invitation quotas.
              </p>
            </div>
            <Button type="button" variant="primary" size="md" onClick={() => setCreateOpen(true)}>
              Add affiliate
            </Button>
          </div>
        </section>

        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
          <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-sans text-lg font-semibold text-primary">Affiliate directory</h2>
              <p className="mt-1 text-sm text-muted">Admin-only data from GET /api/admin/affiliates.</p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-muted">Loading affiliates...</p>
          ) : affiliates.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-white/70 p-6 text-sm text-muted">
              No affiliates found. Create the first affiliate above.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-muted">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Invite code</th>
                    <th className="pb-3 pr-4 font-medium">Students</th>
                    <th className="pb-3 pr-4 font-medium">Margin</th>
                    <th className="pb-3 pr-4 font-medium">Quota</th>
                    <th className="pb-3 pr-4 font-medium">Joined</th>
                    <th className="pb-3 font-medium">Update quota</th>
                  </tr>
                </thead>
                <tbody>
                  {affiliates.map((affiliate) => (
                    <tr key={affiliate.user_id} className="border-t border-primary/10 align-top">
                      <td className="py-3 pr-4">
                        <UserLink
                          userId={affiliate.user_id}
                          label={`${affiliate.first_name} ${affiliate.last_name}`}
                        />
                      </td>
                      <td className="py-3 pr-4 text-muted">{affiliate.email}</td>
                      <td className="py-3 pr-4 font-medium text-primary">{affiliate.invite_code ?? "-"}</td>
                      <td className="py-3 pr-4 text-primary">{affiliate.student_count}</td>
                      <td className="py-3 pr-4 text-muted">
                        {affiliate.margin_percent != null ? `${affiliate.margin_percent}%` : "-"}
                      </td>
                      <td className="py-3 pr-4 text-primary">{formatQuota(affiliate)}</td>
                      <td className="py-3 pr-4 text-muted">{formatDate(affiliate.created_at)}</td>
                      <td className="py-3">
                        <div className="flex min-w-[11rem] items-center gap-2">
                          <label className="sr-only" htmlFor={`quota-${affiliate.user_id}`}>
                            Invitation quota for {affiliate.first_name} {affiliate.last_name}
                          </label>
                          <input
                            id={`quota-${affiliate.user_id}`}
                            type="number"
                            min="0"
                            value={quotaDrafts[affiliate.user_id] ?? ""}
                            onChange={(e) =>
                              setQuotaDrafts((current) => ({
                                ...current,
                                [affiliate.user_id]: e.target.value,
                              }))
                            }
                            className="h-10 w-24 rounded-xl border border-border/50 bg-white/90 px-3 text-sm text-primary outline-none transition focus:border-primary-light focus:ring-2 focus:ring-primary-light/15"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            disabled={savingQuotaFor === affiliate.user_id}
                            onClick={() => void handleQuotaSave(affiliate.user_id)}
                          >
                            {savingQuotaFor === affiliate.user_id ? "Saving..." : "Save"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <PaginationControls
            page={page}
            total={total}
            hasNext={hasNext}
            hasPrevious={hasPrevious}
            loading={loading}
            onPrevious={() => setPage((current) => Math.max(1, current - 1))}
            onNext={() => setPage((current) => current + 1)}
          />
        </div>

        {createOpen ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
            <button
              type="button"
              aria-label="Close create affiliate dialog"
              className="absolute inset-0 cursor-default"
              onClick={() => {
                if (!creating) setCreateOpen(false);
              }}
            />
            <form
              role="dialog"
              aria-modal="true"
              aria-labelledby="create-affiliate-title"
              className="relative z-10 max-h-[90svh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-black/[0.06] bg-white p-6 shadow-2xl md:p-7"
              onSubmit={handleCreateAffiliate}
            >
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <h2 id="create-affiliate-title" className="text-[15px] font-semibold text-primary">
                    Add affiliate
                  </h2>
                  <p className="mt-1 text-[13px] text-primary/45">
                    Invite code is generated internally and sent with the credentials email.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={creating}
                  onClick={() => setCreateOpen(false)}
                  className="rounded-md p-1.5 text-primary/40 transition hover:bg-black/[0.04] hover:text-primary disabled:opacity-50"
                  aria-label="Close dialog"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid gap-3.5">
                <div className="grid gap-3.5 sm:grid-cols-2">
                  <input
                    required
                    aria-label="First name"
                    placeholder="First name"
                    value={form.first_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, first_name: e.target.value }))}
                    className={inputClassName}
                  />
                  <input
                    required
                    aria-label="Last name"
                    placeholder="Last name"
                    value={form.last_name}
                    onChange={(e) => setForm((prev) => ({ ...prev, last_name: e.target.value }))}
                    className={inputClassName}
                  />
                </div>

                <input
                  type="email"
                  required
                  aria-label="Email"
                  autoComplete="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                  className={inputClassName}
                />

                <input
                  type="password"
                  minLength={8}
                  aria-label="Password"
                  autoComplete="new-password"
                  placeholder="Password (auto-generate if blank)"
                  value={form.password}
                  onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
                  className={inputClassName}
                />

                <div>
                  <input
                    type="number"
                    required
                    min="0.01"
                    max="99.99"
                    step="0.01"
                    aria-label="Margin percent"
                    aria-invalid={!createMarginValid}
                    placeholder="Margin percent, greater than 0 and less than 100"
                    value={form.margin_percent}
                    onChange={(e) => setForm((prev) => ({ ...prev, margin_percent: e.target.value }))}
                    className={inputClassName}
                  />
                  {!createMarginValid ? (
                    <p className="mt-2 text-[12px] font-medium text-red-700">
                      Margin percent must be greater than 0 and less than 100.
                    </p>
                  ) : null}
                </div>

                <input
                  type="number"
                  min="0"
                  aria-label="Invitation quota"
                  placeholder="Invitation quota (unlimited if blank)"
                  value={form.invitation_quota}
                  onChange={(e) => setForm((prev) => ({ ...prev, invitation_quota: e.target.value }))}
                  className={inputClassName}
                />
              </div>

              <div className="mt-7 flex flex-col gap-2 border-t border-black/[0.05] pt-5 sm:flex-row sm:justify-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  disabled={creating}
                  onClick={() => setCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={creating || !createMarginValid}
                  className="min-w-[8rem] justify-center"
                >
                  {creating ? "Creating..." : "Create"}
                </Button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </PortalShell>
  );
}
