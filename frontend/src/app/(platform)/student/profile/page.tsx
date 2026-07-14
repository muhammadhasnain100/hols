import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentProfilePage } from "@/components/platform/provider/student/profile/StudentProfilePage";

export default function StudentProfileRoute() {
  return (
    <PortalGate role="student">
      <StudentProfilePage />
    </PortalGate>
  );
}
