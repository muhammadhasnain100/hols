import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentWebinarDetailPage } from "@/components/platform/provider/student/webinars/StudentWebinarDetailPage";

type PageProps = {
  params: Promise<{ webinarId: string }>;
};

export default async function StudentWebinarDetailRoute({ params }: PageProps) {
  const { webinarId } = await params;
  return (
    <PortalGate role="student">
      <StudentWebinarDetailPage webinarId={webinarId} />
    </PortalGate>
  );
}
