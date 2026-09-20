import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AdminSettingsPage } from "@/components/platform/provider/admin/profile/AdminSettingsPage";

export default function AdminProfileRoute() {
  return (
    <PortalGate role="admin">
      <AdminSettingsPage section="profile" />
    </PortalGate>
  );
}
