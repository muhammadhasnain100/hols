"use client";

import { StudentLessonsWorkspace } from "@/components/platform/provider/student/lectures/StudentLessonsWorkspace";

type StudentLessonsPageProps = {
  courseId: string;
  topicId?: string;
  l1Name?: string;
};

export function StudentLessonsPage({ courseId, topicId, l1Name }: StudentLessonsPageProps) {
  return <StudentLessonsWorkspace courseId={courseId} topicId={topicId} l1Name={l1Name} />;
}
