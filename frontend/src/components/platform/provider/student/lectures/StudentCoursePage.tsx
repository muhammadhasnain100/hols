"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { PortalStatCard } from "@/components/platform/provider/PortalStatCard";
import { CoursePageLayout } from "@/components/platform/provider/student/lectures/CoursePageLayout";
import { Button } from "@/components/ui/Button";
import { ApiRequestError } from "@/lib/integrate/client";
import {
  getCourseBundle,
  type CourseSummary,
  type SectionSummary,
  type TopicSummary,
} from "@/lib/integrate/provider/student/lectures";
import { cn } from "@/lib/utils";

type StudentCoursePageProps = {
  courseId: string;
};

type TopicGroup = TopicSummary & {
  sections: SectionSummary[];
};

export function StudentCoursePage({ courseId }: StudentCoursePageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const bundle = await getCourseBundle(courseId);
      setCourse(bundle.course);
      setTopics(bundle.topics);
      setSections(bundle.sections);
      setExpandedTopic((current) => current ?? bundle.topics[0]?.l1_name ?? null);
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

  const topicGroups = useMemo<TopicGroup[]>(() => {
    return [...topics]
      .sort((a, b) => a.order - b.order)
      .map((topic) => ({
        ...topic,
        sections: sections
          .filter((section) => section.l1_name === topic.l1_name)
          .sort((a, b) => a.order - b.order),
      }));
  }, [sections, topics]);

  const fullDescription =
    course?.description?.trim() ||
    "Explore topics and sections below, then start lessons when you are ready.";

  const heroDescription = course
    ? `${course.topic_count} topics · ${course.section_count} sections · ${course.lesson_count} lessons`
    : "Browse topics, sections, and lessons.";

  return (
    <CoursePageLayout
      title={course?.title ?? "Course"}
      description={heroDescription}
      courseId={courseId}
      courseNavActive="overview"
      backHref="/student/lectures"
      backLabel="All lectures"
    >
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {loading && !course ? (
        <div className="rounded-2xl bg-white p-10 text-center shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
          <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
          <p className="mt-3 text-[13px] text-primary/45">Loading course…</p>
        </div>
      ) : null}

      {course ? (
        <>
          <section className="rounded-2xl bg-white p-5 shadow-[0_1px_3px_rgba(21,39,68,0.06)] md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary/40">
                  About this course
                </p>
                <h2 className="mt-1 text-lg font-semibold tracking-tight text-primary md:text-xl">
                  {course.title}
                </h2>
                <p className="mt-3 max-w-3xl text-[13px] leading-relaxed text-primary/45">{fullDescription}</p>
              </div>

              <Button
                href={`/student/lectures/${courseId}/lessons`}
                variant="primary"
                size="md"
                className="shrink-0"
              >
                Start lessons
              </Button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <PortalStatCard
                label="Topics"
                value={String(course.topic_count)}
                hint="Main subject areas"
                className="shadow-none"
              />
              <PortalStatCard
                label="Sections"
                value={String(course.section_count)}
                hint="Lesson groups within topics"
                className="shadow-none"
              />
              <PortalStatCard
                label="Lessons"
                value={String(course.lesson_count)}
                hint="Total lessons available"
                className="shadow-none"
              />
            </div>
          </section>

          <section>
            <p className="text-[11px] font-medium uppercase tracking-[0.12em] text-primary/40">
              Course structure
            </p>
            <h2 className="mt-1 text-[15px] font-semibold text-primary">Topics and sections</h2>
            <p className="mt-1 max-w-2xl text-[13px] text-primary/45">
              Each topic contains sections. Open a topic to see its sections, then jump straight into
              the lessons you need.
            </p>

            {topicGroups.length === 0 ? (
              <div className="mt-5 rounded-2xl bg-white p-8 text-center shadow-[0_1px_3px_rgba(21,39,68,0.06)]">
                <p className="text-[13px] text-primary/45">No topics available for this course yet.</p>
              </div>
            ) : (
              <div className="mt-5 grid gap-3">
                {topicGroups.map((topic, index) => (
                  <TopicCard
                    key={`${topic.topic_key}-${topic.order}`}
                    courseId={courseId}
                    topic={topic}
                    index={index}
                    expanded={expandedTopic === topic.l1_name}
                    onToggle={() =>
                      setExpandedTopic((current) =>
                        current === topic.l1_name ? null : topic.l1_name,
                      )
                    }
                  />
                ))}
              </div>
            )}
          </section>
        </>
      ) : null}
    </CoursePageLayout>
  );
}

