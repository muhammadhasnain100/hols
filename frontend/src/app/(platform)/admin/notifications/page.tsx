import { PortalGate } from "@/components/platform/provider/PortalGate";
import { NotificationsPage } from "@/components/platform/provider/notifications/NotificationsPage";

export default function AdminNotificationsRoute() {
  return (
    <PortalGate role="admin">
      <NotificationsPage role="admin" />
    </PortalGate>
  );
}
