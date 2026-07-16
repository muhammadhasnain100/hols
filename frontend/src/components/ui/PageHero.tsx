"use client";

import { cn } from "@/lib/utils";
import { FadeIn } from "@/components/animations/ScrollReveal";

type PageHeroProps = {
  headline: string;
  subhead?: string;
  eyebrow?: string;
  className?: string;
  centered?: boolean;
  variant?: "default" | "landing";
};

export function PageHero({
  headline,
  subhead,
  eyebrow,
  className,
  centered = true,
  variant = "default",
}: PageHeroProps) {
  const isLandingStyle = variant === "landing";

  return (
    <div className={cn("relative mx-auto w-full max-w-5xl", className)}>
      {isLandingStyle && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-[-10%] top-[-20%] bottom-[-10%] rounded-[3rem] bg-white/45 blur-3xl"
        />
      )}

      <FadeIn
        className={cn("relative", centered && "text-center")}
        stagger={0.12}
        y={isLandingStyle ? 36 : 28}
      >
        {eyebrow && (
          <div className="hero-reveal">
            <p
              className={cn(
                "mb-5 font-sans text-xs font-semibold uppercase text-primary-light md:text-sm",
                isLandingStyle ? "tracking-[0.32em]" : "tracking-[0.2em]",
              )}
            >
              {eyebrow}
            </p>
          </div>
        )}
        <div className="hero-reveal">
          <h1 className="text-brand-heading text-primary">{headline}</h1>
        </div>
        {subhead && (
          <div className="hero-reveal">
            <p
              className={cn(
                "text-brand-body mx-auto mt-8 max-w-2xl",
                isLandingStyle ? "text-primary/75" : "text-muted",
              )}
            >
              {subhead}
            </p>
          </div>
        )}
      </FadeIn>
    </div>
  );
}
