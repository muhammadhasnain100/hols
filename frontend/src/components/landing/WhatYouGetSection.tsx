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
/** Matches Tailwind `xl` — zigzag layout only when half-rail fits card + connector */
const DESKTOP_MQ = "(min-width: 1280px)";

/** Straight horizontal connector from center spine to card (desktop zigzag only) */
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
      className={cn(
        "h-10 w-full min-w-[3.5rem] max-w-[7rem] shrink sm:h-12 sm:max-w-[9rem] xl:h-14 xl:max-w-[11rem] 2xl:max-w-[13rem]",
        className,
      )}
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
        "w-full rounded-2xl p-4 text-left sm:p-5",
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
          sizes="(max-width: 639px) 92vw, (max-width: 1279px) 28rem, 20rem"
        />
      </div>
      <div className="mt-3 space-y-2 sm:mt-4">
        <h3 className="font-sans text-base font-bold leading-[1.2] tracking-[0.005em] text-white sm:text-lg">
          {card.title}
        </h3>
        <p className="text-brand-body text-sm leading-relaxed text-white/80 sm:text-[0.95rem]">
          {card.description}
        </p>
      </div>
    </article>
  );
}

function StepBadge({ label, className }: { label: string; className?: string }) {
  return (
    <span
      className={cn(
        "relative z-20 inline-flex min-w-[6.5rem] shrink-0 items-center justify-center rounded-full bg-accent px-4 py-2 text-brand-caption font-semibold uppercase tracking-[0.12em] text-primary sm:min-w-[7.5rem] sm:px-5 sm:py-2.5 md:min-w-[8.5rem] md:px-6",
        className,
      )}
    >
      {label}
    </span>
  );
}

/** Phones + tablets: stacked card under badge */
function StackedStep({ card, isLast }: { card: Card; isLast: boolean }) {
  return (
    <div className="relative flex w-full flex-col items-center">
      <StepBadge label={card.step} />
      <div
        aria-hidden
        className="my-4 h-8 w-[2px] bg-[repeating-linear-gradient(to_bottom,var(--brand-baby-blue)_0_4px,transparent_4px_11px)] sm:my-5 sm:h-10"
      />
      <StepCard card={card} className="w-full max-w-md sm:max-w-lg" />
      {!isLast ? (
        <div
          aria-hidden
          className="mt-6 h-10 w-[2px] bg-[repeating-linear-gradient(to_bottom,var(--brand-baby-blue)_0_4px,transparent_4px_11px)] sm:mt-8 sm:h-12"
        />
      ) : null}
    </div>
  );
}

/** Large desktops: card + connector left/right of center badge */
function ZigzagStep({
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
    <div className="flex w-full items-center gap-1 xl:gap-2">
      <div className="flex min-w-0 flex-1 justify-end">
        {isLeft ? (
          <div className="flex min-w-0 max-w-full items-center">
            <StepCard
              card={card}
              className="min-w-0 max-w-[16rem] xl:max-w-[18rem] 2xl:max-w-xs"
            />
            <StraightConnector
              side="left"
              onPathRef={onConnectorPathRef}
              className="mx-1 xl:mx-2"
            />
          </div>
        ) : null}
      </div>

      <StepBadge label={card.step} />

      <div className="flex min-w-0 flex-1 justify-start">
        {!isLeft ? (
          <div className="flex min-w-0 max-w-full items-center">
            <StraightConnector
              side="right"
              onPathRef={onConnectorPathRef}
              className="mx-1 xl:mx-2"
            />
            <StepCard
              card={card}
              className="min-w-0 max-w-[16rem] xl:max-w-[18rem] 2xl:max-w-xs"
            />
          </div>
        ) : null}
      </div>
    </div>
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
    <div className="mx-auto w-full max-w-4xl shrink-0 px-1 text-center sm:px-0">
      <h2 className="font-sans text-[1.5rem] font-bold leading-[1.12] tracking-[0.01em] text-accent sm:text-[2.125rem] sm:leading-[1.08] md:text-[2.75rem] lg:text-[3.25rem] xl:text-[3.75rem] xl:leading-[1.05]">
        <span className="block">{headlineLines[0]}</span>
        <span className="block">{headlineLines[1]}</span>
      </h2>
      <div
        className={cn(
          "text-brand-caption mt-5 inline-flex max-w-full items-center justify-center rounded-full px-5 py-2 font-medium uppercase tracking-[0.08em] text-white sm:mt-6 sm:px-6 sm:py-2.5 md:mt-8 md:px-7",
          heroGlassPanel,
        )}
      >
        {label}
      </div>
    </div>
  );
}

