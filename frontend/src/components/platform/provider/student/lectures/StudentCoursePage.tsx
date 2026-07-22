"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import { CoursePageLayout } from "@/components/platform/provider/student/lectures/CoursePageLayout";
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

function HeroPill({
  href,
  variant,
  children,
}: {
  href: string;
  variant: "solid" | "soft";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "font-sans inline-flex min-h-10 items-center gap-1.5 rounded-full px-5 text-sm font-medium tracking-[0.01em] transition",
        variant === "solid"
          ? "bg-[#DDE466] text-[#152744] hover:brightness-105"
          : "dashboard-pill-soft text-[color:var(--dash-text)]",
      )}
    >
      {children}
    </Link>
  );
}

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
      heroActions={
        <>
          <HeroPill href={`/student/lectures/${courseId}/lessons`} variant="solid">
            Start lessons
          </HeroPill>
          <HeroPill href={`/student/lectures/${courseId}/test-result`} variant="soft">
            Test results
          </HeroPill>
          <HeroPill href="/student/calculator" variant="soft">
            Calculator
          </HeroPill>
        </>
      }
    >
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {loading && !course ? (
        <div className="dashboard-surface rounded-2xl p-10 text-center">
          <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-[color:var(--dash-soft)]" />
          <p className="text-brand-body mt-3 text-[color:var(--dash-faint)]">Loading course…</p>
        </div>
      ) : null}

      {course ? (
        <div className="grid w-full items-start gap-4 lg:grid-cols-[1.9fr_1fr]">
          <div className="flex flex-col gap-4">
            <section className="dashboard-surface rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-sans text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)]">
                  Topics and sections
                </h2>
                <Link
                  href={`/student/lectures/${courseId}/lessons`}
                  className="text-brand-caption font-medium text-[color:var(--dash-accent)] hover:brightness-110"
                >
                  View all
                </Link>
              </div>

              {topicGroups.length === 0 ? (
                <p className="text-brand-body py-6 text-center text-[color:var(--dash-faint)]">
                  No topics available yet.
                </p>
              ) : (
                <div className="mt-4 space-y-2.5">
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
          </div>

          <div className="flex flex-col gap-4">
            <section className="dashboard-surface rounded-2xl p-5">
              <div className="space-y-1">
                <QuickLink
                  href={`/student/lectures/${courseId}/lessons`}
                  label="Open lessons"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                    </svg>
                  }
                />
                <QuickLink
                  href={`/student/lectures/${courseId}/test-result`}
                  label="Test results"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <path d="M9 11l3 3L22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                  }
                />
                <QuickLink
                  href="/student/calculator"
                  label="Calculator"
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
                      <rect x="4" y="2" width="16" height="20" rx="2" />
                      <path d="M8 6h8M8 10h8M8 14h2M12 14h2M16 14h2M8 18h2M12 18h2M16 18h2" />
                    </svg>
                  }
                />
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <Link
                  href={`/student/lectures/${courseId}/lessons`}
                  className="font-sans inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-4 text-sm font-medium text-[#152744] transition hover:brightness-105"
                >
                  Start lessons
                </Link>
                <Link
                  href={`/student/lectures/${courseId}/test-result`}
                  className="dashboard-pill-soft font-sans inline-flex min-h-10 items-center justify-center gap-1.5 rounded-full px-4 text-sm font-medium text-[color:var(--dash-text)] transition"
                >
                  Results
                </Link>
              </div>
            </section>

            <section className="dashboard-surface rounded-2xl p-5">
              <h2 className="font-sans text-lg font-semibold tracking-[0.005em] text-[color:var(--dash-text)]">
                Course stats
              </h2>
              <div className="mt-4 space-y-2.5">
                <StatRow label="Topics" value={course.topic_count} />
                <StatRow label="Sections" value={course.section_count} />
                <StatRow label="Lessons" value={course.lesson_count} />
              </div>
            </section>
          </div>
        </div>
      ) : null}
    </CoursePageLayout>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="dashboard-row flex items-center justify-between gap-3 rounded-xl px-3.5 py-3">
      <span className="font-sans text-sm font-medium text-[color:var(--dash-muted)]">{label}</span>
      <span className="font-sans shrink-0 text-sm font-semibold text-[color:var(--dash-accent)]">
        {value}
      </span>
    </div>
  );
}

function QuickLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href} className="dashboard-row group flex items-center gap-3 rounded-xl px-3 py-3 transition">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)] transition group-hover:bg-[#DDE466]/15 group-hover:text-[color:var(--dash-accent)]">
        {icon}
      </span>
      <span className="font-sans flex-1 text-sm font-medium text-[color:var(--dash-muted)]">{label}</span>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="shrink-0 text-[color:var(--dash-dim)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--dash-muted)]"
        aria-hidden
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
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
    <div className="overflow-hidden rounded-xl">
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "dashboard-row flex w-full items-center justify-between gap-3 rounded-xl px-3.5 py-3 text-left transition",
          expanded && "bg-[color:var(--dash-soft)]",
        )}
        aria-expanded={expanded}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
              expanded
                ? "bg-[#DDE466] text-[#152744]"
                : "bg-[#DDE466]/15 text-[color:var(--dash-accent)]",
            )}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <p className="font-sans truncate text-sm font-medium text-[color:var(--dash-text)]">
              {topic.l1_name}
            </p>
            <p className="text-brand-caption truncate text-[color:var(--dash-faint)]">
              {topic.section_count} sections · {topic.lesson_count} lessons
            </p>
          </div>
        </div>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className={cn(
            "shrink-0 text-[color:var(--dash-dim)] transition-transform duration-200",
            expanded && "rotate-180",
          )}
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {expanded ? (
        <div className="px-3.5 pb-3 pt-1">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-brand-caption text-[color:var(--dash-faint)]">
              {topic.sections.length} section{topic.sections.length === 1 ? "" : "s"}
            </p>
            <Link
              href={topicLessonsHref}
              className="text-brand-caption font-medium text-[color:var(--dash-accent)] hover:brightness-110"
            >
              View lessons
            </Link>
          </div>
          {topic.sections.length === 0 ? (
            <p className="text-brand-caption py-2 text-[color:var(--dash-faint)]">No sections yet.</p>
          ) : (
            <div className="space-y-1">
              {topic.sections.map((section) => (
                <SectionRow key={section.topic_id} courseId={courseId} section={section} />
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SectionRow({ courseId, section }: { courseId: string; section: SectionSummary }) {
  const href = `/student/lectures/${courseId}/lessons?topic_id=${encodeURIComponent(section.topic_id)}`;

  return (
    <Link
      href={href}
      className="dashboard-row group flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition"
    >
      <div className="min-w-0">
        <p className="font-sans truncate text-sm font-medium text-[color:var(--dash-text)]">
          {section.l2_name}
        </p>
        <p className="text-brand-caption text-[color:var(--dash-faint)]">
          {section.item_count} lesson{section.item_count === 1 ? "" : "s"}
        </p>
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        className="shrink-0 text-[color:var(--dash-dim)] transition group-hover:translate-x-0.5 group-hover:text-[color:var(--dash-muted)]"
        aria-hidden
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </Link>
  );
}
