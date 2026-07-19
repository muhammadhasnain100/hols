"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { HeroLogo } from "@/components/hero/HeroLogo";
import { HeroNavCapsule } from "@/components/hero/HeroNavCapsule";
import { HeroNavbarMobile } from "@/components/hero/HeroNavbarMobile";
import { mainNav } from "@/content/navigation";
import { cn } from "@/lib/utils";

type HeroNavbarProps = {
  variant?: "landing" | "page" | "overlay";
};

function OverlayNavLinks() {
  const pathname = usePathname();

  return (
    <nav aria-label="Main navigation" className="flex items-center gap-5 lg:gap-8">
      {mainNav.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "font-sans text-sm font-medium tracking-[0.01em] transition-colors duration-300",
              isActive ? "text-white" : "text-white/80 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function HeroNavbar({ variant = "landing" }: HeroNavbarProps) {
  const isLanding = variant === "landing";
  const isOverlay = variant === "overlay";

  if (isOverlay) {
    return (
      <header className="absolute inset-x-0 top-0 z-50">
        <div className="flex w-full items-center justify-between gap-4 px-4 py-5 md:px-5 md:py-6 lg:px-6">
          <HeroLogo variant="light" className="h-9 shrink-0 md:h-10" />

          <div className="hidden items-center gap-6 md:flex lg:gap-8">
            <OverlayNavLinks />
            <Link
              href="/register"
              className="inline-flex min-h-11 shrink-0 items-center gap-2.5 rounded-sm bg-accent px-5 py-2.5 font-sans text-sm font-semibold text-primary transition-transform duration-300 hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              <span aria-hidden className="text-base leading-none">
                →
              </span>
              Get Started
            </Link>
          </div>

          <div className="flex shrink-0 items-center md:hidden">
            <HeroNavbarMobile tone="overlay" />
          </div>
        </div>
      </header>
    );
  }

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
            <Button href="/register" variant="primary" size="lg">
              Get Started
            </Button>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex items-center justify-between gap-3 md:hidden">
          <HeroNavbarMobile />
          <HeroLogo variant="dark" compact className="h-8" />
          <Button href="/register" variant="primary" size="lg" className="min-w-[5.5rem] justify-center">
            Start
          </Button>
        </div>
      </div>
    </header>
  );
}
