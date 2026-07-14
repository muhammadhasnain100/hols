"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PaginationControls, UserLink } from "@/components/platform/provider/admin/shared";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { ApiRequestError } from "@/lib/integrate/client";
import { listAffiliates, type AffiliateSummary } from "@/lib/integrate/provider/admin/users/api";
import { formatDate } from "@/lib/integrate/provider/student/payment/types";

export function AdminAffiliatesPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [affiliates, setAffiliates] = useState<AffiliateSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const loadAffiliates = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await listAffiliates({ page, limit: 15 });
      setAffiliates(data.items);
      setTotal(data.pagination.total);
      setHasNext(data.pagination.has_next);
      setHasPrevious(data.pagination.has_previous);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load affiliates.");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadAffiliates();
  }, [loadAffiliates]);

  return (
    <PortalShell
      role="admin"
      title="Affiliates"
      subtitle="Paginated list from GET /api/users/affiliates"
      nav={adminNav}
    >
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <div className="glass-panel rounded-3xl p-6">
        {loading ? (
          <p className="text-sm text-muted">Loading affiliates…</p>
        ) : affiliates.length === 0 ? (
          <p className="text-sm text-muted">No affiliates found.</p>
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
                  <th className="pb-3 font-medium">Joined</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.map((affiliate) => (
                  <tr key={affiliate.user_id} className="border-t border-primary/10">
                    <td className="py-3 pr-4">
                      <UserLink
                        userId={affiliate.user_id}
                        label={`${affiliate.first_name} ${affiliate.last_name}`}
                      />
                    </td>
                    <td className="py-3 pr-4 text-muted">{affiliate.email}</td>
                    <td className="py-3 pr-4 text-primary">{affiliate.invite_code ?? "—"}</td>
                    <td className="py-3 pr-4 text-primary">{affiliate.student_count}</td>
                    <td className="py-3 pr-4 text-muted">
                      {affiliate.margin_percent != null ? `${affiliate.margin_percent}%` : "—"}
                    </td>
                    <td className="py-3 text-muted">{formatDate(affiliate.created_at)}</td>
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
    </PortalShell>
  );
}
