"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { pillarMockups, type PillarMockupId } from "@/components/illustrations/PillarsMockups";
import { Container } from "@/components/ui/Container";
import { landingContent } from "@/content/landing";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

function PillarCard({
  id,
  title,
  description,
}: {
  id: PillarMockupId;
  title: string;
  description: string;
}) {
  const Mockup = pillarMockups[id];

  return (
    <article className="flex w-full shrink-0 flex-col overflow-hidden rounded-3xl border border-border/50 bg-white shadow-[0_8px_30px_rgba(21,39,68,0.07)]">
      <div className="border-b border-border/40 bg-primary/[0.02] p-4">
        <Mockup className="h-auto w-full" />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <h3 className="font-sans text-lg font-semibold text-primary">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted">{description}</p>
      </div>
    </article>
  );
}

function PillarsSectionStatic() {
  const { pillars } = landingContent;

  return (
    <section id="everything-inside" className="bg-background py-16 md:py-24">
      <Container>
        <h2 className="text-brand-subheading text-center text-primary">{pillars.headline}</h2>
        <div className="mt-12 flex gap-6 overflow-x-auto pb-4">
          {pillars.items.map((item) => (
            <div key={item.id} className="w-[85vw] shrink-0 sm:w-[360px]">
              <PillarCard
                id={item.id as PillarMockupId}
                title={item.title}
                description={item.description}
              />
            </div>
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href={pillars.cta.href}
            className="inline-flex items-center gap-2 font-sans text-sm font-medium text-primary-light transition-colors hover:text-primary"
          >
            {pillars.cta.label}
            <span aria-hidden>→</span>
          </Link>
        </div>
      </Container>
    </section>
  );
}

export function PillarsSection() {
  const { pillars } = landingContent;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const cardCount = pillars.items.length;

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const pinWrap = pinWrapRef.current;
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!pinWrap || !viewport || !track) return;

      const getStep = () => viewport.offsetWidth;
      const getScrollEnd = () => window.innerHeight * (cardCount - 1);

      gsap.to(track, {
        x: () => -getStep() * (cardCount - 1),
        ease: "none",
        scrollTrigger: {
          trigger: pinWrap,
          start: "top top",
          end: () => `+=${getScrollEnd()}`,
          pin: pinWrap,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: {
            snapTo: (value) => {
              const step = 1 / (cardCount - 1);
              return Math.round(value / step) * step;
            },
            duration: { min: 0.15, max: 0.35 },
            ease: "power1.inOut",
          },
          onUpdate: (self) => {
            const index = Math.round(self.progress * (cardCount - 1));
            setActiveIndex(index);
          },
        },
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef, dependencies: [reduceMotion, cardCount] },
  );

  if (reduceMotion) {
    return <PillarsSectionStatic />;
  }

  return (
    <section ref={sectionRef} id="everything-inside" className="relative bg-background">
      <div ref={pinWrapRef} className="flex min-h-[100dvh] flex-col justify-center bg-background py-16 md:py-20">
        <Container>
          <h2 className="text-brand-subheading text-center text-primary">{pillars.headline}</h2>

          <div ref={viewportRef} className="mx-auto mt-10 w-full max-w-md overflow-hidden md:mt-12 md:max-w-lg">
            <div ref={trackRef} className="flex will-change-transform">
              {pillars.items.map((item) => (
                <div key={item.id} className="w-full shrink-0 px-1">
                  <PillarCard
                    id={item.id as PillarMockupId}
                    title={item.title}
                    description={item.description}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 flex items-center justify-center gap-2 md:mt-10">
            {pillars.items.map((item, index) => (
              <span
                key={item.id}
                aria-hidden
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === activeIndex ? "w-8 bg-primary" : "w-2 bg-primary/20",
                )}
              />
            ))}
          </div>

          <p className="mt-4 text-center font-sans text-xs font-medium uppercase tracking-[0.2em] text-primary-light">
            {activeIndex + 1} / {cardCount}
          </p>
        </Container>
      </div>

      <Container>
        <ScrollReveal className="pb-16 text-center md:pb-24" delay={0.05}>
          <Link
            href={pillars.cta.href}
            className="inline-flex items-center gap-2 font-sans text-sm font-medium text-primary-light transition-colors hover:text-primary"
          >
            {pillars.cta.label}
            <span aria-hidden>→</span>
          </Link>
        </ScrollReveal>
      </Container>
    </section>
  );
}
