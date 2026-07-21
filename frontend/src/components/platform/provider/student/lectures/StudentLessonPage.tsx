"use client";

import { StudentLessonsWorkspace } from "@/components/platform/provider/student/lectures/StudentLessonsWorkspace";

type StudentLessonPageProps = {
  courseId: string;
  lessonId: string;
  topicId?: string;
  l1Name?: string;
};

export function StudentLessonPage({ courseId, lessonId, topicId, l1Name }: StudentLessonPageProps) {
  return (
    <StudentLessonsWorkspace
      courseId={courseId}
      topicId={topicId}
      l1Name={l1Name}
      selectedLessonId={lessonId}
    />
  );
}
