import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentPaymentPage } from "@/components/platform/provider/student/payment/StudentPaymentPage";

export default function StudentPaymentRoute() {
  return (
    <PortalGate role="student">
      <StudentPaymentPage />
    </PortalGate>
  );
}
