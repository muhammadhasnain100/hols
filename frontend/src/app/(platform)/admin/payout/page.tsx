import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AdminPayoutPage } from "@/components/platform/provider/admin/payout/AdminPayoutPage";

export default function AdminPayoutRoute() {
  return (
    <PortalGate role="admin">
      <AdminPayoutPage />
    </PortalGate>
  );
}
