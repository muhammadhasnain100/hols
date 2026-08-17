"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { Icon, Menu } from "@/components/icons";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import {
  DataField,
  DirectoryListSkeleton,
  DirectorySearchBar,
  PaginationControls,
  StatPill,
  StatusBadge,
} from "@/components/platform/provider/admin/shared";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { WelcomeChip } from "@/components/platform/provider/student/WelcomeChip";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCachedStudents,
  listStudents,
  type StudentSummary,
} from "@/lib/integrate/provider/admin/users/api";
import { exportStudentsPaymentExcel } from "@/lib/integrate/provider/admin/users/exportPayments";
import {
  formatDate,
  formatMoney,
  planLabels,
  type PlanType,
} from "@/lib/integrate/provider/student/payment/types";

function openSidebar() {
  window.dispatchEvent(new Event("hols-portal-open-sidebar"));
}

function initials(first: string, last: string) {
  return `${first?.[0] ?? ""}${last?.[0] ?? ""}`.toUpperCase() || "S";
}

function affiliateLabel(student: StudentSummary) {
  if (student.affiliate) {
    return `${student.affiliate.first_name} ${student.affiliate.last_name}`;
  }
  return null;
}

function studentMatchesSearch(student: StudentSummary, query: string) {
  const haystack = [
    student.first_name,
    student.last_name,
    student.email,
    student.current_plan,
    student.affiliate?.first_name,
    student.affiliate?.last_name,
    student.affiliate?.email,
    student.affiliate?.invite_code,
    student.referred_by_affiliate_id,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function AdminStudentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [searchPool, setSearchPool] = useState<StudentSummary[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const [exporting, setExporting] = useState(false);

  const trimmedSearch = searchQuery.trim();
  const isSearching = trimmedSearch.length > 0;

  const loadStudents = useCallback(async () => {
    const cachedPage = getCachedStudents({ page, limit: 15 });
    if (cachedPage) {
      setStudents(cachedPage.items);
      setTotal(cachedPage.pagination.total);
      setHasNext(cachedPage.pagination.has_next);
      setHasPrevious(cachedPage.pagination.has_previous);
      setLoading(false);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await listStudents({ page, limit: 15 });
      setStudents(data.items);
      setTotal(data.pagination.total);
      setHasNext(data.pagination.has_next);
      setHasPrevious(data.pagination.has_previous);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load students.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadStudents();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadStudents]);

  useEffect(() => {
    if (!isSearching) {
      setSearchPool(null);
      return;
    }

    let cancelled = false;
    void listStudents({ page: 1, limit: 100 })
      .then((data) => {
        if (!cancelled) setSearchPool(data.items);
      })
      .catch(() => {
        if (!cancelled) setSearchPool(null);
      });

    return () => {
      cancelled = true;
    };
  }, [isSearching]);

  const visibleStudents = useMemo(() => {
    const source = isSearching ? searchPool ?? students : students;
    if (!isSearching) return source;
    const query = trimmedSearch.toLowerCase();
    return source.filter((student) => studentMatchesSearch(student, query));
  }, [isSearching, searchPool, students, trimmedSearch]);

  const visibleReferredCount = visibleStudents.filter(
    (student) => student.affiliate || student.referred_by_affiliate_id,
  ).length;
  const visibleMarketingCount = visibleStudents.filter((student) => student.marketing_pref).length;
  const visibleSpent = visibleStudents.reduce((sum, student) => sum + (student.total_spent ?? 0), 0);
  const visibleAdminEarned = visibleStudents.reduce(
    (sum, student) => sum + (student.admin_earned ?? student.total_spent ?? 0),
    0,
  );
  const spendCurrency =
    visibleStudents.find((student) => student.spend_currency)?.spend_currency ?? "USD";

  async function handleExportPayments() {
    setExporting(true);
    setError(null);
    try {
      await exportStudentsPaymentExcel(
        isSearching ? { students: visibleStudents } : undefined,
      );
    } catch (err) {
      setError(
        err instanceof ApiRequestError ? err.message : "Failed to export student payments.",
      );
    } finally {
      setExporting(false);
    }
  }

  return (
    <PortalShell
      role="admin"
      title="Students"
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
              Students
            </h1>
          </div>
          <WelcomeChip fallbackName="Admin" />
        </header>

        <div className="grid w-full min-w-0 gap-3 sm:gap-4">
          {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

          <section className="dashboard-hero relative overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6">
            <div className="flex flex-col gap-3.5 sm:gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-text)]/55">
                  Student directory
                </p>
                <div className="mt-2 flex flex-wrap items-end gap-x-2 gap-y-1">
                  <span className="font-sans text-xl font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl md:text-[2.25rem] md:leading-none">
                    {loading ? "—" : total}
                  </span>
                  <span className="mb-0.5 text-brand-caption font-medium text-[color:var(--dash-faint)]">
                    {total === 1 ? "student" : "students"}
                  </span>
                </div>
                <p className="text-brand-body mt-2 text-sm text-[color:var(--dash-muted)] sm:text-base">
                  Spend, membership plan, and purchase history for each learner. Your earnings are
                  student spend minus affiliate commissions.
                </p>
              </div>

              <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:gap-2.5">
                <button
                  type="button"
                  disabled={exporting || loading || (isSearching && visibleStudents.length === 0)}
                  onClick={() => void handleExportPayments()}
                  className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-[color:var(--dash-text)] transition disabled:pointer-events-none disabled:opacity-55 sm:px-5"
                >
                  {exporting ? "Exporting…" : "Export Excel"}
                </button>
                <Link
                  href="/admin/affiliates"
                  className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center rounded-full px-3 text-sm font-medium text-[color:var(--dash-text)] transition sm:px-5"
                >
                  Affiliates
                </Link>
                <Link
                  href="/admin"
                  className="font-sans col-span-2 inline-flex min-h-10 items-center justify-center rounded-full bg-[#DDE466] px-3 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:col-span-1 sm:px-5"
                >
                  Dashboard
                </Link>
              </div>
            </div>
          </section>

          <div className="grid min-w-0 gap-2.5 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 sm:gap-3">
            <StatPill label="Total students" value={loading ? "—" : String(total)} />
            <StatPill
              label={
                <>
                  <span className="sm:hidden">Your earn</span>
                  <span className="hidden sm:inline">Your earnings</span>
                </>
              }
              value={loading ? "—" : formatMoney(visibleAdminEarned, spendCurrency)}
            />
            <StatPill
              label={
                <>
                  <span className="sm:hidden">Spent</span>
                  <span className="hidden sm:inline">Student spend</span>
                </>
              }
              value={loading ? "—" : formatMoney(visibleSpent, spendCurrency)}
            />
            <StatPill
              label={
                <>
                  <span className="sm:hidden">Referred</span>
                  <span className="hidden sm:inline">Referred (this page)</span>
                </>
              }
              value={loading ? "—" : String(visibleReferredCount)}
            />
            <StatPill
              label={
                <>
                  <span className="sm:hidden">Marketing</span>
                  <span className="hidden sm:inline">Marketing opt-in</span>
                </>
              }
              value={loading ? "—" : String(visibleMarketingCount)}
            />
          </div>

          <section className="dashboard-surface min-w-0 rounded-2xl p-4 sm:p-5 md:p-6">
            <div className="flex flex-wrap items-end justify-between gap-2">
              <div className="min-w-0">
                <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-[color:var(--dash-faint)]">
                  Accounts
                </p>
                <h2 className="font-sans mt-1 text-base font-semibold tracking-[0.005em] text-[color:var(--dash-text)] sm:text-lg md:text-xl">
                  All students
                </h2>
              </div>
              <span className="text-brand-caption font-medium text-[color:var(--dash-accent)]">
                {isSearching
                  ? `${visibleStudents.length} match${visibleStudents.length === 1 ? "" : "es"}`
                  : `Page ${page}`}
              </span>
            </div>

            <DirectorySearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by name, email, plan, or affiliate…"
              label="Search students"
            />

            <div className="mt-4 space-y-3 sm:mt-5 sm:space-y-4">
              {loading && visibleStudents.length === 0 ? (
                <DirectoryListSkeleton />
              ) : visibleStudents.length === 0 ? (
                <p className="text-brand-body py-10 text-center text-[color:var(--dash-faint)]">
                  {isSearching ? "No students match your search." : "No students found."}
                </p>
              ) : (
                visibleStudents.map((student) => {
                  const referredName = affiliateLabel(student);
                  const fullName = `${student.first_name} ${student.last_name}`.trim() || "Student";
                  const profileHref = student.user_id
                    ? `/admin/users/${encodeURIComponent(student.user_id)}`
                    : null;

                  return (
                    <article
                      key={student.user_id || student.email}
                      className="relative z-0 min-w-0 overflow-hidden rounded-2xl border border-[color:var(--dash-surface-border)] bg-[color:var(--dash-soft)]/35 p-3.5 transition hover:bg-[color:var(--dash-soft)]/55 sm:p-5"
                    >
                      <div className="relative z-10 flex flex-col gap-3.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
                          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#DDE466]/20 font-sans text-sm font-bold text-[color:var(--dash-accent)] sm:h-14 sm:w-14 sm:text-base">
                            {initials(student.first_name, student.last_name)}
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
                              <StatusBadge tone={student.marketing_pref ? "accent" : "muted"}>
                                <span className="sm:hidden">{student.marketing_pref ? "On" : "Off"}</span>
                                <span className="hidden sm:inline">
                                  {student.marketing_pref ? "Marketing on" : "Marketing off"}
                                </span>
                              </StatusBadge>
                            </div>
                            <p className="text-brand-body mt-1 break-all text-sm text-[color:var(--dash-muted)] sm:break-normal sm:truncate">
                              {student.email}
                            </p>
                          </div>
                        </div>

                        {profileHref ? (
                          <Link
                            href={profileHref}
                            prefetch
                            className="relative z-20 font-sans inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-[#DDE466] px-5 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:min-h-10 sm:w-auto"
                          >
                            View profile
                          </Link>
                        ) : (
                          <span className="font-sans inline-flex min-h-11 w-full shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-soft)] px-5 text-sm font-medium text-[color:var(--dash-faint)] sm:min-h-10 sm:w-auto">
                            Unavailable
                          </span>
                        )}
                      </div>

                      <div className="mt-3.5 grid grid-cols-1 gap-3 border-t border-[color:var(--dash-surface-border)] pt-3.5 min-[420px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 sm:mt-4 sm:pt-4">
                        <DataField
                          label="Total spent"
                          value={formatMoney(
                            student.total_spent ?? 0,
                            student.spend_currency ?? "USD",
                          )}
                        />
                        <DataField
                          label="Your earnings"
                          value={
                            <span className="text-[color:var(--dash-accent)]">
                              {formatMoney(
                                student.admin_earned ?? student.total_spent ?? 0,
                                student.spend_currency ?? "USD",
                              )}
                            </span>
                          }
                        />
                        <DataField
                          label="Plan"
                          value={
                            student.current_plan
                              ? planLabels[student.current_plan as PlanType] ?? student.current_plan
                              : "No plan"
                          }
                        />
                        <DataField
                          label="Orders"
                          value={String(student.paid_order_count ?? student.order_count ?? 0)}
                        />
                        <DataField
                          label="Affiliate"
                          value={
                            referredName ? (
                              <span>{referredName}</span>
                            ) : student.referred_by_affiliate_id ? (
                              <span className="font-mono text-xs">{student.referred_by_affiliate_id}</span>
                            ) : (
                              <span className="text-[color:var(--dash-faint)]">Direct signup</span>
                            )
                          }
                        />
                        <DataField
                          label="Last purchase"
                          value={
                            student.last_purchase_at
                              ? `${formatDate(student.last_purchase_at)}${
                                  student.last_purchase_amount != null
                                    ? ` · ${formatMoney(
                                        student.last_purchase_amount,
                                        student.spend_currency ?? "USD",
                                      )}`
                                    : ""
                                }`
                              : "—"
                          }
                        />
                        <DataField
                          label="Joined"
                          value={student.created_at ? formatDate(student.created_at) : "—"}
                        />
                      </div>

                      {student.affiliate?.invite_code || student.affiliate?.email ? (
                        <div className="mt-3 grid grid-cols-1 gap-3 rounded-xl bg-[color:var(--dash-soft)] px-3 py-3 min-[420px]:grid-cols-2 sm:px-3.5">
                          {student.affiliate.email ? (
                            <DataField label="Affiliate email" value={student.affiliate.email} />
                          ) : null}
                          {student.affiliate.invite_code ? (
                            <DataField label="Invite code" value={student.affiliate.invite_code} />
                          ) : null}
                        </div>
                      ) : null}
                    </article>
                  );
                })
              )}
            </div>

            {!isSearching ? (
              <PaginationControls
                page={page}
                total={total}
                hasNext={hasNext}
                hasPrevious={hasPrevious}
                loading={loading}
                onPrevious={() => setPage((current) => Math.max(1, current - 1))}
                onNext={() => setPage((current) => current + 1)}
              />
            ) : null}
          </section>
        </div>
      </div>
    </PortalShell>
  );
}