function bindStepReveal(
  steps: HTMLElement[],
  lineFill: HTMLElement | null,
  connectors: (SVGPathElement | null)[],
  animateConnectors: boolean,
) {
  if (steps.length === 0) return;

  gsap.set(steps, { autoAlpha: 1, y: 0 });

  if (lineFill) {
    gsap.set(lineFill, { scaleY: 0, transformOrigin: "top center" });
  }

  if (animateConnectors) {
    connectors.forEach((path) => {
      if (!path) return;
      const len = path.getTotalLength();
      gsap.set(path, {
        strokeDasharray: "5 7",
        strokeDashoffset: len,
        opacity: 0.95,
      });
    });
  }

  const triggerEl = steps[0]?.closest("[data-wyg-timeline]") ?? steps[0];

  const scrollTimeline = gsap.timeline({
    scrollTrigger: {
      trigger: triggerEl,
      start: "top 78%",
      end: "bottom 32%",
      scrub: 0.65,
      invalidateOnRefresh: true,
    },
  });

  if (lineFill) {
    scrollTimeline.to(
      lineFill,
      { scaleY: 1, ease: "none", duration: steps.length },
      0,
    );
  }

  steps.forEach((step, index) => {
    scrollTimeline.fromTo(
      step,
      { autoAlpha: 0, y: 36 },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.65,
        ease: "power2.out",
        immediateRender: false,
      },
      index * 0.85 + 0.12,
    );

    const path = connectors[index];
    if (animateConnectors && path) {
      scrollTimeline.to(
        path,
        { strokeDashoffset: 0, duration: 0.55, ease: "power2.out" },
        index * 0.85 + 0.18,
      );
    }
  });
}

export function WhatYouGetSection() {
  const { whatYouGet } = landingContent;
  const [reduceMotion, setReduceMotion] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const zigzagRef = useRef<HTMLDivElement>(null);
  const lineFillRef = useRef<HTMLDivElement>(null);
  const connectorRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const mm = gsap.matchMedia();

      mm.add(DESKTOP_MQ, () => {
        const root = zigzagRef.current;
        const lineFill = lineFillRef.current;
        if (!root) return;

        const steps = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll("[data-wyg-step]"),
        );
        bindStepReveal(steps, lineFill, connectorRefs.current, true);
      });

      mm.add(`(max-width: 1279px)`, () => {
        const root = stackRef.current;
        if (!root) return;

        const steps = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll("[data-wyg-step]"),
        );
        bindStepReveal(steps, null, [], false);
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());

      return () => {
        mm.revert();
      };
    },
    { scope: sectionRef, dependencies: [reduceMotion, whatYouGet.cards.length] },
  );

  return (
    <section
      ref={sectionRef}
      id="what-you-get"
      className="relative isolate overflow-x-clip bg-primary"
    >
      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 py-12 sm:px-5 sm:py-16 md:px-8 md:py-20 lg:max-w-7xl lg:py-24">
        <SectionHeader
          headlineLines={whatYouGet.headlineLines}
          label={whatYouGet.label}
        />

        {/* Stacked: phones + tablets + small laptops */}
        <div
          ref={stackRef}
          data-wyg-timeline
          className="relative mx-auto mt-8 w-full max-w-lg md:mt-10 xl:hidden"
        >
          {whatYouGet.cards.map((card, index) => (
            <div
              key={card.id}
              data-wyg-step
              className="relative py-2 will-change-transform sm:py-3"
              style={reduceMotion ? { opacity: 1 } : undefined}
            >
              <StackedStep
                card={card}
                isLast={index === whatYouGet.cards.length - 1}
              />
            </div>
          ))}
        </div>

        {/* Zigzag: xl+ only — enough half-rail for card + connector */}
        <div
          ref={zigzagRef}
          data-wyg-timeline
          className="relative mx-auto mt-10 hidden w-full max-w-5xl overflow-visible xl:mt-12 xl:block 2xl:max-w-6xl"
        >
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
              className="relative py-12 will-change-transform 2xl:py-14"
              style={reduceMotion ? { opacity: 1 } : undefined}
            >
              <ZigzagStep
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
