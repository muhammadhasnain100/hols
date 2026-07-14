import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentLessonPage } from "@/components/platform/provider/student/lectures";

type PageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
};

export default async function StudentLessonRoute({ params }: PageProps) {
  const { courseId, lessonId } = await params;
  return (
    <PortalGate role="student">
      <StudentLessonPage courseId={courseId} lessonId={lessonId} />
    </PortalGate>
  );
}
