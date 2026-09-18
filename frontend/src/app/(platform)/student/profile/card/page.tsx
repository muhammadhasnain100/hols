import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentSettingsPage } from "@/components/platform/provider/student/profile/StudentSettingsPage";

export default function StudentProfileCardRoute() {
  return (
    <PortalGate role="student">
      <StudentSettingsPage section="card" />
    </PortalGate>
  );
}
