import { PortalGate } from "@/components/platform/provider/PortalGate";
import { StudentLessonsPage } from "@/components/platform/provider/student/lectures";

type PageProps = {
  params: Promise<{ courseId: string }>;
  searchParams: Promise<{ topic_id?: string; l1_name?: string }>;
};

export default async function StudentLessonsRoute({ params, searchParams }: PageProps) {
  const { courseId } = await params;
  const query = await searchParams;
  const filterKey = `${courseId}:${query.topic_id ?? ""}:${query.l1_name ?? ""}`;
  return (
    <PortalGate role="student">
      <StudentLessonsPage
        key={filterKey}
        courseId={courseId}
        topicId={query.topic_id}
        l1Name={query.l1_name}
      />
    </PortalGate>
  );
}
