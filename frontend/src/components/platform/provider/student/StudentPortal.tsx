"use client";

import { useEffect, useState } from "react";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { PortalStatCard } from "@/components/platform/provider/PortalStatCard";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import { getStoredUser } from "@/lib/integrate/auth/storage";
import {
  getCard,
  getCurrentMembership,
  listOrders,
} from "@/lib/integrate/provider/student/payment/api";
import {
  formatDate,
  planLabels,
} from "@/lib/integrate/provider/student/payment/types";

export function StudentPortal() {
  const user = getStoredUser();
  const [membershipLabel, setMembershipLabel] = useState("—");
  const [membershipHint, setMembershipHint] = useState("Loading…");
  const [cardLabel, setCardLabel] = useState("—");
  const [orderCount, setOrderCount] = useState("—");

  useEffect(() => {
    async function loadSummary() {
      try {
        const [membershipRes, ordersRes] = await Promise.all([
          getCurrentMembership(),
          listOrders({ page: 1, limit: 1 }),
        ]);

        if (membershipRes.membership) {
          setMembershipLabel(planLabels[membershipRes.membership.plan_type]);
          setMembershipHint(
            `${membershipRes.membership.status} · until ${formatDate(membershipRes.membership.end_date)}`,
          );
        } else {
          setMembershipLabel("None");
          setMembershipHint("No active membership");
        }

        setOrderCount(String(ordersRes.pagination.total));

        try {
          const cardRes = await getCard();
          setCardLabel(cardRes.card.card_number_masked);
        } catch (err) {
          if (err instanceof ApiRequestError && err.status === 404) {
            setCardLabel("Not added");
          }
        }
      } catch {
        setMembershipHint("Could not load membership");
      }
    }

    void loadSummary();
  }, []);

  const displayName =
    user?.profile?.first_name && user?.profile?.last_name
      ? `${user.profile.first_name} ${user.profile.last_name}`
      : "Student";

  return (
    <PortalShell
      role="student"
      title={`Welcome, ${displayName}`}
      subtitle="Your learning hub for courses, membership, and account settings."
      nav={studentNav}
    >
      <div className="grid gap-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <PortalStatCard label="Membership" value={membershipLabel} hint={membershipHint} />
          <PortalStatCard label="Saved card" value={cardLabel} hint="Used for plan purchases" />
          <PortalStatCard label="Orders" value={orderCount} hint="Total purchases" />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <h2 className="text-[15px] font-semibold text-primary">Membership</h2>
            <p className="mt-2 text-[13px] text-primary/45">View plans and purchase access.</p>
            <Button href="/student/payment" variant="primary" size="md" className="mt-4">
              Open membership
            </Button>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <h2 className="text-[15px] font-semibold text-primary">Orders</h2>
            <p className="mt-2 text-[13px] text-primary/45">Review purchase history.</p>
            <Button href="/student/payment/orders" variant="secondary" size="md" className="mt-4">
              View orders
            </Button>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <h2 className="text-[15px] font-semibold text-primary">Payment card</h2>
            <p className="mt-2 text-[13px] text-primary/45">Add or update your saved card.</p>
            <Button href="/student/payment/card" variant="secondary" size="md" className="mt-4">
              Manage card
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <h2 className="text-[15px] font-semibold text-primary">Profile</h2>
            <p className="mt-2 text-[13px] text-primary/45">Name, address, and photo.</p>
            <Button href="/student/profile" variant="secondary" size="md" className="mt-4">
              Open profile
            </Button>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <h2 className="text-[15px] font-semibold text-primary">Lectures</h2>
            <p className="mt-2 text-[13px] text-primary/45">Browse courses and lessons.</p>
            <Button href="/student/lectures" variant="primary" size="md" className="mt-4">
              Open lectures
            </Button>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-5">
            <h2 className="text-[15px] font-semibold text-primary">Calculator</h2>
            <p className="mt-2 text-[13px] text-primary/45">Reconstitution dosing helper.</p>
            <Button href="/student/calculator" variant="secondary" size="md" className="mt-4">
              Open calculator
            </Button>
          </div>
        </div>
      </div>
    </PortalShell>
  );
}
