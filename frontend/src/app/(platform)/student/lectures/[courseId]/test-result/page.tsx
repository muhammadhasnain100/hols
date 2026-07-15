import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentTestResultPage } from "@/components/platform/provider/student/lectures";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function StudentCourseTestResultRoute({ params }: PageProps) {
  const { courseId } = await params;
  return (
    <PortalGate role="student">
      <StudentTestResultPage courseId={courseId} />
    </PortalGate>
  );
}
