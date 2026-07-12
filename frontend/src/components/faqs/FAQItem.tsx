"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type FAQItemProps = {
  question: string;
  answer: string;
  open?: boolean;
  defaultOpen?: boolean;
  onToggle?: () => void;
  glass?: boolean;
};

export function FAQItem({
  question,
  answer,
  open: controlledOpen,
  defaultOpen = false,
  onToggle,
  glass = false,
}: FAQItemProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const handleToggle = () => {
    if (onToggle) {
      onToggle();
      return;
    }
    setUncontrolledOpen((prev) => !prev);
  };

  return (
    <div
      className={cn(
        glass
          ? "glass overflow-hidden rounded-xl border border-white/50 shadow-[0_4px_20px_rgba(21,39,68,0.05)]"
          : "border-b border-border/40",
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center justify-between gap-3 text-left",
          glass ? "px-4 py-3.5 md:px-5 md:py-4" : "py-5",
        )}
        aria-expanded={open}
      >
        <span className="font-sans text-sm font-medium leading-snug text-primary md:text-base">
          {question}
        </span>
        <span
          className={cn(
            "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/5 text-xl font-light leading-none text-primary-light transition-colors md:h-10 md:w-10",
            open && "bg-accent/30 text-primary",
          )}
          aria-hidden
        >
          {open ? "−" : "+"}
        </span>
      </button>
      {open && (
        <p
          className={cn(
            "text-sm leading-relaxed text-muted",
            glass ? "px-4 pb-4 pt-0 md:px-5 md:pb-5" : "pb-5",
          )}
        >
          {answer}
        </p>
      )}
    </div>
  );
}
