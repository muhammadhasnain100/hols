"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type FAQItemProps = {
  question: string;
  answer: string;
  defaultOpen?: boolean;
};

export function FAQItem({ question, answer, defaultOpen = false }: FAQItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border/40">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-start justify-between gap-4 py-5 text-left"
        aria-expanded={open}
      >
        <span className="font-sans text-base font-medium text-primary md:text-lg">
          {question}
        </span>
        <span
          className={cn(
            "mt-1 shrink-0 text-primary-light transition-transform",
            open && "rotate-45",
          )}
          aria-hidden
        >
          +
        </span>
      </button>
      {open && (
        <p className="pb-5 text-sm leading-relaxed text-muted md:text-base">
          {answer}
        </p>
      )}
    </div>
  );
}
