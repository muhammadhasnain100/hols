"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PortalStatCard } from "@/components/platform/provider/PortalStatCard";
import { PaginationControls, UserLink } from "@/components/platform/provider/admin/shared";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCachedStudents,
  listStudents,
  type StudentSummary,
} from "@/lib/integrate/provider/admin/users/api";
import { formatDate } from "@/lib/integrate/provider/student/payment/types";

export function AdminStudentsPage() {
  const cachedFirstPage = getCachedStudents({ page: 1, limit: 15 });
  const [loading, setLoading] = useState(!cachedFirstPage);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>(cachedFirstPage?.items ?? []);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(cachedFirstPage?.pagination.total ?? 0);
  const [hasNext, setHasNext] = useState(cachedFirstPage?.pagination.has_next ?? false);
  const [hasPrevious, setHasPrevious] = useState(cachedFirstPage?.pagination.has_previous ?? false);

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

  const visibleReferredCount = students.filter(
    (student) => student.affiliate || student.referred_by_affiliate_id,
  ).length;
  const visibleMarketingCount = students.filter((student) => student.marketing_pref).length;

  return (
    <PortalShell
      role="admin"
      title="Students"
      subtitle="Review student accounts and affiliate referral details."
      nav={adminNav}
    >
      <div className="mx-auto grid w-full max-w-5xl gap-5">
        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        <div className="grid gap-4 sm:grid-cols-3">
          <PortalStatCard label="Total students" value={String(total)} hint="Registered learners" />
          <PortalStatCard label="Visible referred" value={String(visibleReferredCount)} hint="Current page referrals" />
          <PortalStatCard label="Marketing opt-in" value={String(visibleMarketingCount)} hint="Current page students" />
        </div>

        <section className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
          <div className="mb-5">
            <h2 className="text-[15px] font-semibold text-primary">Student directory</h2>
            <p className="mt-1 text-[13px] text-primary/45">
              Open any profile to view details or edit admin-controlled fields.
            </p>
          </div>

          {loading ? (
            <div className="rounded-2xl border border-black/[0.06] bg-white p-10 text-center">
              <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
            </div>
          ) : students.length === 0 ? (
            <div className="rounded-2xl border border-border/50 bg-white/70 p-6 text-sm text-muted">
              No students found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="text-muted">
                    <th className="pb-3 pr-4 font-medium">Name</th>
                    <th className="pb-3 pr-4 font-medium">Email</th>
                    <th className="pb-3 pr-4 font-medium">Affiliate</th>
                    <th className="pb-3 pr-4 font-medium">Marketing</th>
                    <th className="pb-3 font-medium">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => (
                    <tr key={student.user_id} className="border-t border-primary/10 align-top">
                      <td className="py-3 pr-4">
                        <UserLink
                          userId={student.user_id}
                          label={`${student.first_name} ${student.last_name}`}
                        />
                      </td>
                      <td className="py-3 pr-4 text-muted">{student.email}</td>
                      <td className="py-3 pr-4 text-muted">
                        {student.affiliate
                          ? `${student.affiliate.first_name} ${student.affiliate.last_name}`
                          : student.referred_by_affiliate_id ?? "-"}
                      </td>
                      <td className="py-3 pr-4 text-primary">
                        {student.marketing_pref ? "Yes" : "No"}
                      </td>
                      <td className="py-3 text-muted">{formatDate(student.created_at)}</td>
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
        </section>
      </div>
    </PortalShell>
  );
}
