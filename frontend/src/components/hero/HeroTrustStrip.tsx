"use client";

import { FadeIn } from "@/components/animations/ScrollReveal";
import { heroContent } from "@/content/hero";

export function HeroTrustStrip() {
  return (
    <div className="relative z-10 w-full px-6 pb-10 md:px-10 md:pb-14">
      <FadeIn
        className="mx-auto flex max-w-4xl flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4"
        stagger={0.08}
        y={16}
        duration={0.7}
      >
        {heroContent.trustStrip.map((item) => (
          <div
            key={item}
            className="hero-reveal rounded-full border border-primary/10 bg-white/80 px-5 py-3 text-sm font-medium text-primary/80 shadow-[0_8px_32px_rgba(21,39,68,0.08)] backdrop-blur-md"
          >
            {item}
          </div>
        ))}
      </FadeIn>
    </div>
  );
}
