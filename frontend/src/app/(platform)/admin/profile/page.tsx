import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AdminProfilePage } from "@/components/platform/provider/admin/profile/AdminProfilePage";

export default function AdminProfileRoute() {
  return (
    <PortalGate role="admin">
      <AdminProfilePage />
    </PortalGate>
  );
}
