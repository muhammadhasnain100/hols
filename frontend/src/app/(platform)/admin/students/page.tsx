import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AdminStudentsPage } from "@/components/platform/provider/admin/users/AdminStudentsPage";

export default function AdminStudentsRoute() {
  return (
    <PortalGate role="admin">
      <AdminStudentsPage />
    </PortalGate>
  );
}
