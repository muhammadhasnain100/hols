"use client";

import { Button } from "@/components/ui/Button";
import { FadeIn } from "@/components/animations/ScrollReveal";
import { heroContent } from "@/content/hero";

export function HeroCTAs() {
  const { primaryCta, secondaryCta } = heroContent;

  return (
    <FadeIn className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-5">
      <Button
        href={primaryCta.href}
        variant="primary"
        size="lg"
        className="hero-reveal"
      >
        {primaryCta.label}
      </Button>
      <Button
        href={secondaryCta.href}
        variant="secondary"
        size="lg"
        className="hero-reveal"
      >
        {secondaryCta.label}
      </Button>
    </FadeIn>
  );
}
