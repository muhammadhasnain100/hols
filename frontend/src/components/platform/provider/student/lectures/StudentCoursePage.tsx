"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { AuthAlert } from "@/components/platform/auth/AuthAlert";
import {
  CoursePageLayout,
} from "@/components/platform/provider/student/lectures/CoursePageLayout";
import { CoursePageSkeleton } from "@/components/platform/provider/student/DashboardSkeletons";
import { ApiRequestError } from "@/lib/integrate/client";
import { gsap, registerGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
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

function romanChapter(index: number) {
  const numerals = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"];
  return numerals[index] ?? String(index + 1).padStart(2, "0");
}

export function StudentCoursePage({ courseId }: StudentCoursePageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [course, setCourse] = useState<CourseSummary | null>(null);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [sections, setSections] = useState<SectionSummary[]>([]);
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const stageRef = useRef<HTMLDivElement>(null);

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

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !stageRef.current || !course) return;

      const cover = stageRef.current.querySelector("[data-book-cover]");
      const toc = stageRef.current.querySelector("[data-book-toc]");
      const rows = stageRef.current.querySelectorAll("[data-toc-row]");

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      if (cover) {
        tl.fromTo(
          cover,
          { opacity: 0, y: 28, rotate: -1.5 },
          { opacity: 1, y: 0, rotate: 0, duration: 0.7 },
          0,
        );
      }
      if (toc) {
        tl.fromTo(toc, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.55 }, 0.12);
      }
      if (rows.length) {
        tl.fromTo(
          rows,
          { opacity: 0, x: -12 },
          { opacity: 1, x: 0, duration: 0.35, stagger: 0.05 },
          0.28,
        );
      }
    },
    { dependencies: [course?.course_id, topicGroups.length], scope: stageRef },
  );

  return (
    <CoursePageLayout
      title={course?.title ?? "Course"}
      description=""
      courseId={courseId}
      courseNavActive="overview"
      backHref="/student/lectures"
      backLabel="All lectures"
      hideHero
    >
      {error ? <AuthAlert variant="error">{error}</AuthAlert> : null}

      {loading && !course ? <CoursePageSkeleton /> : null}

      {course ? (
        <div
          ref={stageRef}
          className="grid w-full min-w-0 items-start gap-3 sm:gap-4 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.2fr)] xl:gap-5"
          style={{ perspective: "1500px" }}
        >
          <BookCover course={course} courseId={courseId} />

          <TableOfContents
            courseId={courseId}
            topicGroups={topicGroups}
            expandedTopic={expandedTopic}
            onToggle={(name) =>
              setExpandedTopic((current) => (current === name ? null : name))
            }
          />
        </div>
      ) : null}
    </CoursePageLayout>
  );
}

function AnimatedStat({ value, label }: { value: number; label: string }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.textContent = String(value);
      return;
    }
    registerGsap();
    const state = { n: 0 };
    const tween = gsap.to(state, {
      n: value,
      duration: 1.1,
      delay: 0.35,
      ease: "power2.out",
      onUpdate: () => {
        el.textContent = String(Math.round(state.n));
      },
    });
    return () => {
      tween.kill();
    };
  }, [value]);

  return (
    <span>
      <strong ref={ref} className="font-semibold text-[color:var(--cover-text)]">
        0
      </strong>{" "}
      {label}
    </span>
  );
}

