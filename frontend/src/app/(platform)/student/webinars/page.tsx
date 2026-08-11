import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentWebinarsPage } from "@/components/platform/provider/student/webinars/StudentWebinarsPage";

export default function StudentWebinarsRoute() {
  return (
    <PortalGate role="student">
      <StudentWebinarsPage />
    </PortalGate>
  );
}
