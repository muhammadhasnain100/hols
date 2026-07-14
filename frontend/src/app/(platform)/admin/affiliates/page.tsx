import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AdminAffiliatesPage } from "@/components/platform/provider/admin/users/AdminAffiliatesPage";

export default function AdminAffiliatesRoute() {
  return (
    <PortalGate role="admin">
      <AdminAffiliatesPage />
    </PortalGate>
  );
}
