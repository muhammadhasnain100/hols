"use client";

import { FadeIn } from "@/components/animations/ScrollReveal";
import { heroContent } from "@/content/hero";

export function HeroHeadline() {
  const { eyebrow, headline, subhead } = heroContent;

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-[-10%] top-[-20%] bottom-[-10%] rounded-[3rem] bg-white/45 blur-3xl"
      />

      <FadeIn className="relative text-center" stagger={0.12} y={36}>
        <div className="hero-reveal">
          <p className="mb-5 font-sans text-xs font-semibold uppercase tracking-[0.32em] text-primary-light md:text-sm">
            {eyebrow}
          </p>
        </div>

        <div className="hero-reveal">
          <h1 className="font-serif text-4xl leading-[1.08] text-primary md:text-6xl lg:text-7xl">
            {headline}
          </h1>
        </div>

        <div className="hero-reveal">
          <p className="mx-auto mt-8 max-w-2xl text-base leading-relaxed text-primary/75 md:text-lg">
            {subhead}
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
