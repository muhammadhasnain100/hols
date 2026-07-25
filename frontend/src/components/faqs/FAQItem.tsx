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
  variant?: "default" | "card";
};

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
          "group overflow-hidden rounded-2xl border border-primary/8 bg-white/80 shadow-[0_4px_18px_rgba(21,39,68,0.05)] backdrop-blur-sm transition-[border-color,box-shadow,background-color,transform] duration-300",
        isCard && "hover:border-primary/14 hover:bg-white hover:shadow-[0_10px_28px_rgba(21,39,68,0.08)]",
        isCard && open && "border-primary/12 bg-white shadow-[0_14px_36px_rgba(21,39,68,0.1)]",
        !isCard && "border-b border-border/40",
        glass &&
          "glass rounded-2xl border-white/50 shadow-[0_4px_20px_rgba(21,39,68,0.05)]",
      )}
    >
      <button
        type="button"
        onClick={handleToggle}
        className={cn(
          "flex w-full items-center justify-between gap-3 text-left outline-none sm:gap-4",
          isCard ? "px-4 py-3.5 sm:px-5 sm:py-4 md:px-6 md:py-5" : "py-4 sm:py-5",
          "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        )}
        aria-expanded={open}
      >
        <span className="min-w-0 flex-1 font-sans text-[0.9375rem] font-semibold leading-[1.3] tracking-[0.005em] text-primary transition-colors duration-300 sm:text-base sm:leading-[1.25] md:text-[1.125rem]">
          {question}
        </span>
        <span
          className={cn(
            "relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all duration-300 sm:h-9 sm:w-9 md:h-10 md:w-10",
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
          <span className="absolute h-[1.5px] w-3 rounded-full bg-current sm:w-3.5" />
          <span className="absolute h-3 w-[1.5px] rounded-full bg-current sm:h-3.5" />
        </span>
      </button>

      <div
        className={cn(
          "grid transition-[grid-template-rows,opacity] duration-300 ease-out",
          open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
        )}
      >
        <div className="min-h-0 overflow-hidden">
          <p
            className={cn(
              "text-brand-body text-primary/75",
              isCard
                ? "px-4 pb-4 pt-0 sm:px-5 sm:pb-5 md:px-6 md:pb-6"
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
