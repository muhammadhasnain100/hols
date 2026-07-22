"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { LessonDetail } from "@/lib/integrate/provider/student/lectures";
import { cn } from "@/lib/utils";
import {
  LessonMarkerOverlay,
  MARKER_COLORS,
  MARKER_SIZES,
  loadMarkerStrokes,
  saveMarkerStrokes,
  type MarkerColorId,
  type MarkerSizeId,
  type MarkerStroke,
} from "./LessonMarkerOverlay";

const ZOOM_STEPS = [0.9, 1, 1.12, 1.25, 1.4, 1.55] as const;
const BASE_FONT_PX = 17;
const LINE_HEIGHT_STEPS = { compact: 1.65, normal: 1.85, relaxed: 2.05 } as const;
const PREFS_KEY = "hols-learning-prefs";

type LayoutWidth = "center" | "full";
type ReadingTheme = "light" | "sepia" | "dark";
type LineSpacing = keyof typeof LINE_HEIGHT_STEPS;

type LearningPrefs = {
  layout: LayoutWidth;
  theme: ReadingTheme;
  spacing: LineSpacing;
  zoomIndex: number;
  focusMode: boolean;
  markerColor: MarkerColorId;
  markerSize: MarkerSizeId;
};

type LessonLearningViewProps = {
  lesson: LessonDetail;
  detailLoading?: boolean;
  currentIndex?: number | null;
  total?: number;
  onExit: () => void;
};

type ReadingSection = {
  title: string | null;
  body: string;
};

function loadPrefs(): Partial<LearningPrefs> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(PREFS_KEY) ?? "{}") as Partial<LearningPrefs>;
  } catch {
    return {};
  }
}

function savePrefs(prefs: LearningPrefs) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

function buildReadingSections(lesson: LessonDetail): ReadingSection[] {
  const sections: ReadingSection[] = [];
  if (lesson.fact?.trim()) sections.push({ title: null, body: lesson.fact.trim() });
  if (lesson.text_content?.trim()) sections.push({ title: "Full text", body: lesson.text_content.trim() });
  if (lesson.study_bullets?.trim()) sections.push({ title: "Study bullets", body: lesson.study_bullets.trim() });
  if (lesson.supporting_content?.trim()) {
    sections.push({ title: "Supporting content", body: lesson.supporting_content.trim() });
  }
  return sections;
}

function clearHighlights(container: HTMLElement | null) {
  if (!container) return;
  container.querySelectorAll("mark.lesson-text-highlight").forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });
}

const Icons = {
  exit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M15 18l-6-6 6-6" />
    </svg>
  ),
  focus: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
      <path d="M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9 17 7M7 17l-2.1 2.1" />
    </svg>
  ),
  center: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="6" y="4" width="12" height="16" rx="1.5" />
    </svg>
  ),
  full: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="4" width="18" height="16" rx="1.5" />
    </svg>
  ),
  light: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  sepia: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  dark: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z" />
    </svg>
  ),
  spacingTight: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 8h16M4 12h16M4 16h16" />
    </svg>
  ),
  spacingNormal: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  spacingWide: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  ),
  zoomOut: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3M8 11h6" />
    </svg>
  ),
  zoomIn: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <circle cx="11" cy="11" r="7" />
      <path d="m21 21-4.3-4.3M11 8v6M8 11h6" />
    </svg>
  ),
  highlight: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="m15 5 4 4-9.5 9.5H5.5v-4L15 5z" />
      <path d="M12.5 7.5 16.5 11.5" />
      <path d="M4 21h16" />
    </svg>
  ),
  marker: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M12 19 19 5l-4-2-7 14v2h2z" />
      <path d="m15 5 4 2" />
    </svg>
  ),
  undo: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 7v6h6" />
      <path d="M21 17a9 9 0 0 0-15-6.7L3 13" />
    </svg>
  ),
  clear: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M10 11v6M14 11v6" />
    </svg>
  ),
  book: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
};

