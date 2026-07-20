"use client";

import { FadeIn } from "@/components/animations/ScrollReveal";
import { HeroButton } from "@/components/hero/HeroButton";
import { heroContent } from "@/content/hero";
import { heroCtaSeparator } from "@/lib/hero-styles";

export function HeroHeadline() {
  const { headline, subhead, primaryCta, secondaryCta } = heroContent;

  return (
    <div className="relative w-full max-w-xl md:max-w-xl lg:max-w-[34rem] lg:shrink-0">
      <FadeIn className="relative text-left" stagger={0.14} y={40}>
        <div className="hero-reveal">
          <h1 className="font-sans text-[2rem] font-bold leading-[1.08] tracking-[-0.01em] text-white sm:text-4xl md:text-[2.75rem] lg:text-[3.1rem]">
            {headline}
          </h1>
        </div>

        <div className="hero-reveal">
          <p className="font-body mt-5 max-w-lg text-base leading-relaxed text-white/80 md:text-lg">
            {subhead}
          </p>
        </div>

        <div className="hero-reveal mt-8 flex flex-wrap items-center gap-3">
          <HeroButton href={primaryCta.href} variant="primary">
            {primaryCta.label}
          </HeroButton>
          <span aria-hidden className={heroCtaSeparator}>
            ·
          </span>
          <HeroButton href={secondaryCta.href} variant="secondary">
            {secondaryCta.label}
          </HeroButton>
        </div>
      </FadeIn>
    </div>
  );
}
