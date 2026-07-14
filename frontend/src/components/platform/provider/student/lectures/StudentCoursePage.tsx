"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalShell } from "@/components/platform/provider/PortalShell";
import { studentNav } from "@/components/platform/provider/student/studentNav";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCourse,
  listSections,
  listTopics,
  type CourseSummary,
  type PaginationMeta,
  type SectionSummary,
  type TopicSummary,
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
  const [topicPage, setTopicPage] = useState(1);
  const [sectionPage, setSectionPage] = useState(1);
  const [topicPagination, setTopicPagination] = useState<PaginationMeta | null>(null);
  const [sectionPagination, setSectionPagination] = useState<PaginationMeta | null>(null);
  const [selectedL1, setSelectedL1] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [courseRes, topicsRes, sectionsRes] = await Promise.all([
        getCourse(courseId),
        listTopics(courseId, { page: topicPage, limit: 20 }),
        listSections(courseId, {
          page: sectionPage,
          limit: 20,
          l1_name: selectedL1 ?? undefined,
        }),
      ]);
      setCourse(courseRes.course);
      setTopics(topicsRes.items);
      setTopicPagination(topicsRes.pagination);
      setSections(sectionsRes.items);
      setSectionPagination(sectionsRes.pagination);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : "Failed to load course.");
    } finally {
      setLoading(false);
    }
  }, [courseId, topicPage, sectionPage, selectedL1]);

  useEffect(() => {
    void load();
  }, [load]);

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
          <Button href={`/student/lectures/${courseId}/lessons`} variant="primary" size="md">
            View all lessons
          </Button>
        </div>

        {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

        {loading && !course ? (
          <div className="glass-panel rounded-3xl p-8 text-sm text-muted">Loading course…</div>
        ) : course ? (
          <div className="glass-panel rounded-3xl p-6">
            <p className="text-sm leading-relaxed text-muted">{course.description}</p>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted">Topics</dt>
                <dd className="mt-1 font-semibold text-primary">{course.topic_count}</dd>
              </div>
              <div>
                <dt className="text-muted">Sections</dt>
                <dd className="mt-1 font-semibold text-primary">{course.section_count}</dd>
              </div>
              <div>
                <dt className="text-muted">Lessons</dt>
                <dd className="mt-1 font-semibold text-primary">{course.lesson_count}</dd>
              </div>
            </dl>
          </div>
        ) : null}

        <section className="glass-panel rounded-3xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-sans text-lg font-semibold text-primary">Topics</h2>
            {selectedL1 ? (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedL1(null);
                  setSectionPage(1);
                }}
              >
                Clear topic filter
              </Button>
            ) : null}
          </div>
          <div className="mt-4 grid gap-3">
            {topics.map((topic) => (
              <button
                key={`${topic.topic_key}-${topic.order}`}
                type="button"
                onClick={() => {
                  setSelectedL1(topic.l1_name);
                  setSectionPage(1);
                }}
                className={`rounded-2xl border px-4 py-3 text-left transition ${
                  selectedL1 === topic.l1_name
                    ? "border-primary/40 bg-primary/5"
                    : "border-border/40 bg-white/50 hover:bg-white/80"
                }`}
              >
                <p className="font-medium text-primary">{topic.l1_name}</p>
                <p className="mt-1 text-xs text-muted">
                  {topic.section_count} sections · {topic.lesson_count} lessons
                </p>
              </button>
            ))}
          </div>
          {topicPagination && topicPagination.total_pages > 1 ? (
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!topicPagination.has_previous}
                onClick={() => setTopicPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!topicPagination.has_next}
                onClick={() => setTopicPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </section>

        <section className="glass-panel rounded-3xl p-6">
          <h2 className="font-sans text-lg font-semibold text-primary">
            Sections{selectedL1 ? ` · ${selectedL1}` : ""}
          </h2>
          <div className="mt-4 grid gap-3">
            {sections.map((section) => (
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
            {!loading && sections.length === 0 ? (
              <p className="text-sm text-muted">No sections found.</p>
            ) : null}
          </div>
          {sectionPagination && sectionPagination.total_pages > 1 ? (
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!sectionPagination.has_previous}
                onClick={() => setSectionPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!sectionPagination.has_next}
                onClick={() => setSectionPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </section>
      </div>
    </PortalShell>
  );
}
