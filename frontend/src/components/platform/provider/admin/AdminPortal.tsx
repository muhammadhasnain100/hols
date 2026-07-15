"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PortalStatCard } from "@/components/platform/provider/PortalStatCard";
import { adminNav } from "@/components/platform/provider/admin/adminNav";
import { Button } from "@/components/ui/Button";
import {
  getCachedAdminAffiliates,
  listAdminAffiliates,
} from "@/lib/integrate/provider/admin/affiliates/api";
import { getCachedStudents, listStudents } from "@/lib/integrate/provider/admin/users/api";
import { getCachedAdminPlans, listPlans } from "@/lib/integrate/provider/admin/payment/api";
import { getStoredUser } from "@/lib/integrate/auth/storage";

export function AdminPortal() {
  const user = getStoredUser();
  const cachedStudents = getCachedStudents({ page: 1, limit: 1 });
  const cachedAffiliates = getCachedAdminAffiliates({ page: 1, limit: 1 });
  const cachedPlans = getCachedAdminPlans();
  const [studentTotal, setStudentTotal] = useState(
    cachedStudents ? String(cachedStudents.pagination.total) : "—",
  );
  const [affiliateTotal, setAffiliateTotal] = useState(
    cachedAffiliates ? String(cachedAffiliates.pagination.total) : "—",
  );
  const [planCount, setPlanCount] = useState(cachedPlans ? String(cachedPlans.length) : "—");

  useEffect(() => {
    async function loadSummary() {
      try {
        const [studentsRes, affiliatesRes, plansRes] = await Promise.all([
          listStudents({ page: 1, limit: 1 }),
          listAdminAffiliates({ page: 1, limit: 1 }),
          listPlans(),
        ]);
        setStudentTotal(String(studentsRes.pagination.total));
        setAffiliateTotal(String(affiliatesRes.pagination.total));
        setPlanCount(String(plansRes.items.length));
      } catch {
        // Keep dashboard usable even if summary calls fail.
      }
    }

    const timer = window.setTimeout(() => {
      void loadSummary();
    }, 0);
    return () => window.clearTimeout(timer);
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
          <PortalStatCard label="Total students" value={studentTotal} hint="Registered learners" />
          <PortalStatCard label="Total affiliates" value={affiliateTotal} hint="Referral partners" />
          <PortalStatCard label="Active plans" value={planCount} hint="Membership tiers" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <h2 className="text-[15px] font-semibold text-primary">Students</h2>
            <p className="mt-2 text-[13px] text-primary/45">Browse and edit student accounts.</p>
            <Button href="/admin/students" variant="primary" size="md" className="mt-5">
              Open students
            </Button>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <h2 className="text-[15px] font-semibold text-primary">Affiliates</h2>
            <p className="mt-2 text-[13px] text-primary/45">Create partners and manage invitation quota.</p>
            <Button href="/admin/affiliates" variant="secondary" size="md" className="mt-5">
              Open affiliates
            </Button>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <h2 className="text-[15px] font-semibold text-primary">Plans</h2>
            <p className="mt-2 text-[13px] text-primary/45">Update membership plan prices.</p>
            <Button href="/admin/plans" variant="secondary" size="md" className="mt-5">
              Manage plans
            </Button>
          </div>

          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <h2 className="text-[15px] font-semibold text-primary">Profile</h2>
            <p className="mt-2 text-[13px] text-primary/45">Edit your admin account settings.</p>
            <Button href="/admin/profile" variant="secondary" size="md" className="mt-5">
              Edit profile
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-black/[0.06] bg-white p-5 md:p-6">
          <h2 className="text-[15px] font-semibold text-primary">Admin overview</h2>
          <p className="mt-2 text-[13px] text-primary/45">
            Use the sidebar or cards above to manage users, affiliates, pricing, and profile settings.
          </p>
        </div>
      </div>
    </PortalShell>
  );
}
