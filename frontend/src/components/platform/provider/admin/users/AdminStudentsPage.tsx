"use client";

import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PaginationControls, UserLink } from "@/components/platform/provider/admin/shared";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { ApiRequestError } from "@/lib/integrate/client";
import { listStudents, type StudentSummary } from "@/lib/integrate/provider/admin/users/api";
import { formatDate } from "@/lib/integrate/provider/student/payment/types";

export function AdminStudentsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
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
    void loadStudents();
  }, [loadStudents]);

  return (
    <PortalShell
      role="admin"
      title="Students"
      subtitle="Paginated list from GET /api/users/students"
      nav={adminNav}
    >
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      <div className="glass-panel rounded-3xl p-6">
        {loading ? (
          <p className="text-sm text-muted">Loading students…</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-muted">No students found.</p>
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
                  <tr key={student.user_id} className="border-t border-primary/10">
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
                        : student.referred_by_affiliate_id ?? "—"}
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
      </div>
    </PortalShell>
  );
}
