"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { mainNav } from "@/content/navigation";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { getButtonClassName } from "@/lib/button-styles";
import { cn } from "@/lib/utils";

type HeroNavbarMobileProps = {
  tone?: "default" | "overlay";
};

export function HeroNavbarMobile({ tone = "default" }: HeroNavbarMobileProps) {
  const [open, setOpen] = useState(false);
  const { setPaused } = useSmoothScroll();
  const isOverlay = tone === "overlay";

  useEffect(() => {
    setPaused(open);
  }, [open, setPaused]);

  return (
    <div className="relative z-50">
      <button
        type="button"
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        onClick={() => setOpen((prev) => !prev)}
        className={
          isOverlay
            ? cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-sm border border-white/25 bg-white/10 text-white backdrop-blur-sm transition-colors duration-300 hover:bg-white/20",
              )
            : getButtonClassName("glass", "h-10 w-10 p-0", "sm")
        }
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          {open ? (
            <path d="M6 6l12 12M18 6L6 18" />
          ) : (
            <path d="M4 7h16M4 12h16M4 17h16" />
          )}
        </svg>
      </button>

      <div
        data-lenis-prevent
        className={cn(
          "fixed inset-x-4 top-20 transition-all duration-300",
          open ? "visible opacity-100" : "invisible opacity-0",
        )}
      >
        <div
          className={cn(
            "rounded-3xl px-6 py-6",
            isOverlay
              ? "border border-white/15 bg-primary/95 text-white shadow-xl backdrop-blur-md"
              : "glass-capsule",
          )}
        >
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "font-sans text-base font-medium transition-colors duration-300",
                  isOverlay
                    ? "text-white/85 hover:text-white"
                    : "text-primary/85 hover:text-primary",
                )}
              >
                {item.label}
              </Link>
            ))}
            <div
              className={cn(
                "mt-4 flex flex-col gap-3 border-t pt-4",
                isOverlay ? "border-white/15" : "border-primary/10",
              )}
            >
              <Button
                href="/login"
                variant={isOverlay ? "secondary" : "glass"}
                size="lg"
                className="w-full justify-center"
                onClick={() => setOpen(false)}
              >
                Log in
              </Button>
              <Button
                href="/register"
                variant="primary"
                size="lg"
                className="w-full justify-center"
                onClick={() => setOpen(false)}
              >
                Get Started
              </Button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
