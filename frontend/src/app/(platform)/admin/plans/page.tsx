import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AdminPlansPage } from "@/components/platform/provider/admin/payment/AdminPlansPage";

export default function AdminPlansRoute() {
  return (
    <PortalGate role="admin">
      <AdminPlansPage />
    </PortalGate>
  );
}
