import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentOrdersPage } from "@/components/platform/provider/student/payment/StudentOrdersPage";

export default function StudentOrdersRoute() {
  return (
    <PortalGate role="student">
      <StudentOrdersPage />
    </PortalGate>
  );
}
