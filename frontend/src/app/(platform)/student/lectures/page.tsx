import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentLecturesPage } from "@/components/platform/provider/student/lectures";

export default function StudentLecturesRoute() {
  return (
    <PortalGate role="student">
      <StudentLecturesPage />
    </PortalGate>
  );
}