function TopicCard({
  courseId,
  topic,
  index,
  expanded,
  onToggle,
}: {
  courseId: string;
  topic: TopicGroup;
  index: number;
  expanded: boolean;
  onToggle: () => void;
}) {
  const topicLessonsHref = `/student/lectures/${courseId}/lessons?l1_name=${encodeURIComponent(topic.l1_name)}`;

  return (
    <article
      className={cn(
        "overflow-hidden rounded-2xl border transition-all duration-200",
        expanded
          ? "border-[#8DC3E1]/55 bg-[#eef6fb] shadow-[0_6px_22px_rgba(21,39,68,0.08)]"
          : "border-transparent bg-white shadow-[0_1px_3px_rgba(21,39,68,0.06)] hover:shadow-[0_4px_14px_rgba(21,39,68,0.08)]",
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "flex w-full items-center gap-4 p-5 text-left md:p-6",
          expanded && "border-b border-[#8DC3E1]/35 bg-white/55",
        )}
        aria-expanded={expanded}
      >
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-semibold transition-colors",
            expanded ? "bg-primary text-white shadow-[0_2px_8px_rgba(21,39,68,0.15)]" : "bg-primary/[0.06] text-primary",
          )}
        >
          {index + 1}
        </span>

        <span className="min-w-0 flex-1">
          <span className={cn("block text-[15px] font-semibold", expanded ? "text-primary" : "text-primary")}>
            {topic.l1_name}
          </span>
          <span className="mt-2 flex flex-wrap gap-2">
            <TopicBadge active={expanded}>{topic.section_count} sections</TopicBadge>
            <TopicBadge active={expanded}>{topic.lesson_count} lessons</TopicBadge>
          </span>
        </span>

        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-medium transition",
            expanded
              ? "bg-primary text-white"
              : "bg-primary/[0.06] text-primary/70 hover:bg-primary/[0.1] hover:text-primary",
          )}
        >
          {expanded ? "Hide" : "Show"}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className={cn("transition-transform duration-200", expanded && "rotate-180")}
            aria-hidden
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      {expanded ? (
        <div className="bg-white/45 px-5 pb-5 pt-4 md:px-6 md:pb-6">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] font-medium text-primary/55">
              {topic.sections.length} section{topic.sections.length === 1 ? "" : "s"} in this topic
            </p>
            <Button href={topicLessonsHref} variant="secondary" size="sm">
              View all topic lessons
            </Button>
          </div>

          {topic.sections.length === 0 ? (
            <p className="rounded-xl border border-[#8DC3E1]/25 bg-white/70 px-4 py-3 text-[13px] text-primary/45">
              No sections listed for this topic yet.
            </p>
          ) : (
            <div className="grid gap-2">
              {topic.sections.map((section) => (
                <SectionRow key={section.topic_id} courseId={courseId} section={section} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </article>
  );
}

function SectionRow({ courseId, section }: { courseId: string; section: SectionSummary }) {
  const href = `/student/lectures/${courseId}/lessons?topic_id=${encodeURIComponent(section.topic_id)}`;

  return (
    <Link
      href={href}
      className="group flex items-center justify-between gap-4 rounded-xl border border-white/80 bg-white px-4 py-3.5 shadow-[0_1px_3px_rgba(21,39,68,0.04)] transition hover:border-[#8DC3E1]/40 hover:bg-[#f8fcfe] hover:shadow-[0_3px_12px_rgba(21,39,68,0.06)]"
    >
      <span className="min-w-0 flex-1">
        <span className="line-clamp-2 text-[13px] font-semibold text-primary" title={section.l2_name}>
          {section.l2_name}
        </span>
        <span className="mt-0.5 block text-[12px] text-primary/45">
          Section {section.order} · {section.item_count} lesson{section.item_count === 1 ? "" : "s"}
        </span>
      </span>

      <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/[0.06] px-2.5 py-1 text-[12px] font-medium text-primary/60 transition group-hover:bg-accent group-hover:text-primary">
        Open
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="m9 18 6-6-6-6" />
        </svg>
      </span>
    </Link>
  );
}

function TopicBadge({ children, active = false }: { children: React.ReactNode; active?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2.5 py-1 text-[11px] font-medium",
        active ? "bg-[#8DC3E1]/25 text-primary" : "bg-primary/[0.06] text-primary/65",
      )}
    >
      {children}
    </span>
  );
}
