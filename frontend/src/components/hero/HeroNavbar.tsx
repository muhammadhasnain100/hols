"use client";

import { Button } from "@/components/ui/Button";
import { HeroLogo } from "@/components/hero/HeroLogo";
import { HeroNavCapsule } from "@/components/hero/HeroNavCapsule";
import { HeroNavbarMobile } from "@/components/hero/HeroNavbarMobile";
import { cn } from "@/lib/utils";

type HeroNavbarProps = {
  variant?: "landing" | "page";
};

export function HeroNavbar({ variant = "landing" }: HeroNavbarProps) {
  const isLanding = variant === "landing";

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6 md:pt-5">
      <div
        className={cn(
          "mx-auto max-w-7xl",
          isLanding
            ? "rounded-full px-3 py-2.5"
            : "glass-capsule rounded-full px-4 py-2.5 md:px-6 md:py-3",
        )}
      >
        {/* Desktop */}
        <div className="hidden items-center gap-5 md:grid md:grid-cols-[auto_1fr_auto]">
          <HeroLogo variant="dark" className="h-10 shrink-0 md:h-11" />

          <div className="flex justify-center">
            <HeroNavCapsule />
          </div>

          <div className="flex shrink-0 items-center justify-end gap-3">
            <Button href="/login" variant="glass" size="lg">
              Log in
            </Button>
            <Button href="/contact" variant="primary" size="lg">
              Get Started
            </Button>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex items-center justify-between gap-3 md:hidden">
          <HeroNavbarMobile />
          <HeroLogo variant="dark" compact className="h-8" />
          <Button href="/contact" variant="primary" size="lg" className="min-w-[5.5rem] justify-center">
            Start
          </Button>
        </div>
      </div>
    </header>
  );
}
