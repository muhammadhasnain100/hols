"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { CourseOptionNav } from "@/components/platform/provider/student/lectures/CourseOptionNav";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCourseBundle,
  type CourseSummary,
  type SectionSummary,
  type TopicSummary,
  type LessonDetail,
} from "@/lib/integrate/provider/student/lectures";

type StudentCoursePageProps = {
  courseId: string;
};

export function StudentCoursePage({ courseId }: StudentCoursePageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [lessons, setLessons] = useState<LessonDetail[]>([]);
  const [selectedL1, setSelectedL1] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await getCourseBundle(courseId);
      setCourse(bundle.course);
      setTopics(bundle.topics);
      setSections(bundle.sections);
      setLessons(bundle.lessons);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load course.");
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  const filteredSections = selectedL1
    ? sections.filter((section) => section.l1_name === selectedL1)
    : sections;

  return (
    <PortalShell
      role="student"
      title={course?.title ?? "Course"}
      subtitle="Topics, sections, and lessons for this course."
      nav={studentNav}
    >
      <div className="grid gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href="/student/lectures"
            className="text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            ← All lectures
          </Link>
        </div>

        <CourseOptionNav courseId={courseId} active="overview" />

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        {loading && !course ? (
          <div className="glass-panel rounded-3xl p-8 text-sm text-muted">Loading course…</div>
        ) : course ? (
          <section className="glass-panel rounded-3xl p-6 md:p-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/35">
                  Course overview
                </p>
                <h2 className="mt-2 font-sans text-2xl font-semibold text-primary">
                  {course.title}
                </h2>
                <p className="mt-4 text-sm leading-7 text-muted">
                  {course.description || "Course overview and lesson structure."}
                </p>
              </div>

              <Button href={`/student/lectures/${courseId}/lessons`} variant="primary" size="md">
                Start Lessons
              </Button>
            </div>

            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-2xl bg-primary/[0.04] p-4">
                <dt className="text-muted">Topics</dt>
                <dd className="mt-1 text-2xl font-semibold text-primary">{course.topic_count}</dd>
              </div>
              <div className="rounded-2xl bg-primary/[0.04] p-4">
                <dt className="text-muted">Sections</dt>
                <dd className="mt-1 text-2xl font-semibold text-primary">
                  {course.section_count}
                </dd>
              </div>
              <div className="rounded-2xl bg-primary/[0.04] p-4">
                <dt className="text-muted">Lessons</dt>
                <dd className="mt-1 text-2xl font-semibold text-primary">{course.lesson_count}</dd>
              </div>
            </dl>
          </section>
        ) : null}

        <section className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/35">
                Browse by topic
              </p>
              <h2 className="mt-1 font-sans text-lg font-semibold text-primary">Course topics</h2>
            </div>
            {selectedL1 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedL1(null);
                }}
              >
                Clear topic filter
              </Button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3">
            {topics.map((topic) => (
              <div
                key={`${topic.topic_key}-${topic.order}`}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  selectedL1 === topic.l1_name
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/40 bg-white/50 hover:bg-white/80"
                }`}
              >
                <button
                  type="button"
                  onClick={() => {
                    const isOpen = selectedL1 === topic.l1_name;
                    setSelectedL1(isOpen ? null : topic.l1_name);
                  }}
                  className="flex w-full items-center justify-between gap-4 text-left"
                  aria-expanded={selectedL1 === topic.l1_name}
                >
                  <span>
                    <span className="font-medium text-primary">{topic.l1_name}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {topic.section_count} sections · {topic.lesson_count} lessons total
                    </span>
                  </span>
                  <span className="shrink-0 text-xs font-semibold text-primary">
                    {selectedL1 === topic.l1_name ? "Close" : "Open"}
                  </span>
                </button>

                {selectedL1 === topic.l1_name ? (
                  <div className="mt-4 rounded-2xl bg-white/65 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-primary">
                        {topic.lesson_count} lessons in this topic
                      </p>
                      <Button
                        href={`/student/lectures/${courseId}/lessons?l1_name=${encodeURIComponent(topic.l1_name)}`}
                        variant="secondary"
                        size="sm"
                      >
                        View topic lessons
                      </Button>
                    </div>

                    {lessons.filter((lesson) => lesson.l1_name === topic.l1_name).length > 0 ? (
                      <div className="mt-3 grid gap-2">
                        {lessons
                          .filter((lesson) => lesson.l1_name === topic.l1_name)
                          .map((lesson) => (
                            <div
                              key={lesson.lesson_id}
                              className="flex flex-col gap-3 rounded-xl border border-black/[0.05] bg-white px-3 py-3 sm:flex-row sm:items-center sm:justify-between"
                            >
                              <div>
                                <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">
                                  Lesson {lesson.order}
                                </p>
                                <h3 className="mt-1 text-sm font-semibold text-primary">
                                  {lesson.title}
                                </h3>
                              </div>
                              <Button
                                href={`/student/lectures/${courseId}/lessons/${lesson.lesson_id}`}
                                variant="primary"
                                size="sm"
                                className="sm:shrink-0"
                              >
                                View Lesson
                              </Button>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-muted">No lessons found in this topic.</p>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/35">
                Lesson groups
              </p>
              <h2 className="mt-1 font-sans text-lg font-semibold text-primary">
                Sections{selectedL1 ? ` · ${selectedL1}` : ""}
              </h2>
            </div>
            <Button href={`/student/lectures/${courseId}/lessons`} variant="secondary" size="sm">
              View all lessons
            </Button>
          </div>
          <div className="mt-4 grid gap-3">
            {filteredSections.map((section) => (
              <Link
                key={section.topic_id}
                href={`/student/lectures/${courseId}/lessons?topic_id=${encodeURIComponent(section.topic_id)}`}
                className="rounded-2xl border border-border/40 bg-white/50 px-4 py-3 transition hover:bg-white/80"
              >
                <p className="font-medium text-primary">{section.l2_name}</p>
                <p className="mt-1 text-xs text-muted">
                  {section.l1_name} · {section.item_count} lessons
                </p>
              </Link>
            ))}
            {!loading && filteredSections.length === 0 ? (
              <p className="text-sm text-muted">No sections found.</p>
            ) : null}
          </div>
        </section>
      </div>
    </PortalShell>
  );
}
