import { PortalGate } from "@/components/platform/provider/PortalGate";
import { NotificationsPage } from "@/components/platform/provider/notifications/NotificationsPage";

export default function AffiliateNotificationsRoute() {
  return (
    <PortalGate role="affiliate">
      <NotificationsPage role="affiliate" />
    </PortalGate>
  );
}
