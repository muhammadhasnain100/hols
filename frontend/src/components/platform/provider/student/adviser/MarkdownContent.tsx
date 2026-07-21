"use client";

import { cn } from "@/lib/utils";

type MarkdownContentProps = {
  content: string;
  className?: string;
};

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={index} className="font-semibold text-primary">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={index} className="italic text-primary/80">
          {part.slice(1, -1)}
        </em>
      );
    }
    return part;
  });
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let listItems: string[] = [];

  const flushList = () => {
    if (listItems.length === 0) return;
    blocks.push(
      <ul key={`list-${blocks.length}`} className="my-2 list-disc space-y-1 pl-5 text-[13px] leading-relaxed text-primary/80">
        {listItems.map((item, index) => (
          <li key={index}>{renderInline(item)}</li>
        ))}
      </ul>,
    );
    listItems = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushList();
      return;
    }

    if (trimmed.startsWith("### ")) {
      flushList();
      blocks.push(
        <h3 key={`h3-${index}`} className="mt-4 text-[14px] font-semibold text-primary first:mt-0">
          {trimmed.slice(4)}
        </h3>,
      );
      return;
    }

    if (trimmed.startsWith("## ")) {
      flushList();
      blocks.push(
        <h2 key={`h2-${index}`} className="mt-4 text-[15px] font-semibold text-primary first:mt-0">
          {trimmed.slice(3)}
        </h2>,
      );
      return;
    }

    if (trimmed.startsWith("- ")) {
      listItems.push(trimmed.slice(2));
      return;
    }

    flushList();
    blocks.push(
      <p key={`p-${index}`} className="text-[13px] leading-relaxed text-primary/80">
        {renderInline(trimmed)}
      </p>,
    );
  });

  flushList();

  return <div className={cn("space-y-1", className)}>{blocks}</div>;
};
