"use client";

import { useMemo } from "react";

export type ProseBlock = { type: "p"; text: string } | { type: "list"; items: string[] };

/** Split raw lesson text into paragraphs and bullet lists for document-style reading. */
export function parseLessonProse(raw: unknown): ProseBlock[] {
  const source = Array.isArray(raw)
    ? raw.filter(Boolean).map(String).join("\n")
    : typeof raw === "string"
      ? raw
      : raw == null
        ? ""
        : String(raw);
  const normalized = source.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!normalized) return [];

  const blocks: ProseBlock[] = [];
  for (const chunk of normalized.split(/\n\s*\n/)) {
    const lines = chunk
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    if (!lines.length) continue;

    let paragraph: string[] = [];
    let bullets: string[] = [];
    const flushParagraph = () => {
      if (paragraph.length) {
        blocks.push({ type: "p", text: paragraph.join(" ").replace(/\s+/g, " ").trim() });
        paragraph = [];
      }
    };
    const flushBullets = () => {
      if (bullets.length) {
        blocks.push({ type: "list", items: bullets.slice() });
        bullets = [];
      }
    };

    for (const line of lines) {
      const bullet = line.match(/^[-*•·]\s+(.*)$/);
      if (bullet) {
        flushParagraph();
        bullets.push(bullet[1].trim());
      } else {
        flushBullets();
        paragraph.push(line);
      }
    }
    flushParagraph();
    flushBullets();
  }
  return blocks;
}

export function LessonProse({ text, className }: { text: string; className?: string }) {
  const blocks = useMemo(() => parseLessonProse(text), [text]);
  if (!blocks.length) return null;
  return (
    <div className={className ? `lesson-prose ${className}` : "lesson-prose"}>
      {blocks.map((block, index) =>
        block.type === "list" ? (
          <ul key={index} className="lesson-prose-list">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex}>{item}</li>
            ))}
          </ul>
        ) : (
          <p key={index} className="lesson-prose-p">
            {block.text}
          </p>
        ),
      )}
    </div>
  );
}
