import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentLessonPage } from "@/components/platform/provider/student/lectures";

type PageProps = {
  params: Promise<{ courseId: string; lessonId: string }>;
  searchParams: Promise<{ topic_id?: string; l1_name?: string }>;
};

export default async function StudentLessonRoute({ params, searchParams }: PageProps) {
  const { courseId, lessonId } = await params;
  const query = await searchParams;
  return (
    <PortalGate role="student">
      <StudentLessonPage
        courseId={courseId}
        lessonId={lessonId}
        topicId={query.topic_id}
        l1Name={query.l1_name}
      />
    </PortalGate>
  );
}