function BookCover({
  course,
  courseId,
}: {
  course: CourseSummary;
  courseId: string;
}) {
  const calculatorHref = `/student/lectures/${courseId}/calculator`;
  const coverRef = useRef<HTMLElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = coverRef.current;
    if (!el || prefersReducedMotion()) return;
    registerGsap();

    const rotX = gsap.quickTo(el, "rotationX", { duration: 0.6, ease: "power3.out" });
    const rotY = gsap.quickTo(el, "rotationY", { duration: 0.6, ease: "power3.out" });

    const handleMove = (event: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const px = (event.clientX - rect.left) / rect.width - 0.5;
      const py = (event.clientY - rect.top) / rect.height - 0.5;
      rotY(px * 9);
      rotX(-py * 9);
      const sheen = sheenRef.current;
      if (sheen) {
        sheen.style.setProperty("--mx", `${(px + 0.5) * 100}%`);
        sheen.style.setProperty("--my", `${(py + 0.5) * 100}%`);
      }
    };

    const handleLeave = () => {
      rotX(0);
      rotY(0);
    };

    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseleave", handleLeave);
    return () => {
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseleave", handleLeave);
    };
  }, []);

  return (
    <section
      ref={coverRef}
      data-book-cover
      className="course-book-cover course-book-cover-3d relative min-w-0 overflow-hidden rounded-2xl"
      aria-label="Course cover"
    >
      <div className="course-book-cover-glow pointer-events-none absolute inset-0" aria-hidden />
      <div ref={sheenRef} className="course-book-cover-sheen pointer-events-none absolute inset-0 z-[2]" aria-hidden />
      <div className="course-book-cover-shine pointer-events-none absolute inset-0 z-[2]" aria-hidden />
      <div className="course-book-cover-grain pointer-events-none absolute inset-0" aria-hidden />
      <div className="relative flex min-h-[18rem] flex-col justify-between p-3.5 sm:min-h-[28rem] sm:p-7 md:p-8">
        <div className="flex items-start justify-between gap-2 pl-2.5 sm:gap-3 sm:pl-4">
          <div className="min-w-0">
            <p className="text-brand-caption font-semibold uppercase tracking-[0.16em] text-[color:var(--cover-faint)]">
              HOLS Library
            </p>
            <p className="mt-1.5 text-brand-caption font-medium tracking-[0.04em] text-[color:var(--cover-accent)] sm:mt-2">
              {course.section || "Course volume"}
            </p>
          </div>
          <span className="course-book-seal flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-full border border-[color:var(--cover-border)] bg-[color:var(--cover-surface)] text-[8px] font-bold uppercase leading-tight tracking-[0.14em] text-[color:var(--cover-text)] backdrop-blur-sm sm:h-14 sm:w-14 sm:text-[9px]">
            <span>HOLS</span>
            <span className="mt-0.5 text-[7px] font-medium tracking-[0.08em] text-[color:var(--cover-faint)] sm:text-[8px]">Vol.</span>
          </span>
        </div>

        <div className="my-5 pl-2.5 sm:my-11 sm:pl-4">
          <p className="text-brand-caption mb-2.5 font-medium uppercase tracking-[0.18em] text-[color:var(--cover-faint)] sm:mb-3">
            Front cover
          </p>
          <div className="course-book-rule mb-3 h-px w-16 bg-[color:var(--cover-rule)] sm:mb-4 sm:w-20" />
          <h1 className="font-sans max-w-[18ch] text-[1.5rem] font-bold leading-[1.1] tracking-[0.01em] text-[color:var(--cover-text)] [overflow-wrap:anywhere] sm:max-w-[15ch] sm:text-4xl sm:leading-[1.04] md:text-[2.85rem]">
            {course.title}
          </h1>
          {course.description ? (
            <p className="text-brand-body mt-3 max-w-md text-sm leading-relaxed text-[color:var(--cover-muted)] sm:mt-4 sm:text-base">
              {course.description}
            </p>
          ) : (
            <p className="text-brand-body mt-3 max-w-md text-sm leading-relaxed text-[color:var(--cover-muted)] sm:mt-4 sm:text-base">
              Open this volume to explore chapters, sections, and guided lessons.
            </p>
          )}
        </div>

        <div className="pl-2.5 sm:pl-4">
          <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-[color:var(--cover-border)] pt-3 text-brand-caption text-[color:var(--cover-faint)] sm:mb-5 sm:gap-x-6 sm:pt-4">
            <AnimatedStat value={course.topic_count} label="chapters" />
            <AnimatedStat value={course.section_count} label="sections" />
            <AnimatedStat value={course.lesson_count} label="pages" />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Link
              href={`/student/lectures/${courseId}/lessons`}
              className="course-cover-cta font-sans col-span-2 inline-flex min-h-11 items-center justify-center gap-1.5 rounded-full bg-[#DDE466] px-4 text-sm font-medium text-[#152744] hover:brightness-105 sm:col-span-1"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="M2 6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v14a2 2 0 0 0-2-2H2z" />
                <path d="M22 6a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v14a2 2 0 0 1 2-2h6z" />
              </svg>
              Open book
            </Link>
            <Link
              href={`/student/lectures/${courseId}/test-result`}
              className="course-cover-cta font-sans inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--cover-border)] bg-[color:var(--cover-surface)] px-3 text-sm font-medium text-[color:var(--cover-text)] backdrop-blur-sm hover:bg-[color:var(--cover-surface-hover)] sm:px-4"
            >
              Results
            </Link>
            <Link
              href={calculatorHref}
              className="course-cover-cta font-sans inline-flex min-h-11 items-center justify-center rounded-full border border-[color:var(--cover-border)] bg-[color:var(--cover-surface)] px-3 text-sm font-medium text-[color:var(--cover-text)] backdrop-blur-sm hover:bg-[color:var(--cover-surface-hover)] sm:px-4"
            >
              Calculator
            </Link>
          </div>
        </div>
      </div>

      <div className="course-book-spine pointer-events-none absolute inset-y-0 left-0 w-3.5 sm:w-4" aria-hidden />
      <div className="course-book-edge pointer-events-none absolute inset-y-3 right-0 w-2 rounded-l-sm opacity-70 sm:inset-y-4" aria-hidden />
    </section>
  );
}

