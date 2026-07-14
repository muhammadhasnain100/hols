"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PortalStatCard } from "@/components/platform/provider/PortalStatCard";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { Button } from "@/components/ui/Button";
import { listAffiliates, listStudents } from "@/lib/integrate/provider/admin/users/api";
import { listPlans } from "@/lib/integrate/provider/admin/payment/api";
import { getStoredUser } from "@/lib/integrate/auth/storage";
import { formatMoney, planLabels } from "@/lib/integrate/provider/student/payment/types";

export function AdminPortal() {
  const user = getStoredUser();
  const [studentTotal, setStudentTotal] = useState("—");
  const [affiliateTotal, setAffiliateTotal] = useState("—");
  const [planCount, setPlanCount] = useState("—");

  useEffect(() => {
    async function loadSummary() {
      try {
        const [studentsRes, affiliatesRes, plansRes] = await Promise.all([
          listStudents({ page: 1, limit: 1 }),
          listAffiliates({ page: 1, limit: 1 }),
          listPlans(),
        ]);
        setStudentTotal(String(studentsRes.pagination.total));
        setAffiliateTotal(String(affiliatesRes.pagination.total));
        setPlanCount(String(plansRes.items.length));
      } catch {
        // Keep dashboard usable even if summary calls fail.
      }
    }

    void loadSummary();
  }, []);

  const displayName =
    user?.profile?.first_name && user?.profile?.last_name
      ? `${user.profile.first_name} ${user.profile.last_name}`
      : "Admin";

  return (
    <PortalShell
      role="admin"
      title={`Welcome, ${displayName}`}
      subtitle="Manage students, affiliates, plan pricing, and user profiles."
      nav={adminNav}
    >
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <PortalStatCard label="Total students" value={studentTotal} hint="From /api/users/students" />
          <PortalStatCard label="Total affiliates" value={affiliateTotal} hint="From /api/users/affiliates" />
          <PortalStatCard label="Active plans" value={planCount} hint="From /api/payment/plans" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <div className="glass-panel rounded-3xl p-6">
            <h2 className="font-sans text-lg font-semibold text-primary">Students</h2>
            <p className="mt-2 text-sm text-muted">Browse and edit student accounts.</p>
            <Button href="/admin/students" variant="primary" size="md" className="mt-5">
              Open students
            </Button>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <h2 className="font-sans text-lg font-semibold text-primary">Affiliates</h2>
            <p className="mt-2 text-sm text-muted">View affiliate partners and referral counts.</p>
            <Button href="/admin/affiliates" variant="secondary" size="md" className="mt-5">
              Open affiliates
            </Button>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <h2 className="font-sans text-lg font-semibold text-primary">Plans</h2>
            <p className="mt-2 text-sm text-muted">Update membership plan prices.</p>
            <Button href="/admin/plans" variant="glass" size="md" className="mt-5">
              Manage plans
            </Button>
          </div>

          <div className="glass-panel rounded-3xl p-6">
            <h2 className="font-sans text-lg font-semibold text-primary">Profile</h2>
            <p className="mt-2 text-sm text-muted">Edit your admin account settings.</p>
            <Button href="/admin/profile" variant="ghost" size="md" className="mt-5">
              Edit profile
            </Button>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6">
          <h2 className="font-sans text-lg font-semibold text-primary">Quick links</h2>
          <p className="mt-2 text-sm text-muted">
            User detail pages use{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5 text-primary">GET/PUT /api/auth/profile/{"{user_id}"}</code>
            . Plan pricing uses{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5 text-primary">PUT /api/payment/plans/{"{plan_type}"}</code>.
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <Link href="/admin/students" className="font-medium text-primary underline-offset-2 hover:underline">
              Students list
            </Link>
            <Link href="/admin/affiliates" className="font-medium text-primary underline-offset-2 hover:underline">
              Affiliates list
            </Link>
            <Link href="/admin/plans" className="font-medium text-primary underline-offset-2 hover:underline">
              Plan pricing
            </Link>
          </div>
          <p className="mt-4 text-xs text-muted">
            Plan labels: {Object.values(planLabels).join(", ")} · Prices shown as {formatMoney(0).replace("0.00", "…")}
          </p>
        </div>
      </div>
    </PortalShell>
  );
}
