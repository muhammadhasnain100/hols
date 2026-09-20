import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AdminSettingsPage } from "@/components/platform/provider/admin/profile/AdminSettingsPage";

export default function AdminPayoutSettingsRoute() {
  return (
    <PortalGate role="admin">
      <AdminSettingsPage section="payout" />
    </PortalGate>
  );
}
