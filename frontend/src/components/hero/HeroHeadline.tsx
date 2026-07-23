"use client";

import { FadeIn } from "@/components/animations/ScrollReveal";
import { HeroButton } from "@/components/hero/HeroButton";
import { heroContent } from "@/content/hero";
import { heroCtaSeparator, heroTypography } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

export function HeroHeadline() {
  const { headlineLines, body, primaryCta, secondaryCta } = heroContent;

  return (
    <div className="relative w-full md:ml-auto md:text-left">
      <FadeIn className="relative text-left" stagger={0.14} y={40}>
        <div className="hero-reveal">
          <h1 className={heroTypography.headline}>
            <span className="block md:whitespace-nowrap">{headlineLines[0]}</span>
            <span className="block md:whitespace-nowrap">{headlineLines[1]}</span>
          </h1>
        </div>

        <div className="hero-reveal">
          <p className={heroTypography.body}>{body}</p>
        </div>

        <div className="hero-reveal mt-6 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap sm:items-center md:mt-10">
          <HeroButton
            href={primaryCta.href}
            variant="primary"
            className="w-full justify-center sm:w-auto"
          >
            {primaryCta.label}
          </HeroButton>
          <span aria-hidden className={cn(heroCtaSeparator, "hidden sm:inline")}>
            ·
          </span>
          <HeroButton
            href={secondaryCta.href}
            variant="secondary"
            className="w-full justify-center sm:w-auto"
          >
            {secondaryCta.label}
          </HeroButton>
        </div>
      </FadeIn>
    </div>
  );
}
