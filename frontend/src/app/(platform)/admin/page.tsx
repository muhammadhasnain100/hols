import { PortalGate } from "@/components/platform/provider/PortalGate";
import { AdminPortal } from "@/components/platform/provider/admin";

export default function AdminPage() {
  return (
    <PortalGate role="admin">
      <AdminPortal />
    </PortalGate>
  );
}
