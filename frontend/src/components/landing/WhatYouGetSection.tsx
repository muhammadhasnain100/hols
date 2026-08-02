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
/** Zigzag needs enough half-rail for card + connector — matches Tailwind `lg` */
const DESKTOP_MQ = "(min-width: 1024px)";

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
        "h-8 w-full min-w-[2.5rem] max-w-[5.5rem] shrink sm:h-10 sm:min-w-[3rem] sm:max-w-[7rem] lg:h-12 lg:max-w-[8.5rem] xl:h-14 xl:max-w-[11rem] 2xl:max-w-[13rem]",
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

function StepCard({
  card,
  className,
}: {
  card: Card;
  className?: string;
}) {
  return (
    <article
      className={cn(
        "group relative w-full min-w-0 overflow-hidden rounded-2xl text-left sm:rounded-[1.35rem]",
        "border border-white/25 bg-[linear-gradient(165deg,rgba(255,255,255,0.16)_0%,rgba(255,255,255,0.06)_45%,rgba(21,39,68,0.35)_100%)]",
        "shadow-[inset_0_1px_0_rgba(255,255,255,0.28)]",
        "backdrop-blur-2xl transition-[transform,box-shadow,border-color] duration-500 ease-out",
        "motion-safe:hover:-translate-y-1.5 motion-safe:hover:border-accent/45",
        "motion-safe:hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]",
        className,
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-4 top-0 z-20 h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent sm:inset-x-6 md:inset-x-8"
      />

      <div className="relative aspect-[16/10] w-full overflow-hidden sm:aspect-[4/3]">
        <Image
          src={card.image}
          alt={card.title}
          fill
          className="object-cover object-center transition-transform duration-700 ease-out motion-safe:group-hover:scale-[1.05]"
          sizes="(max-width: 639px) 92vw, (max-width: 1023px) 40rem, (max-width: 1279px) 20rem, 28rem"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-primary via-primary/25 to-transparent opacity-90"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-br from-accent/10 via-transparent to-transparent opacity-0 transition-opacity duration-500 motion-safe:group-hover:opacity-100"
        />
      </div>

      <div className="relative space-y-2.5 px-4 pb-4 pt-3.5 sm:space-y-3 sm:px-5 sm:pb-5 sm:pt-4 md:space-y-3.5 md:px-6 md:pb-6 md:pt-5 lg:px-6 lg:pb-6 xl:px-7 xl:pb-7">
        <div
          aria-hidden
          className="h-0.5 w-8 rounded-full bg-gradient-to-r from-accent to-accent/30 sm:w-10"
        />
        <h3 className="font-sans text-base font-bold leading-[1.2] tracking-[0.005em] text-white sm:text-lg md:text-xl xl:text-[1.4rem]">
          {card.title}
        </h3>
        <p className="text-brand-body text-sm leading-relaxed text-white/78 sm:text-[0.95rem] md:text-base">
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
        "relative z-20 inline-flex min-w-[5.5rem] shrink-0 items-center justify-center rounded-full bg-accent px-3.5 py-1.5 text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-primary sm:min-w-[6.5rem] sm:px-4 sm:py-2 sm:text-brand-caption md:min-w-[7.5rem] md:px-5 md:py-2.5 lg:min-w-[8rem] lg:px-5 xl:min-w-[8.5rem] xl:px-6",
        "shadow-[0_0_0_3px_rgba(221,228,102,0.16),0_6px_18px_rgba(0,0,0,0.25)] sm:shadow-[0_0_0_4px_rgba(221,228,102,0.18),0_8px_24px_rgba(0,0,0,0.25)]",
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
    <div className="relative flex w-full flex-col items-center px-0.5 sm:px-0">
      <StepBadge label={card.step} />
      <div
        aria-hidden
        className="my-3 h-7 w-[2px] bg-[repeating-linear-gradient(to_bottom,var(--brand-baby-blue)_0_4px,transparent_4px_11px)] sm:my-4 sm:h-8 md:my-5 md:h-10"
      />
      <StepCard card={card} className="w-full max-w-[22rem] sm:max-w-md md:max-w-xl" />
      {!isLast ? (
        <div
          aria-hidden
          className="mt-5 h-8 w-[2px] bg-[repeating-linear-gradient(to_bottom,var(--brand-baby-blue)_0_4px,transparent_4px_11px)] sm:mt-6 sm:h-10 md:mt-8 md:h-12"
        />
      ) : null}
    </div>
  );
}

/** Large screens: card + connector left/right of center badge */
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
    <div
      className="flex w-full min-w-0 items-center gap-0.5 sm:gap-1 lg:gap-1.5 xl:gap-2"
      data-wyg-side={side}
    >
      <div className="flex min-w-0 flex-1 justify-end">
        {isLeft ? (
          <div className="flex min-w-0 max-w-full items-center">
            <StepCard
              card={card}
              className="w-full max-w-[min(100%,18rem)] xl:max-w-[min(100%,22rem)] 2xl:max-w-[min(100%,26rem)]"
            />
            <StraightConnector
              side="left"
              onPathRef={onConnectorPathRef}
              className="mx-0.5 shrink-0 lg:mx-1 xl:mx-2"
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
              className="mx-0.5 shrink-0 lg:mx-1 xl:mx-2"
            />
            <StepCard
              card={card}
              className="w-full max-w-[min(100%,18rem)] xl:max-w-[min(100%,22rem)] 2xl:max-w-[min(100%,26rem)]"
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
      <h2 className="font-sans text-[1.35rem] font-normal leading-[1.15] tracking-tight text-accent sm:text-[2.125rem] sm:leading-[1.08] md:text-[2.75rem] lg:text-[3.25rem] xl:text-[3.75rem] xl:leading-[1.05]">
        <span className="block text-balance">{headlineLines[0]}</span>
        <span className="block text-balance">{headlineLines[1]}</span>
      </h2>
      <div
        className={cn(
          "text-brand-caption mt-4 inline-flex max-w-[min(100%,20rem)] items-center justify-center rounded-full px-4 py-1.5 text-center font-medium uppercase tracking-[0.08em] text-white sm:mt-6 sm:max-w-none sm:px-6 sm:py-2.5 md:mt-8 md:px-7",
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
  slideFromSides: boolean,
) {
  if (steps.length === 0) return;

  const timeline = steps[0]?.closest("[data-wyg-timeline]") ?? steps[0];

  // Own visibility entirely in GSAP — cards stay hidden until their
  // step crosses the viewport center (same axis as the spine line).
  gsap.set(steps, { autoAlpha: 0, y: 28, x: 0 });

  if (lineFill) {
    gsap.set(lineFill, { scaleY: 0, transformOrigin: "top center" });
    gsap.to(lineFill, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: timeline,
        start: "top 85%",
        end: "bottom center",
        scrub: 1.8,
        invalidateOnRefresh: true,
      },
    });
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

  steps.forEach((step, index) => {
    const side =
      (step.querySelector("[data-wyg-side]")?.getAttribute("data-wyg-side") as
        | "left"
        | "right"
        | null) ?? null;
    const fromX =
      slideFromSides && side === "left"
        ? -32
        : slideFromSides && side === "right"
          ? 32
          : 0;

    // Wider window + softer scrub lag + eased motion → smooth glide, no snap.
    gsap.fromTo(
      step,
      { autoAlpha: 0, y: 28, x: fromX },
      {
        autoAlpha: 1,
        y: 0,
        x: 0,
        ease: "power1.out",
        scrollTrigger: {
          trigger: step,
          start: "top 88%",
          end: "top 52%",
          scrub: 1.8,
          invalidateOnRefresh: true,
        },
      },
    );

    const path = connectors[index];
    if (animateConnectors && path) {
      const len = path.getTotalLength();
      gsap.fromTo(
        path,
        { strokeDashoffset: len },
        {
          strokeDashoffset: 0,
          ease: "none",
          scrollTrigger: {
            trigger: step,
            start: "top 82%",
            end: "top 50%",
            scrub: 1.8,
            invalidateOnRefresh: true,
          },
        },
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
        bindStepReveal(steps, lineFill, connectorRefs.current, true, true);
      });

      mm.add(`(max-width: 1023px)`, () => {
        const root = stackRef.current;
        if (!root) return;

        const steps = gsap.utils.toArray<HTMLElement>(
          root.querySelectorAll("[data-wyg-step]"),
        );
        bindStepReveal(steps, null, [], false, false);
      });

      // Single delayed refresh — repeated refreshes scramble Hook/WhoItsFor pin
      // spacers and can make the Six Pillars section disappear while scrolling.
      const refreshId = window.setTimeout(() => ScrollTrigger.refresh(), 320);

      const onOrient = () => ScrollTrigger.refresh();
      window.addEventListener("orientationchange", onOrient);

      return () => {
        window.clearTimeout(refreshId);
        window.removeEventListener("orientationchange", onOrient);
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
      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-4 py-10 sm:px-5 sm:py-14 md:px-6 md:py-16 lg:max-w-7xl lg:px-8 lg:py-20 xl:py-24">
        <SectionHeader
          headlineLines={whatYouGet.headlineLines}
          label={whatYouGet.label}
        />

        {/* Stacked: phones + tablets */}
        <div
          ref={stackRef}
          data-wyg-timeline
          className="relative mx-auto mt-7 w-full max-w-sm sm:mt-8 sm:max-w-md md:mt-10 md:max-w-xl lg:hidden"
        >
          {whatYouGet.cards.map((card, index) => (
            <div
              key={card.id}
              data-wyg-step
              className={cn(
                "relative py-1.5 will-change-transform sm:py-2 md:py-3",
                !reduceMotion && "invisible",
              )}
            >
              <StackedStep
                card={card}
                isLast={index === whatYouGet.cards.length - 1}
              />
            </div>
          ))}
        </div>

        {/* Zigzag: lg+ — half-rail fits fluid card + connector */}
        <div
          ref={zigzagRef}
          data-wyg-timeline
          className="relative mx-auto mt-10 hidden w-full max-w-5xl overflow-visible lg:mt-12 lg:block xl:max-w-6xl 2xl:max-w-7xl"
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
              className={cn(
                "relative py-8 will-change-transform lg:py-10 xl:py-12 2xl:py-14",
                !reduceMotion && "invisible",
              )}
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
