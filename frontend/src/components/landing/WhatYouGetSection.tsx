"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { landingContent } from "@/content/landing";
import { brand } from "@/config/brand";
import { heroGlassPanel } from "@/lib/hero-styles";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Card = (typeof landingContent.whatYouGet.cards)[number];

const STEP_SIDES: Array<"left" | "right"> = ["right", "left", "right"];
const CYAN = brand.colors.accent.babyBlue;

/** Straight horizontal connector from center spine to card */
function StraightConnector({
  side,
  onPathRef,
  className,
}: {
  side: "left" | "right";
  onPathRef: (el: SVGPathElement | null) => void;
  className?: string;
}) {
  const path = side === "left" ? "M 200 28 H 0" : "M 0 28 H 200";

  return (
    <svg
      aria-hidden
      viewBox="0 0 200 56"
      fill="none"
      preserveAspectRatio="none"
      className={cn("h-14 w-full max-w-[11rem] shrink-0 xl:max-w-[13rem]", className)}
    >
      <path
        ref={onPathRef}
        d={path}
        stroke={CYAN}
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeDasharray="5 7"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function StepCard({ card, className }: { card: Card; className?: string }) {
  return (
    <article
      className={cn(
        "w-full max-w-[15rem] rounded-2xl p-4 text-left sm:max-w-[17rem] lg:max-w-xs",
        heroGlassPanel,
        className,
      )}
    >
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl border border-white/15">
        <Image
          src={card.image}
          alt={card.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 85vw, 17rem"
        />
      </div>
      <div className="mt-3 space-y-2">
        <h3 className="font-sans text-base font-bold leading-[1.15] tracking-[0.005em] text-white md:text-lg">
          {card.title}
        </h3>
        <p className="font-sans text-sm leading-relaxed text-white/80">{card.description}</p>
      </div>
    </article>
  );
}

function StepBadge({ label }: { label: string }) {
  return (
    <span className="relative z-20 inline-flex min-w-[7.5rem] shrink-0 items-center justify-center rounded-full bg-accent px-5 py-2.5 text-brand-caption font-semibold uppercase tracking-[0.12em] text-primary md:min-w-[8.5rem] md:px-6">
      {label}
    </span>
  );
}

function TimelineStep({
  card,
  side,
  onConnectorPathRef,
}: {
  card: Card;
  side: "left" | "right";
  onConnectorPathRef: (el: SVGPathElement | null) => void;
}) {
  const isLeft = side === "left";

  return (
    <>
      <div className="hidden w-full items-center lg:flex">
        <div className="flex min-w-0 flex-1 justify-end pr-1">
          {isLeft ? (
            <div className="flex items-center gap-0">
              <StepCard card={card} />
              <StraightConnector side="left" onPathRef={onConnectorPathRef} className="mx-1" />
            </div>
          ) : null}
        </div>

        <StepBadge label={card.step} />

        <div className="flex min-w-0 flex-1 justify-start pl-1">
          {!isLeft ? (
            <div className="flex items-center gap-0">
              <StraightConnector side="right" onPathRef={onConnectorPathRef} className="mx-1" />
              <StepCard card={card} />
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 lg:hidden">
        <StepBadge label={card.step} />
        <div
          aria-hidden
          className="h-10 w-[2px] bg-[repeating-linear-gradient(to_bottom,var(--brand-baby-blue)_0_4px,transparent_4px_11px)]"
        />
        <StepCard card={card} className="max-w-sm" />
      </div>
    </>
  );
}

function SectionHeader({
  headlineLines,
  label,
}: {
  headlineLines: readonly [string, string];
  label: string;
}) {
  return (
    <div className="mx-auto max-w-4xl shrink-0 text-center">
      <h2 className="font-sans text-[1.75rem] font-bold leading-[1.08] tracking-[0.01em] text-accent sm:text-[2.25rem] md:text-[3.75rem] md:leading-[1.05]">
        <span className="block">{headlineLines[0]}</span>
        <span className="block">{headlineLines[1]}</span>
      </h2>
      <div
        className={cn(
          "text-brand-caption mt-6 inline-flex items-center justify-center rounded-full px-6 py-2.5 font-medium uppercase tracking-[0.08em] text-white md:mt-8 md:px-7",
          heroGlassPanel,
        )}
      >
        {label}
      </div>
    </div>
  );
}

export function WhatYouGetSection() {
  const { whatYouGet } = landingContent;
  const [reduceMotion, setReduceMotion] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const lineFillRef = useRef<HTMLDivElement>(null);
  const connectorRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const timeline = timelineRef.current;
      const lineFill = lineFillRef.current;

      if (!timeline || !lineFill) return;

      const steps = gsap.utils.toArray<HTMLElement>(
        timeline.querySelectorAll("[data-wyg-step]"),
      );

      if (steps.length === 0) return;

      gsap.set(lineFill, { scaleY: 0, transformOrigin: "top center" });
      gsap.set(steps, { autoAlpha: 0, y: 40 });

      connectorRefs.current.forEach((path) => {
        if (!path) return;
        const len = path.getTotalLength();
        gsap.set(path, {
          strokeDasharray: "5 7",
          strokeDashoffset: len,
          opacity: 0.95,
        });
      });

      const scrollTimeline = gsap.timeline({
        scrollTrigger: {
          trigger: timeline,
          start: "top 72%",
          end: "bottom 28%",
          scrub: 0.65,
          invalidateOnRefresh: true,
        },
      });

      scrollTimeline.to(
        lineFill,
        { scaleY: 1, ease: "none", duration: steps.length },
        0,
      );

      steps.forEach((step, index) => {
        const path = connectorRefs.current[index];

        scrollTimeline.fromTo(
          step,
          { autoAlpha: 0, y: 40 },
          { autoAlpha: 1, y: 0, duration: 0.65, ease: "power2.out" },
          index * 0.85 + 0.15,
        );

        if (path) {
          scrollTimeline.to(
            path,
            { strokeDashoffset: 0, duration: 0.55, ease: "power2.out" },
            index * 0.85 + 0.2,
          );
        }
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef, dependencies: [reduceMotion, whatYouGet.cards.length] },
  );

  return (
    <section ref={sectionRef} id="what-you-get" className="relative isolate overflow-hidden bg-primary">
      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-5 py-16 md:px-8 md:py-20 lg:max-w-7xl lg:py-24">
        <SectionHeader headlineLines={whatYouGet.headlineLines} label={whatYouGet.label} />

        <div ref={timelineRef} className="relative mx-auto mt-8 w-full overflow-visible md:mt-10">
          <div
            className="pointer-events-none absolute left-1/2 top-0 z-0 h-full w-px -translate-x-1/2 bg-white/15"
            aria-hidden
          >
            <div
              ref={lineFillRef}
              className="h-full w-full origin-top bg-accent"
              style={reduceMotion ? { transform: "scaleY(1)" } : undefined}
            />
          </div>

          {whatYouGet.cards.map((card, index) => (
            <div
              key={card.id}
              data-wyg-step
              className="relative py-10 will-change-transform md:py-14"
              style={reduceMotion ? { opacity: 1 } : undefined}
            >
              <TimelineStep
                card={card}
                side={STEP_SIDES[index] ?? "right"}
                onConnectorPathRef={(el) => {
                  connectorRefs.current[index] = el;
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