function ToolButton({
  onClick,
  disabled,
  active,
  label,
  children,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={cn(
        "lesson-learning-tool inline-flex h-9 w-9 items-center justify-center rounded-full transition",
        active
          ? "bg-[#DDE466] text-[#152744]"
          : "bg-black/[0.04] text-current hover:bg-black/[0.08]",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

function IconSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Array<{ id: T; label: string; icon: ReactNode }>;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-full bg-black/[0.04] p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          title={option.label}
          aria-label={option.label}
          aria-pressed={value === option.id}
          onClick={() => onChange(option.id)}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full transition",
            value === option.id
              ? "bg-[#DDE466] text-[#152744] shadow-sm"
              : "text-current/70 hover:bg-black/[0.06] hover:text-current",
          )}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

function TextSegmentedControl<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
}: {
  value: T;
  options: Array<{ id: T; label: string }>;
  onChange: (value: T) => void;
  ariaLabel: string;
}) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className="inline-flex items-center gap-0.5 rounded-full bg-black/[0.04] p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            "font-sans inline-flex h-8 items-center rounded-full px-2.5 text-xs font-medium transition",
            value === option.id
              ? "bg-[#DDE466] text-[#152744] shadow-sm"
              : "text-current/70 hover:bg-black/[0.06] hover:text-current",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function LessonLearningView({
  lesson,
  detailLoading = false,
  currentIndex,
  total,
  onExit,
}: LessonLearningViewProps) {
  const saved = loadPrefs();
  const sections = buildReadingSections(lesson);
  const scrollRef = useRef<HTMLDivElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [zoomIndex, setZoomIndex] = useState(saved.zoomIndex ?? 2);
  const [highlightMode, setHighlightMode] = useState(false);
  const [markerMode, setMarkerMode] = useState(false);
  const [markerColor, setMarkerColor] = useState<MarkerColorId>(saved.markerColor ?? "yellow");
  const [markerSize, setMarkerSize] = useState<MarkerSizeId>(saved.markerSize ?? "medium");
  const [markerStrokes, setMarkerStrokes] = useState<MarkerStroke[]>([]);
  const [layout, setLayout] = useState<LayoutWidth>(saved.layout ?? "center");
  const [theme, setTheme] = useState<ReadingTheme>(saved.theme ?? "light");
  const [spacing, setSpacing] = useState<LineSpacing>(saved.spacing ?? "normal");
  const [focusMode, setFocusMode] = useState(saved.focusMode ?? false);
  const [scrollProgress, setScrollProgress] = useState(0);

  const fontSize = BASE_FONT_PX * ZOOM_STEPS[zoomIndex];
  const lineHeight = LINE_HEIGHT_STEPS[spacing];
  const zoomLabel = `${Math.round(ZOOM_STEPS[zoomIndex] * 100)}%`;
  const activeMarkerColor = MARKER_COLORS.find((item) => item.id === markerColor) ?? MARKER_COLORS[0];
  const activeMarkerWidth = MARKER_SIZES.find((item) => item.id === markerSize) ?? MARKER_SIZES[1];

  const lessonIdRef = useRef(lesson.lesson_id);
  lessonIdRef.current = lesson.lesson_id;

  useEffect(() => {
    savePrefs({ layout, theme, spacing, zoomIndex, focusMode, markerColor, markerSize });
  }, [focusMode, layout, markerColor, markerSize, spacing, theme, zoomIndex]);

  useEffect(() => {
    saveMarkerStrokes(lessonIdRef.current, markerStrokes);
  }, [markerStrokes]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
    clearHighlights(contentRef.current);
    setHighlightMode(false);
    setMarkerMode(false);
    setScrollProgress(0);
    setMarkerStrokes(loadMarkerStrokes(lesson.lesson_id));
  }, [lesson.lesson_id]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    function onScroll() {
      if (!element) return;
      const max = element.scrollHeight - element.clientHeight;
      setScrollProgress(max > 0 ? (element.scrollTop / max) * 100 : 0);
    }

    onScroll();
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => element.removeEventListener("scroll", onScroll);
  }, [lesson.lesson_id, detailLoading]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (markerMode) {
          setMarkerMode(false);
          return;
        }
        if (highlightMode) {
          setHighlightMode(false);
          return;
        }
        onExit();
        return;
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "=") {
        event.preventDefault();
        setZoomIndex((index) => Math.min(ZOOM_STEPS.length - 1, index + 1));
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "-") {
        event.preventDefault();
        setZoomIndex((index) => Math.max(0, index - 1));
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [highlightMode, markerMode, onExit]);

  const enableHighlightMode = useCallback(() => {
    setMarkerMode(false);
    setHighlightMode((value) => !value);
  }, []);

  const enableMarkerMode = useCallback(() => {
    setHighlightMode(false);
    setMarkerMode((value) => !value);
  }, []);

  const clearAnnotations = useCallback(() => {
    clearHighlights(contentRef.current);
    setMarkerStrokes([]);
  }, []);

  const undoMarkerStroke = useCallback(() => {
    setMarkerStrokes((strokes) => strokes.slice(0, -1));
  }, []);

  const applyHighlight = useCallback(() => {
    if (!highlightMode || !contentRef.current) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    if (!contentRef.current.contains(range.commonAncestorContainer)) return;

    const mark = document.createElement("mark");
    mark.className = "lesson-text-highlight";

    try {
      range.surroundContents(mark);
    } catch {
      const extracted = range.extractContents();
      mark.appendChild(extracted);
      range.insertNode(mark);
    }

    selection.removeAllRanges();
  }, [highlightMode]);

  return (
    <div
      className={cn(
        "lesson-learning-view fixed inset-0 z-[120] flex flex-col",
        `lesson-learning-theme-${theme}`,
      )}
      role="dialog"
      aria-modal="true"
      aria-label="Learning mode"
    >
      <header className="lesson-learning-header shrink-0 border-b px-3 py-2.5 shadow-[0_1px_8px_rgba(21,39,68,0.06)] backdrop-blur-sm md:px-4">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onExit}
            className="lesson-learning-exit font-sans inline-flex min-h-9 items-center gap-1.5 rounded-full px-3.5 text-sm font-medium transition"
          >
            {Icons.exit}
            Back to lesson
          </button>

          <div className="lesson-learning-meta mx-auto flex items-center gap-2 text-sm font-medium md:mx-0">
            <span className="inline-flex h-7 items-center rounded-full bg-black/[0.05] px-2.5 text-xs font-semibold">
              {currentIndex && total ? `${currentIndex} / ${total}` : `Lesson ${lesson.order}`}
            </span>
            {scrollProgress > 0 ? (
              <span className="text-xs opacity-70">{Math.round(scrollProgress)}% read</span>
            ) : null}
          </div>

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <IconSegmentedControl
              ariaLabel="Reading width"
              value={layout}
              onChange={setLayout}
              options={[
                { id: "center", label: "Centered width", icon: Icons.center },
                { id: "full", label: "Full width", icon: Icons.full },
              ]}
            />

            <IconSegmentedControl
              ariaLabel="Reading theme"
              value={theme}
              onChange={setTheme}
              options={[
                { id: "light", label: "Light theme", icon: Icons.light },
                { id: "sepia", label: "Sepia theme", icon: Icons.sepia },
                { id: "dark", label: "Dark theme", icon: Icons.dark },
              ]}
            />

            <IconSegmentedControl
              ariaLabel="Line spacing"
              value={spacing}
              onChange={setSpacing}
              options={[
                { id: "compact", label: "Tight spacing", icon: Icons.spacingTight },
                { id: "normal", label: "Normal spacing", icon: Icons.spacingNormal },
                { id: "relaxed", label: "Wide spacing", icon: Icons.spacingWide },
              ]}
            />

            <div className="inline-flex items-center gap-0.5 rounded-full bg-black/[0.04] p-0.5">
              <ToolButton
                label="Zoom out"
                disabled={zoomIndex <= 0}
                onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
                className="!bg-transparent hover:!bg-black/[0.06]"
              >
                {Icons.zoomOut}
              </ToolButton>
              <span className="lesson-learning-meta min-w-[2.75rem] text-center text-xs font-semibold tabular-nums">
                {zoomLabel}
              </span>
              <ToolButton
                label="Zoom in"
                disabled={zoomIndex >= ZOOM_STEPS.length - 1}
                onClick={() => setZoomIndex((index) => Math.min(ZOOM_STEPS.length - 1, index + 1))}
                className="!bg-transparent hover:!bg-black/[0.06]"
              >
                {Icons.zoomIn}
              </ToolButton>
            </div>

            <ToolButton
              label="Focus reading"
              active={focusMode}
              onClick={() => setFocusMode((value) => !value)}
            >
              {Icons.focus}
            </ToolButton>

            <ToolButton
              label="Text highlight"
              active={highlightMode}
              onClick={enableHighlightMode}
            >
              {Icons.highlight}
            </ToolButton>

            <ToolButton
              label="Freehand marker"
              active={markerMode}
              onClick={enableMarkerMode}
            >
              {Icons.marker}
            </ToolButton>

            {markerMode ? (
              <>
                <div className="flex items-center gap-1 px-0.5" role="group" aria-label="Marker colors">
                  {MARKER_COLORS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-label={option.label}
                      title={option.label}
                      onClick={() => setMarkerColor(option.id)}
                      className={cn(
                        "h-5 w-5 rounded-full border-2 transition",
                        markerColor === option.id ? "border-[#152744] scale-110" : "border-white/80",
                      )}
                      style={{ backgroundColor: option.value.replace(/[\d.]+\)$/, "0.85)") }}
                    />
                  ))}
                </div>
                <TextSegmentedControl
                  ariaLabel="Marker size"
                  value={markerSize}
                  onChange={setMarkerSize}
                  options={MARKER_SIZES.map((option) => ({ id: option.id, label: option.label }))}
                />
              </>
            ) : null}

            <ToolButton
              label="Undo last marker stroke"
              disabled={markerStrokes.length === 0}
              onClick={undoMarkerStroke}
            >
              {Icons.undo}
            </ToolButton>

            <ToolButton label="Clear annotations" onClick={clearAnnotations}>
              {Icons.clear}
            </ToolButton>
          </div>
        </div>
      </header>

      <div className="lesson-learning-progress h-0.5 w-full">
        <div
          className="lesson-learning-progress-bar h-full transition-[width] duration-150"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div ref={scrollRef} className={cn("flex-1 overflow-y-auto", markerMode && "lesson-learning-marker-scroll")}>
        <article
          ref={articleRef}
          className={cn(
            "relative mx-auto py-5 transition-[max-width,padding] duration-200 md:py-8",
            layout === "center" ? "max-w-3xl px-5 md:px-8" : "w-full max-w-none px-5 md:px-8 lg:px-12",
          )}
        >
          {!focusMode ? (
            <div className="mb-4 flex flex-wrap gap-2">
              <span className="lesson-learning-badge inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold">
                {Icons.book}
                Lesson {lesson.order}
              </span>
              {lesson.l2_name ? (
                <span className="lesson-learning-tag inline-flex rounded-full px-3 py-1 text-xs font-medium">
                  {lesson.l2_name}
                </span>
              ) : null}
            </div>
          ) : null}

          <h1
            className="lesson-learning-title font-sans font-bold leading-tight tracking-[0.01em]"
            style={{ fontSize: `${fontSize * 1.35}px`, lineHeight: 1.25 }}
          >
            {lesson.title}
          </h1>

          {detailLoading ? (
            <div className="mt-8 text-center">
              <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-black/10" />
              <p className="lesson-learning-meta mt-4 text-sm opacity-70">Loading lesson…</p>
            </div>
          ) : sections.length === 0 ? (
            <p className="lesson-learning-body mt-6" style={{ fontSize: `${fontSize}px`, lineHeight }}>
              No lesson content available yet.
            </p>
          ) : (
            <div
              ref={contentRef}
              className={cn("mt-6 space-y-7", highlightMode && "lesson-learning-highlight-mode")}
              onMouseUp={applyHighlight}
            >
              {sections.map((section, index) => (
                <div key={`${section.title ?? "main"}-${index}`}>
                  {!focusMode && section.title ? (
                    <h2
                      className="lesson-learning-section-label mb-2.5 font-semibold uppercase tracking-[0.1em]"
                      style={{ fontSize: `${fontSize * 0.7}px` }}
                    >
                      {section.title}
                    </h2>
                  ) : null}
                  <div
                    className="lesson-learning-body whitespace-pre-wrap"
                    style={{ fontSize: `${fontSize}px`, lineHeight }}
                  >
                    {section.body}
                  </div>
                </div>
              ))}
            </div>
          )}

          <LessonMarkerOverlay
            active={markerMode}
            containerRef={articleRef}
            scrollRef={scrollRef}
            layoutKey={`${layout}-${spacing}-${zoomIndex}-${detailLoading}-${sections.length}`}
            color={activeMarkerColor.value}
            width={activeMarkerWidth.value}
            strokes={markerStrokes}
            onStrokesChange={setMarkerStrokes}
          />
        </article>
      </div>
    </div>
  );
}

export function LearningModeToggle({
  active,
  onToggle,
  disabled,
}: {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "font-sans inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-sm font-medium tracking-[0.01em] transition",
        active
          ? "bg-[#DDE466] text-[#152744]"
          : "dashboard-pill-soft text-[color:var(--dash-text)] hover:brightness-[0.98]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      {Icons.focus}
      {active ? "Learning mode on" : "Learning mode"}
    </button>
  );
}
