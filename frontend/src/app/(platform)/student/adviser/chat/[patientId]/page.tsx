import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentPeptideAdviserChatPage } from "@/components/platform/provider/student/adviser";

type StudentAdviserChatRouteProps = {
  params: Promise<{ patientId: string }>;
};

export default async function StudentAdviserChatRoute({ params }: StudentAdviserChatRouteProps) {
  const { patientId } = await params;

  return (
    <PortalGate role="student">
      <StudentPeptideAdviserChatPage patientId={patientId} />
    </PortalGate>
  );
}
