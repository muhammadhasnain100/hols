"use client";

import { FadeIn } from "@/components/animations/ScrollReveal";
import { heroContent } from "@/content/hero";
import { heroLayout, heroTypography } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

type HeroTrustStripProps = {
  variant?: "default" | "overlay";
};

export function HeroTrustStrip({ variant = "default" }: HeroTrustStripProps) {
  const isOverlay = variant === "overlay";

  return (
    <div
      className={cn(
        "relative z-10 w-full",
        isOverlay ? heroLayout.trustStrip.shell : "px-6 pb-10 md:px-10 md:pb-14",
      )}
    >
      <FadeIn
        className={cn(
          "mx-auto w-full",
          isOverlay
            ? "max-w-4xl text-left sm:text-center"
            : "flex max-w-4xl flex-col items-center justify-center gap-3 sm:flex-row sm:gap-4",
        )}
        stagger={0.08}
        y={16}
        duration={0.7}
      >
        {isOverlay ? (
          <p className={cn("hero-reveal", heroTypography.trustStrip)}>
            {heroContent.trustStrip.join(" · ")}
          </p>
        ) : (
          heroContent.trustStrip.map((item) => (
            <div
              key={item}
              className="hero-reveal font-sans rounded-full border border-primary/10 bg-white/80 px-5 py-3 text-sm font-medium text-primary/80 shadow-[0_8px_32px_rgba(21,39,68,0.08)] backdrop-blur-md"
            >
              {item}
            </div>
          ))
        )}
      </FadeIn>
    </div>
  );
}
