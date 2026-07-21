export type HighlightColor = "yellow" | "green" | "blue" | "pink";

export type TextHighlight = {
  id: string;
  blockId: string;
  start: number;
  end: number;
  text: string;
  color: HighlightColor;
  note?: string;
  createdAt: string;
};

export type LineMarker = {
  id: string;
  blockId: string;
  lineIndex: number;
  linePreview: string;
  color: HighlightColor;
  note?: string;
  createdAt: string;
};

export type LessonBookmark = {
  id: string;
  blockId: string;
  lineIndex: number;
  label: string;
  createdAt: string;
};

export type LessonLearningState = {
  highlights: TextHighlight[];
  lineMarkers: LineMarker[];
  bookmarks: LessonBookmark[];
  readLines: string[];
};

export const HIGHLIGHT_COLORS: HighlightColor[] = ["yellow", "green", "blue", "pink"];

export const HIGHLIGHT_LABELS: Record<HighlightColor, string> = {
  yellow: "Important",
  green: "Key idea",
  blue: "Definition",
  pink: "Review",
};

export function emptyLearningState(): LessonLearningState {
  return {
    highlights: [],
    lineMarkers: [],
    bookmarks: [],
    readLines: [],
  };
}

export function lineKey(blockId: string, lineIndex: number) {
  return `${blockId}:${lineIndex}`;
}