function TableOfContents({
  courseId,
  topicGroups,
  expandedTopic,
  onToggle,
}: {
  courseId: string;
  topicGroups: TopicGroup[];
  expandedTopic: string | null;
  onToggle: (name: string) => void;
}) {
  return (
    <section
      data-book-toc
      className="course-book-toc relative min-w-0 overflow-hidden rounded-2xl p-3.5 sm:p-5 md:p-6"
    >
      <div className="course-book-toc-gutter pointer-events-none absolute inset-y-0 left-0 w-1.5" aria-hidden />
      <div className="flex flex-col gap-3 border-b border-[color:var(--dash-surface-border)] pb-4 pl-1 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-2 sm:pl-2">
        <div className="min-w-0">
          <p className="text-brand-caption font-semibold uppercase tracking-[0.14em] text-[color:var(--dash-faint)]">
            Inside this volume
          </p>
          <h2 className="font-sans mt-1 text-lg font-bold tracking-[0.01em] text-[color:var(--dash-text)] sm:text-2xl">
            Table of contents
          </h2>
          <p className="text-brand-caption mt-1.5 text-[color:var(--dash-muted)]">
            Expand a chapter, then open a section to begin reading.
          </p>
        </div>
        <Link
          href={`/student/lectures/${courseId}/lessons`}
          className="font-sans inline-flex min-h-9 w-full shrink-0 items-center justify-center rounded-full bg-[#DDE466] px-4 text-sm font-medium text-[#152744] transition hover:brightness-105 sm:min-h-9 sm:w-auto"
        >
          Start reading
        </Link>
      </div>

      {topicGroups.length === 0 ? (
        <p className="text-brand-body py-10 text-center text-[color:var(--dash-faint)]">
          No chapters available yet.
        </p>
      ) : (
        <ol className="mt-1 divide-y divide-[color:var(--dash-surface-border)] pl-1">
          {topicGroups.map((topic, index) => (
            <TopicChapter
              key={`${topic.topic_key}-${topic.order}`}
              courseId={courseId}
              topic={topic}
              index={index}
              expanded={expandedTopic === topic.l1_name}
              onToggle={() => onToggle(topic.l1_name)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function TopicChapter({
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
  const panelRef = useRef<HTMLDivElement>(null);
  const topicLessonsHref = `/student/lectures/${courseId}/lessons?l1_name=${encodeURIComponent(topic.l1_name)}`;

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    if (prefersReducedMotion()) {
      panel.style.height = expanded ? "auto" : "0px";
      panel.style.opacity = expanded ? "1" : "0";
      return;
    }

    registerGsap();
    if (expanded) {
      gsap.set(panel, { height: "auto", opacity: 1 });
      const full = panel.scrollHeight;
      gsap.fromTo(
        panel,
        { height: 0, opacity: 0 },
        { height: full, opacity: 1, duration: 0.35, ease: "power2.out", clearProps: "height" },
      );
    } else {
      gsap.to(panel, { height: 0, opacity: 0, duration: 0.25, ease: "power2.in" });
    }
  }, [expanded]);

  return (
    <li data-toc-row className="py-1">
      <button
        type="button"
        onClick={onToggle}
        data-expanded={expanded}
        className={cn(
          "course-toc-row group flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2.5 text-left sm:gap-4 sm:px-3.5 sm:py-3",
          expanded && "bg-[color:var(--dash-soft)]",
        )}
        aria-expanded={expanded}
      >
        <span className="course-toc-badge font-sans flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#DDE466]/15 text-[11px] font-bold tracking-[0.02em] text-[color:var(--dash-accent)] sm:h-10 sm:w-10 sm:text-sm">
          {romanChapter(index)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="font-sans block text-sm font-semibold tracking-[0.005em] text-[color:var(--dash-text)] transition group-hover:text-[color:var(--dash-accent)] sm:text-lg">
            {topic.l1_name}
          </span>
          <span className="text-brand-caption mt-0.5 block text-[color:var(--dash-faint)]">
            {topic.section_count} section{topic.section_count === 1 ? "" : "s"} · {topic.lesson_count}{" "}
            lesson{topic.lesson_count === 1 ? "" : "s"}
          </span>
        </span>
        <span
          className={cn(
            "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--dash-soft)] text-[color:var(--dash-muted)] transition duration-200",
            expanded && "rotate-180 bg-[#DDE466]/25 text-[color:var(--dash-accent)]",
          )}
          aria-hidden
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </button>

      <div ref={panelRef} className="overflow-hidden" style={{ height: 0, opacity: 0 }}>
        <div className="pb-3 pl-2 pr-2 sm:pl-[3.25rem]">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-brand-caption text-[color:var(--dash-faint)]">In this chapter</p>
            <Link
              href={topicLessonsHref}
              className="text-brand-caption font-medium text-[color:var(--dash-accent)] transition hover:brightness-110"
            >
              Open chapter
            </Link>
          </div>
          {topic.sections.length === 0 ? (
            <p className="text-brand-caption py-2 text-[color:var(--dash-faint)]">No sections yet.</p>
          ) : (
            <ul className="space-y-1">
              {topic.sections.map((section, sectionIndex) => (
                <SectionEntry
                  key={section.topic_id}
                  courseId={courseId}
                  section={section}
                  index={sectionIndex}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

function SectionEntry({
  courseId,
  section,
  index,
}: {
  courseId: string;
  section: SectionSummary;
  index: number;
}) {
  const href = `/student/lectures/${courseId}/lessons?topic_id=${encodeURIComponent(section.topic_id)}`;

  return (
    <li>
      <Link
        href={href}
        className="course-section-row group flex items-baseline gap-3 rounded-lg px-2.5 py-2.5 hover:bg-[color:var(--dash-soft)]"
      >
        <span className="font-sans w-6 shrink-0 text-xs font-semibold tabular-nums text-[color:var(--dash-dim)]">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="min-w-0 flex-1 border-b border-dotted border-[color:var(--dash-surface-border)] pb-1">
          <span className="font-sans text-sm font-medium text-[color:var(--dash-text)] transition group-hover:text-[color:var(--dash-accent)]">
            {section.l2_name}
          </span>
        </span>
        <span className="text-brand-caption shrink-0 text-[color:var(--dash-faint)]">
          {section.item_count}
        </span>
      </Link>
    </li>
  );
}
