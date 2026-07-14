import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentLessonsPage } from "@/components/platform/provider/student/lectures";

type PageProps = {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ topic_id?: string }>;
};

export default async function StudentLessonsRoute({ params, searchParams }: PageProps) {
  const { courseId } = await params;
  const query = await searchParams;
  return (
    <PortalGate role="student">
      <StudentLessonsPage courseId={courseId} topicId={query.topic_id} />
    </PortalGate>
  );
}
