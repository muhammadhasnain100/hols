"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { mainNav } from "@/content/navigation";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { getButtonClassName } from "@/lib/button-styles";
import { cn } from "@/lib/utils";

export function HeroNavbarMobile() {
  const [open, setOpen] = useState(false);
  const { setPaused } = useSmoothScroll();

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
        className={getButtonClassName("glass", "h-10 w-10 p-0", "sm")}
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
        <div className="glass-capsule rounded-3xl px-6 py-6">
          <nav className="flex flex-col gap-4" aria-label="Mobile">
            {mainNav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="text-base font-medium text-primary/85 transition-colors duration-300 hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <div className="mt-4 flex flex-col gap-3 border-t border-primary/10 pt-4">
              <Button
                href="/login"
                variant="glass"
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
