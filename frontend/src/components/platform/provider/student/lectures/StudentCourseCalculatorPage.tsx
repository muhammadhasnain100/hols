"use client";

import { useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { CoursePageSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { StudentPeptideCalculatorPage } from "@/components/platform/provider/student/calculator/StudentPeptideCalculatorPage";
import { CoursePageLayout } from "@/components/platform/provider/student/lectures/CoursePageLayout";
import { ApiRequestError } from "@/lib/integrate/client";
import { getCourse, type CourseSummary } from "@/lib/integrate/provider/student/lectures";

type StudentCourseCalculatorPageProps = {
  courseId: string;
};

export function StudentCourseCalculatorPage({ courseId }: StudentCourseCalculatorPageProps) {
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCourse() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCourse(courseId);
        setCourse(data.course);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Failed to load course.");
      } finally {
        setLoading(false);
      }
    }
    void loadCourse();
  }, [courseId]);

  return (
    <CoursePageLayout
      title={course ? `Calculator · ${course.title}` : "Calculator"}
      description="Step-by-step reconstitution and dosing helper while you study this course."
      courseId={courseId}
      courseNavActive="calculator"
      hideHero
    >
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}
      {loading && !course ? <CoursePageSkeleton /> : null}
      {!loading || course ? (
        <StudentPeptideCalculatorPage embedded key={`course-calculator-${courseId}`} />
      ) : null}
    </CoursePageLayout>
  );
}
