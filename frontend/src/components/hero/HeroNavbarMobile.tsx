"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HeroButton } from "@/components/hero/HeroButton";
import { Button } from "@/components/ui/Button";
import { mainNav } from "@/content/navigation";
import { heroContent } from "@/content/hero";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { getButtonClassName } from "@/lib/button-styles";
import { heroGlassPanel } from "@/lib/hero-styles";
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
      {isOverlay ? (
        <HeroButton
          type="button"
          variant="icon"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
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
        </HeroButton>
      ) : (
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
      )}

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
            isOverlay ? cn("rounded-3xl px-6 py-6 text-white", heroGlassPanel) : "glass-capsule",
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
              {isOverlay ? (
                <>
                  <HeroButton
                    href={heroContent.navCtas.login.href}
                    variant="ghost"
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    {heroContent.navCtas.login.label}
                  </HeroButton>
                  <HeroButton
                    href={heroContent.navCtas.getStarted.href}
                    variant="primary"
                    className="w-full"
                    onClick={() => setOpen(false)}
                  >
                    {heroContent.navCtas.getStarted.label}
                  </HeroButton>
                </>
              ) : (
                <>
                  <Button
                    href={heroContent.navCtas.login.href}
                    variant="glass"
                    size="lg"
                    className="w-full justify-center"
                    onClick={() => setOpen(false)}
                  >
                    {heroContent.navCtas.login.label}
                  </Button>
                  <Button
                    href={heroContent.navCtas.getStarted.href}
                    variant="primary"
                    size="lg"
                    className="w-full justify-center"
                    onClick={() => setOpen(false)}
                  >
                    {heroContent.navCtas.getStarted.label}
                  </Button>
                </>
              )}
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
