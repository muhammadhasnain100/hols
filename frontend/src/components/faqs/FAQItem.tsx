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
          "overflow-hidden rounded-2xl border border-primary/10 bg-white shadow-[0_4px_16px_rgba(21,39,68,0.05)] transition-shadow duration-300",
        isCard && open && "shadow-[0_12px_32px_rgba(21,39,68,0.1)]",
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
        <span className="min-w-0 flex-1 font-sans text-[0.9375rem] font-semibold leading-[1.3] tracking-[0.005em] text-primary sm:text-base sm:leading-[1.25] md:text-[1.125rem]">
          {question}
        </span>
        <span
          className={cn(
            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg font-light leading-none transition-colors duration-300 sm:h-9 sm:w-9 sm:text-xl md:h-10 md:w-10",
            isCard
              ? cn(
                  "bg-[#F4F5F7] text-primary",
                  open && "bg-accent text-primary",
                )
              : cn(
                  "bg-primary/5 text-primary-light",
                  open && "bg-accent/30 text-primary",
                ),
          )}
          aria-hidden
        >
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
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
      ) : null}
    </div>
  );
}
