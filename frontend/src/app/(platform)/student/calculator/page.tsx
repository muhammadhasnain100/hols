import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentPeptideCalculatorPage } from "@/components/platform/provider/student/calculator";

export default function StudentCalculatorRoute() {
  return (
    <PortalGate role="student">
      <StudentPeptideCalculatorPage />
    </PortalGate>
  );
}
