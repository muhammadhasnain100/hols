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
          <p className="text-brand-caption mb-5 uppercase tracking-[0.32em] text-primary-light">
            {eyebrow}
          </p>
        </div>

        <div className="hero-reveal">
          {/* Google Sans Bold · 60px */}
          <h1 className="font-sans text-brand-heading text-primary">{headline}</h1>
        </div>

        <div className="hero-reveal">
          {/* Gilroy Light · 18px */}
          <p className="font-body text-brand-body mx-auto mt-8 max-w-2xl text-primary/75">
            {subhead}
          </p>
        </div>
      </FadeIn>
    </div>
  );
}
