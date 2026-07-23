import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentCourseCalculatorPage } from "@/components/platform/provider/student/lectures";

type PageProps = {
  params: Promise<{ courseId: string }>;
};

export default async function StudentCourseCalculatorRoute({ params }: PageProps) {
  const { courseId } = await params;
  return (
    <PortalGate role="student">
      <StudentCourseCalculatorPage courseId={courseId} />
    </PortalGate>
  );
}
