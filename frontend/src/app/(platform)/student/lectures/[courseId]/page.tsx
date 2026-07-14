import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentCoursePage } from "@/components/platform/provider/student/lectures";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function StudentCourseRoute({ params }: PageProps) {
  const { courseId } = await params;
  return (
    <PortalGate role="student">
      <StudentCoursePage courseId={courseId} />
    </PortalGate>
  );
}
