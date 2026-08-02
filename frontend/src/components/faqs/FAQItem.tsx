"use client";

import { useState } from "react";
import { Icon, Plus } from "@/components/icons";
import { cn } from "@/lib/utils";

type FAQItemProps = {
  question: string;
  answer: string;
  open?: boolean;
  defaultOpen?: boolean;
  onToggle?: () => void;
  glass?: boolean;
  variant?: "default" | "card";
};

/** Height-only accordion — no opacity fade (that caused the blink). */
const PANEL_EASE = "duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none";

export function FAQItem({
  question,
  answer,
  open: controlledOpen,
  defaultOpen = false,
  onToggle,
  glass = false,
  variant = "default",
}: FAQItemProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  const isCard = variant === "card" || glass;

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
        isCard &&
          "group overflow-hidden rounded-2xl border border-primary/8 bg-white transition-[border-color] duration-500 ease-out motion-reduce:transition-none",
        isCard && "hover:border-primary/14",
        isCard && open && "border-primary/12",
        !isCard && "border-b border-border/40",
        glass && "rounded-2xl border-white/50 bg-white",
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center justify-between gap-3 text-left outline-none sm:gap-4",
          isCard
            ? "px-3.5 py-3.5 sm:px-5 sm:py-4 md:px-6 md:py-5"
            : "py-4 sm:py-5",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        )}
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 font-sans text-[0.9375rem] font-semibold leading-[1.35] tracking-[0.005em] text-primary sm:text-base sm:leading-[1.3] md:text-[1.125rem]">
          {question}
        </span>
        <span
          className={cn(
            "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-[transform,background-color,color] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:h-9 sm:w-9 md:h-10 md:w-10",
            isCard
              ? cn(
                  "bg-[#E5E5E5] text-primary",
                  open && "rotate-45 bg-accent text-primary",
                )
              : cn(
                  "bg-primary/5 text-primary-light",
                  open && "rotate-45 bg-accent/30 text-primary",
                ),
          )}
          aria-hidden
        >
          <Icon icon={Plus} size={14} className="sm:h-3.5 sm:w-3.5" strokeWidth={2} />
        </span>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows]",
          PANEL_EASE,
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <p
            className={cn(
              "text-brand-body text-pretty text-primary/75",
              isCard
                ? "px-3.5 pb-3.5 pt-0 sm:px-5 sm:pb-5 md:px-6 md:pb-6"
                : "pb-4 sm:pb-5",
            )}
          >
            {answer}
          </p>
        </div>
      </div>
    </div>
  );
}
