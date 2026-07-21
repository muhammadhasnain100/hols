import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentPeptideAdviserHubPage } from "@/components/platform/provider/student/adviser";

export default function StudentAdviserRoute() {
  return (
    <PortalGate role="student">
      <StudentPeptideAdviserHubPage />
    </PortalGate>
  );
}
