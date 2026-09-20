import { Suspense } from "react";
import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AdminReportsPage } from "@/components/platform/provider/admin/reports/AdminReportsPage";

export default function AdminReportsRoute() {
  return (
    <PortalGate role="admin">
      <Suspense>
        <AdminReportsPage />
      </Suspense>
    </PortalGate>
  );
}
