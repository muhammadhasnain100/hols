import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentPortal } from "@/components/platform/provider/student";

export default function StudentPage() {
  return (
    <PortalGate role="student">
      <StudentPortal />
    </PortalGate>
  );
}
