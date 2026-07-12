"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import {
  whoItsForMockups,
  type WhoItsForMockupId,
} from "@/components/illustrations/WhoItsForMockups";
import { Container } from "@/components/ui/Container";
import { landingContent } from "@/content/landing";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

function AudienceCard({
  id,
  title,
  description,
  index,
  className,
}: {
  id: WhoItsForMockupId;
  title: string;
  description: string;
  index: number;
  className?: string;
}) {
  const Mockup = whoItsForMockups[id];

  return (
    <article
      className={cn(
        "who-audience-card group overflow-hidden rounded-3xl border border-border/50 bg-white shadow-[0_8px_30px_rgba(21,39,68,0.06)]",
        className,
      )}
    >
      <div className="border-b border-border/40 bg-primary/[0.02] p-4">
        <Mockup className="h-auto w-full" />
      </div>
      <div className="p-6 md:p-7">
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-primary-light">
          0{index + 1}
        </span>
        <h3 className="mt-3 font-sans text-xl font-semibold text-primary">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">{description}</p>
      </div>
    </article>
  );
}

function WhoItsForStatic() {
  const { whoItsFor } = landingContent;

  return (
    <section id="who-its-for" className="bg-background py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-primary-light">
            {whoItsFor.eyebrow}
          </p>
          <h2 className="text-brand-subheading text-primary">{whoItsFor.headline}</h2>
        </div>
        <div className="relative mx-auto mt-16 max-w-5xl space-y-12 pl-10 md:pl-0">
          <div className="absolute bottom-0 left-4 top-0 w-px bg-primary/15 md:left-1/2 md:-translate-x-1/2" />
          {whoItsFor.audiences.map((audience, index) => (
            <div
              key={audience.id}
              className={cn(
                "relative md:grid md:grid-cols-2 md:items-center md:gap-12",
                index % 2 === 0 ? "" : "",
              )}
            >
              <span className="absolute left-4 top-8 z-10 h-3 w-3 -translate-x-1/2 rounded-full border-2 border-white bg-accent md:left-1/2" />
              <div className={cn(index % 2 === 0 ? "md:pr-10" : "md:col-start-2 md:pl-10")}>
                <AudienceCard
                  id={audience.id as WhoItsForMockupId}
                  title={audience.title}
                  description={audience.description}
                  index={index}
                />
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

export function WhoItsForSection() {
  const { whoItsFor } = landingContent;
  const [reduceMotion, setReduceMotion] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const line = lineRef.current;
      const cards = cardRefs.current.filter(Boolean);

      if (line && cards.length) {
        gsap.fromTo(
          line,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: "none",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 60%",
              end: "bottom 40%",
              scrub: 1,
            },
          },
        );
      }

      cards.forEach((card, index) => {
        const fromX = index % 2 === 0 ? -56 : 56;

        gsap.fromTo(
          card,
          { autoAlpha: 0, x: fromX, y: 32 },
          {
            autoAlpha: 1,
            x: 0,
            y: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );

  if (reduceMotion) {
    return <WhoItsForStatic />;
  }

  return (
    <section ref={sectionRef} id="who-its-for" className="relative bg-background py-20 md:py-28">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-primary-light">
            {whoItsFor.eyebrow}
          </p>
          <h2 className="text-brand-subheading text-primary">{whoItsFor.headline}</h2>
        </div>

        <div className="relative mx-auto mt-16 max-w-5xl md:mt-20">
          {/* Long vertical line */}
          <div
            aria-hidden
            className="absolute bottom-0 left-4 top-0 w-px bg-primary/10 md:left-1/2 md:-translate-x-1/2"
          >
            <div
              ref={lineRef}
              className="h-full w-full origin-top bg-primary/40"
            />
          </div>

          <div className="space-y-20 md:space-y-28">
            {whoItsFor.audiences.map((audience, index) => {
              const isLeft = index % 2 === 0;

              return (
                <div
                  key={audience.id}
                  className="relative md:grid md:grid-cols-2 md:items-center md:gap-16"
                >
                  {/* Dot on the line */}
                  <span
                    aria-hidden
                    className="absolute left-4 top-10 z-10 h-3.5 w-3.5 -translate-x-1/2 rounded-full border-[3px] border-white bg-accent shadow-sm md:left-1/2"
                  />

                  {/* Left card slot */}
                  <div
                    ref={(el) => {
                      cardRefs.current[index] = el;
                    }}
                    className={cn(
                      "pl-10 md:pl-0",
                      isLeft ? "md:pr-12" : "md:col-start-2 md:pl-12",
                    )}
                  >
                    <AudienceCard
                      id={audience.id as WhoItsForMockupId}
                      title={audience.title}
                      description={audience.description}
                      index={index}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
