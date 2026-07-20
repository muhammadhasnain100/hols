"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { HeroButton } from "@/components/hero/HeroButton";
import { HeroLogo } from "@/components/hero/HeroLogo";
import { HeroNavCapsule } from "@/components/hero/HeroNavCapsule";
import { HeroNavbarMobile } from "@/components/hero/HeroNavbarMobile";
import { mainNav } from "@/content/navigation";
import { heroContent } from "@/content/hero";
import {
  getHeroNavCapsuleLinkClass,
  heroCtaSeparator,
  heroLayout,
  heroNavCapsule,
} from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

type HeroNavbarProps = {
  variant?: "landing" | "page" | "overlay";
};

function OverlayNavLinks() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className={cn("items-center", heroNavCapsule)}
    >
      {mainNav.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={getHeroNavCapsuleLinkClass(isActive)}
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
        {/* Desktop */}
        <div
          className={cn(
            "hidden w-full items-center md:grid md:grid-cols-[auto_1fr_auto]",
            heroLayout.nav.shell,
          )}
        >
          <HeroLogo variant="light" className="h-9 shrink-0 md:h-10" />

          <div className="flex justify-center">
            <OverlayNavLinks />
          </div>

          <div className="flex items-center justify-end gap-3">
            <HeroButton
              href={heroContent.navCtas.login.href}
              variant="ghost"
              className="shrink-0"
            >
              {heroContent.navCtas.login.label}
            </HeroButton>
            <span aria-hidden className={heroCtaSeparator}>
              ·
            </span>
            <HeroButton
              href={heroContent.navCtas.getStarted.href}
              variant="primary"
              className="shrink-0"
            >
              {heroContent.navCtas.getStarted.label}
            </HeroButton>
          </div>
        </div>

        {/* Mobile */}
        <div
          className={cn(
            "flex w-full items-center justify-between gap-4 md:hidden",
            heroLayout.nav.shell,
          )}
        >
          <HeroLogo variant="light" className="h-9 shrink-0" />
          <HeroNavbarMobile tone="overlay" />
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
            <Button href={heroContent.navCtas.login.href} variant="glass" size="lg">
              {heroContent.navCtas.login.label}
            </Button>
            <Button href={heroContent.navCtas.getStarted.href} variant="primary" size="lg">
              {heroContent.navCtas.getStarted.label}
            </Button>
          </div>
        </div>

        {/* Mobile */}
        <div className="flex items-center justify-between gap-3 md:hidden">
          <HeroNavbarMobile />
          <HeroLogo variant="dark" compact className="h-8" />
          <Button
            href={heroContent.navCtas.getStarted.href}
            variant="primary"
            size="lg"
            className="min-w-[5.5rem] justify-center"
          >
            Start
          </Button>
        </div>
      </div>
    </header>
  );
}
