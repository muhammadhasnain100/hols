"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import {
  portalInlineMetaClass,
  portalRowCategoryClass,
  portalSectionDescClass,
  portalSubnavItemClass,
} from "@/components/platform/provider/portal-styles";
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
      className={cn(
        "text-brand-caption inline-flex h-8 min-w-8 items-center justify-center rounded-full border px-2 font-medium transition",
        active
          ? "border-primary bg-primary text-white"
          : "border-primary/10 bg-white text-primary hover:bg-primary/[0.04]",
        disabled && "cursor-not-allowed opacity-40",
        className,
      )}
    >
      {children}
    </button>
  );
}

function SegmentedControl<T extends string>({
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
      className="inline-flex rounded-full border border-primary/10 bg-white p-0.5"
    >
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={cn(
            portalSubnavItemClass,
            "rounded-full px-2.5 py-1 transition",
            value === option.id ? "bg-primary text-white" : "text-primary/65 hover:text-primary",
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
      <header className="lesson-learning-header shrink-0 border-b px-3 py-2 shadow-[0_1px_8px_rgba(21,39,68,0.06)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onExit}
            className={cn("lesson-learning-exit inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 transition", portalSubnavItemClass)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
            Exit
          </button>

          <p className={cn("lesson-learning-meta font-medium", portalInlineMetaClass)}>
            {currentIndex && total ? `Lesson ${currentIndex} of ${total}` : `Lesson ${lesson.order}`}
            {scrollProgress > 0 ? ` · ${Math.round(scrollProgress)}%` : ""}
          </p>

          <ToolButton
            label="Focus reading"
            active={focusMode}
            onClick={() => setFocusMode((value) => !value)}
            className="lesson-learning-tool"
          >
            Focus
          </ToolButton>
        </div>

        <div className="mx-auto mt-1.5 flex max-w-6xl flex-wrap items-center gap-1.5">
          <SegmentedControl
            ariaLabel="Reading width"
            value={layout}
            onChange={setLayout}
            options={[
              { id: "center", label: "Center" },
              { id: "full", label: "Full" },
            ]}
          />

          <SegmentedControl
            ariaLabel="Reading theme"
            value={theme}
            onChange={setTheme}
            options={[
              { id: "light", label: "Light" },
              { id: "sepia", label: "Sepia" },
              { id: "dark", label: "Dark" },
            ]}
          />

          <SegmentedControl
            ariaLabel="Line spacing"
            value={spacing}
            onChange={setSpacing}
            options={[
              { id: "compact", label: "Tight" },
              { id: "normal", label: "Normal" },
              { id: "relaxed", label: "Wide" },
            ]}
          />

          <div className="ml-auto flex flex-wrap items-center gap-1.5">
            <ToolButton
              label="Zoom out"
              disabled={zoomIndex <= 0}
              onClick={() => setZoomIndex((index) => Math.max(0, index - 1))}
              className="lesson-learning-tool"
            >
              A−
            </ToolButton>
            <span className={cn("lesson-learning-meta min-w-[3rem] text-center font-medium", portalInlineMetaClass)}>
              {zoomLabel}
            </span>
            <ToolButton
              label="Zoom in"
              disabled={zoomIndex >= ZOOM_STEPS.length - 1}
              onClick={() => setZoomIndex((index) => Math.min(ZOOM_STEPS.length - 1, index + 1))}
              className="lesson-learning-tool"
            >
              A+
            </ToolButton>

            <ToolButton
              label="Text highlight"
              active={highlightMode}
              onClick={enableHighlightMode}
              className="lesson-learning-tool"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                <path d="m9 11-6 6v3h3l6-6" />
                <path d="M22 12l-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" />
              </svg>
            </ToolButton>

            <ToolButton
              label="Freehand marker"
              active={markerMode}
              onClick={enableMarkerMode}
              className="lesson-learning-tool"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" stroke="none" aria-hidden>
                <path d="M17.5 2.5c.8-.8 2.1-.8 2.8 0l1.2 1.2c.8.8.8 2.1 0 2.8L9.8 18.2l-4.5 1.5 1.5-4.5L17.5 2.5z" opacity="0.85" />
                <path d="M3 21h7" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" />
              </svg>
              Marker
            </ToolButton>

            {markerMode ? (
              <>
                <div className="flex items-center gap-1" role="group" aria-label="Marker colors">
                  {MARKER_COLORS.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      aria-label={option.label}
                      title={option.label}
                      onClick={() => setMarkerColor(option.id)}
                      className={cn(
                        "h-5 w-5 rounded-full border transition",
                        markerColor === option.id ? "border-primary ring-1 ring-primary/30" : "border-white/80",
                      )}
                      style={{ backgroundColor: option.value.replace(/[\d.]+\)$/, "0.85)") }}
                    />
                  ))}
                </div>
                <SegmentedControl
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
              className="lesson-learning-tool"
            >
              Undo
            </ToolButton>

            <ToolButton
              label="Clear annotations"
              onClick={clearAnnotations}
              className="lesson-learning-tool"
            >
              Clear
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
            "relative mx-auto py-5 transition-[max-width,padding] duration-200 md:py-6",
            layout === "center" ? "max-w-3xl px-5 md:px-8" : "w-full max-w-none px-5 md:px-8 lg:px-12",
          )}
        >
          {!focusMode ? (
            <div className="mb-3 flex flex-wrap gap-1.5">
              <span className={cn("lesson-learning-badge inline-flex rounded-full px-3 py-1", portalRowCategoryClass)}>
                Lesson {lesson.order}
              </span>
              {lesson.l2_name ? (
                <span className={cn("lesson-learning-tag inline-flex rounded-full px-3 py-1", portalInlineMetaClass)}>
                  {lesson.l2_name}
                </span>
              ) : null}
            </div>
          ) : null}

          <h1
            className="lesson-learning-title font-bold leading-tight tracking-tight"
            style={{ fontSize: `${fontSize * 1.35}px`, lineHeight: 1.25 }}
          >
            {lesson.title}
          </h1>

          {detailLoading ? (
            <div className="mt-6 text-center">
              <div className="mx-auto h-8 w-8 animate-pulse rounded-full bg-primary/10" />
              <p className={cn("lesson-learning-meta mt-4", portalSectionDescClass)}>Loading lesson…</p>
            </div>
          ) : sections.length === 0 ? (
            <p
              className="lesson-learning-body mt-5"
              style={{ fontSize: `${fontSize}px`, lineHeight }}
            >
              No lesson content available yet.
            </p>
          ) : (
            <div
              ref={contentRef}
              className={cn("mt-5 space-y-6", highlightMode && "lesson-learning-highlight-mode")}
              onMouseUp={applyHighlight}
            >
              {sections.map((section, index) => (
                <div key={`${section.title ?? "main"}-${index}`}>
                  {!focusMode && section.title ? (
                    <h2
                      className="lesson-learning-section-label mb-2 font-semibold uppercase tracking-[0.14em]"
                      style={{ fontSize: `${fontSize * 0.72}px` }}
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
        portalSubnavItemClass,
        "inline-flex items-center gap-2 rounded-full px-4 py-2 transition",
        active
          ? "bg-primary text-white shadow-[0_2px_10px_rgba(21,39,68,0.15)]"
          : "border border-primary/15 bg-white text-primary shadow-[0_1px_3px_rgba(21,39,68,0.06)] hover:border-primary/25 hover:bg-primary/[0.03]",
        disabled && "cursor-not-allowed opacity-50",
      )}
    >
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
      {active ? "Learning mode on" : "Learning mode"}
    </button>
  );
}
