"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { CourseOptionNav } from "@/components/platform/provider/student/lectures/CourseOptionNav";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCourse,
  type CourseSummary,
} from "@/lib/integrate/provider/student/lectures";

type StudentTestResultPageProps = {
  courseId: string;
};

export function StudentTestResultPage({ courseId }: StudentTestResultPageProps) {
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getCourse(courseId);
        setCourse(data.course);
      } catch (err) {
        setError(err instanceof ApiRequestError ? err.message : "Failed to load test result.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [courseId]);

  return (
    <PortalShell
      role="student"
      title={course ? `Test Result · ${course.title}` : "Test Result"}
      subtitle="Course progress and practice results."
      nav={studentNav}
    >
      <div className="grid gap-6">
        <Link
          href={`/student/lectures/${courseId}`}
          className="text-sm font-medium text-primary underline-offset-2 hover:underline"
        >
          ← Course overview
        </Link>

        <CourseOptionNav courseId={courseId} active="test-result" />

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        {loading ? (
          <div className="glass-panel rounded-3xl p-8 text-sm text-muted">Loading result…</div>
        ) : (
          <section className="glass-panel rounded-3xl p-6 md:p-8">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/35">
              Result summary
            </p>
            <h2 className="mt-2 font-sans text-2xl font-semibold text-primary">
              {course?.title ?? "Course"} progress
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              Test result tracking will connect to completed lesson quizzes. For now, students can
              review lessons and practice variants from the lesson detail pages.
            </p>

            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-2xl bg-primary/[0.04] p-4">
                <dt className="text-muted">Lessons available</dt>
                <dd className="mt-1 text-2xl font-semibold text-primary">
                  {course?.lesson_count ?? 0}
                </dd>
              </div>
              <div className="rounded-2xl bg-primary/[0.04] p-4">
                <dt className="text-muted">Sections</dt>
                <dd className="mt-1 text-2xl font-semibold text-primary">
                  {course?.section_count ?? 0}
                </dd>
              </div>
              <div className="rounded-2xl bg-primary/[0.04] p-4">
                <dt className="text-muted">Topics</dt>
                <dd className="mt-1 text-2xl font-semibold text-primary">
                  {course?.topic_count ?? 0}
                </dd>
              </div>
            </dl>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button href={`/student/lectures/${courseId}/lessons`} variant="primary" size="md">
                Continue Lessons
              </Button>
              <Button href="/student/calculator" variant="secondary" size="md">
                Open Calculator
              </Button>
            </div>
          </section>
        )}
      </div>
    </PortalShell>
  );
}
