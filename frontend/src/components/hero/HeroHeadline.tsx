"use client";

import Link from "next/link";
import { FadeIn } from "@/components/animations/ScrollReveal";
import { heroContent } from "@/content/hero";

export function HeroHeadline() {
  const { headline, subhead, secondaryCta } = heroContent;

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

        <div className="hero-reveal mt-8">
          <Link
            href={secondaryCta.href}
            className="group inline-flex items-center gap-3 font-sans text-sm font-medium text-white transition-colors duration-300 hover:text-accent"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-sm bg-accent text-primary transition-transform duration-300 group-hover:translate-x-0.5">
              <span aria-hidden className="text-base leading-none">
                →
              </span>
            </span>
            {secondaryCta.label}
          </Link>
        </div>
      </FadeIn>
    </div>
  );
}
