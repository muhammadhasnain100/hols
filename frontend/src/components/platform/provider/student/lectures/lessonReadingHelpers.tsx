import type { ReactNode } from "react";
import type { LessonDetail } from "@/lib/integrate/provider/student/lectures";

export const ZOOM_STEPS = [0.9, 1, 1.12, 1.25, 1.4, 1.55] as const;
export const BASE_FONT_PX = 17;
export const LINE_HEIGHT_STEPS = { compact: 1.65, normal: 1.85, relaxed: 2.05 } as const;
export const LETTER_SPACING_STEPS = { normal: "0em", wide: "0.04em" } as const;
export const AUTO_SCROLL_SPEEDS = [0, 0.35, 0.75, 1.5] as const;
export const PREFS_KEY = "hols-learning-prefs";
export const SCROLL_KEY_PREFIX = "hols-lesson-scroll-";

export type LayoutWidth = "center" | "full";
export type ReadingTheme = "light" | "sepia" | "dark";
export type LineSpacing = keyof typeof LINE_HEIGHT_STEPS;
export type FontFamily = "sans" | "serif" | "readable";
export type LetterSpacing = keyof typeof LETTER_SPACING_STEPS;
export type AutoScrollSpeed = 0 | 1 | 2 | 3;

export type LearningPrefs = {
  layout: LayoutWidth;
  theme: ReadingTheme;
  spacing: LineSpacing;
  zoomIndex: number;
  focusMode: boolean;
  fontFamily: FontFamily;
  letterSpacing: LetterSpacing;
  readingRuler: boolean;
  bionicReading: boolean;
  justifyText: boolean;
  autoScrollSpeed: AutoScrollSpeed;
  showToc: boolean;
};

export type ReadingSection = {
  id: string;
  title: string | null;
  body: string;
};

export const DEFAULT_PREFS: LearningPrefs = {
  layout: "center",
  theme: "light",
  spacing: "normal",
  zoomIndex: 2,
  focusMode: false,
  fontFamily: "sans",
  letterSpacing: "normal",
  readingRuler: false,
  bionicReading: false,
  justifyText: false,
  autoScrollSpeed: 0,
  showToc: true,
};

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ").toLowerCase();
}

export function loadPrefs(): Partial<LearningPrefs> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(sessionStorage.getItem(PREFS_KEY) ?? "{}") as Partial<LearningPrefs>;
  } catch {
    return {};
  }
}

export function savePrefs(prefs: LearningPrefs) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
}

export function loadScrollPosition(lessonId: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = sessionStorage.getItem(`${SCROLL_KEY_PREFIX}${lessonId}`);
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

export function saveScrollPosition(lessonId: string, position: number) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(`${SCROLL_KEY_PREFIX}${lessonId}`, String(Math.round(position)));
}

export function buildReadingSections(lesson: LessonDetail): ReadingSection[] {
  const sections: ReadingSection[] = [];
  const titleNorm = lesson.title ? normalizeText(lesson.title) : "";
  const fact = lesson.fact?.trim() ?? "";
  const textContent = lesson.text_content?.trim() ?? "";
  const factNorm = fact ? normalizeText(fact) : "";
  const textNorm = textContent ? normalizeText(textContent) : "";

  if (fact && factNorm !== titleNorm) {
    sections.push({ id: "summary", title: null, body: fact });
  }

  if (textContent && textNorm !== factNorm && textNorm !== titleNorm) {
    sections.push({ id: "full-text", title: "Full text", body: textContent });
  } else if (textContent && !fact && textNorm !== titleNorm) {
    sections.push({ id: "full-text", title: null, body: textContent });
  }

  if (lesson.study_bullets?.trim()) {
    sections.push({ id: "study-bullets", title: "Study bullets", body: lesson.study_bullets.trim() });
  }

  if (lesson.supporting_content?.trim()) {
    sections.push({
      id: "supporting-content",
      title: "Supporting content",
      body: lesson.supporting_content.trim(),
    });
  }

  return sections;
}

export function countReadingStats(sections: ReadingSection[], title: string) {
  const text = [title, ...sections.map((section) => section.body)].join(" ");
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return { words, minutes };
}

export function clearHighlights(container: HTMLElement | null) {
  if (!container) return;
  container.querySelectorAll("mark.lesson-text-highlight").forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
    parent.removeChild(mark);
  });
}

export function sectionNavLabel(section: ReadingSection, index: number) {
  if (section.title) return section.title;
  if (section.id === "summary") return "Summary";
  return `Section ${index + 1}`;
}

function bionicWord(word: string, key: string): ReactNode {
  const boldLength = Math.max(1, Math.ceil(word.length * 0.45));
  return (
    <span key={key}>
      <strong>{word.slice(0, boldLength)}</strong>
      {word.slice(boldLength)}
    </span>
  );
}

export function renderBionicText(text: string): ReactNode {
  return text.split("\n").map((line, lineIndex) => (
    <span key={`line-${lineIndex}`}>
      {lineIndex > 0 ? "\n" : null}
      {line.split(/(\s+)/).map((token, tokenIndex) => {
        if (!token.trim()) return token;
        return bionicWord(token, `${lineIndex}-${tokenIndex}`);
      })}
    </span>
  ));
}

export function mergePrefs(saved: Partial<LearningPrefs>): LearningPrefs {
  return { ...DEFAULT_PREFS, ...saved };
}
