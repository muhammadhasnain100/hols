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
  /** Fixed scrolled desktop control — light glass + dark text for white sections. */
  floating?: boolean;
};

function MenuIcon({ open }: { open: boolean }) {
  return (
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
  );
}

export function HeroNavbarMobile({
  tone = "default",
  floating = false,
}: HeroNavbarMobileProps) {
  const [open, setOpen] = useState(false);
  const { setPaused } = useSmoothScroll();
  const isOverlay = tone === "overlay" && !floating;
  // Scrolled floating menu sits over light sections — use light glass + dark text.
  const isLightGlass = floating || tone === "default";

  useEffect(() => {
    setPaused(open);
  }, [open, setPaused]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className="relative z-50">
      {floating ? (
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((prev) => !prev)}
          className={cn(
            "inline-flex h-11 w-11 items-center justify-center rounded-full border border-primary/15 bg-white text-primary shadow-sm",
            "transition-colors duration-300 hover:bg-white",
          )}
        >
          <MenuIcon open={open} />
        </button>
      ) : isOverlay ? (
        <HeroButton
          type="button"
          variant="icon"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((prev) => !prev)}
        >
          <MenuIcon open={open} />
        </HeroButton>
      ) : (
        <button
          type="button"
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((prev) => !prev)}
          className={getButtonClassName("glass", "h-10 w-10 p-0", "sm")}
        >
          <MenuIcon open={open} />
        </button>
      )}

      {open ? (
        <>
          <button
            type="button"
            aria-label="Close menu"
            className={cn(
              "fixed inset-0 z-40 cursor-default",
              isLightGlass ? "bg-primary/10" : "bg-black/25",
            )}
            onClick={() => setOpen(false)}
          />
          <div
            data-lenis-prevent
            className="fixed inset-x-4 top-20 z-50 sm:inset-x-auto sm:right-6 sm:w-[min(22rem,calc(100vw-3rem))]"
          >
            <div
              className={cn(
                "rounded-3xl px-6 py-6",
                isLightGlass ? "border border-primary/15 bg-white text-primary shadow-lg" : cn("text-white", heroGlassPanel),
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
                      isLightGlass
                        ? "text-primary/85 hover:text-primary"
                        : "text-white/85 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
                <div
                  className={cn(
                    "mt-4 flex flex-col gap-3 border-t pt-4",
                    isLightGlass ? "border-primary/10" : "border-white/15",
                  )}
                >
                  {isLightGlass ? (
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
                  ) : (
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
                  )}
                </div>
              </nav>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
