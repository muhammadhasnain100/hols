import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentCardPage } from "@/components/platform/provider/student/payment/StudentCardPage";

export default function StudentCardRoute() {
  return (
    <PortalGate role="student">
      <StudentCardPage />
    </PortalGate>
  );
}
