"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { pillarMockups } from "@/components/illustrations/PillarsMockups";
import { Container } from "@/components/ui/Container";
import { featuresContent } from "@/content/features";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

function FeatureBlock({
  id,
  mockup,
  title,
  headline,
  body,
  reversed,
}: (typeof featuresContent.sections)[number] & { reversed: boolean }) {
  const Mockup = pillarMockups[mockup];

  return (
    <article
      id={id}
      data-feature-block
      className={cn(
        "grid items-center gap-8 md:gap-12 lg:grid-cols-2 lg:gap-16",
        reversed && "lg:[&>*:first-child]:order-2",
      )}
    >
      <div className="overflow-hidden rounded-3xl border border-border/50 bg-white">
        <div className="border-b border-border/40 bg-primary/[0.02] p-4 md:p-5">
          <Mockup className="h-auto w-full" />
        </div>
      </div>

      <div>
        <p className="text-brand-caption font-medium uppercase tracking-[0.22em] text-primary-light">
          {title}
        </p>
        <h2 className="mt-3 font-sans text-2xl font-semibold leading-snug text-primary md:text-3xl">
          {headline}
        </h2>
        <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">
          {body}
        </p>
      </div>
    </article>
  );
}

export function FeaturesSection() {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !sectionRef.current) return;

      const blocks = sectionRef.current.querySelectorAll("[data-feature-block]");

      blocks.forEach((block) => {
        gsap.fromTo(
          block,
          { autoAlpha: 0, y: 40 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.75,
            ease: "power3.out",
            scrollTrigger: {
              trigger: block,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="bg-background py-12 md:py-16">
      <Container>
        <div className="space-y-20 md:space-y-28">
          {featuresContent.sections.map((feature, index) => (
            <FeatureBlock key={feature.id} {...feature} reversed={index % 2 === 1} />
          ))}
        </div>
      </Container>
    </section>
  );
}
