import { PortalGate } from "@/components/platform/provider/PortalGate";
import { NotificationsPage } from "@/components/platform/provider/notifications/NotificationsPage";

export default function StudentNotificationsRoute() {
  return (
    <PortalGate role="student">
      <NotificationsPage role="student" />
    </PortalGate>
  );
}
