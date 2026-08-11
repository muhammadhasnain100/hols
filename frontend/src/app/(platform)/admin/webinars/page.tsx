import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AdminWebinarsPage } from "@/components/platform/provider/admin/webinars/AdminWebinarsPage";

export default function AdminWebinarsRoute() {
  return (
    <PortalGate role="admin">
      <AdminWebinarsPage />
    </PortalGate>
  );
}
