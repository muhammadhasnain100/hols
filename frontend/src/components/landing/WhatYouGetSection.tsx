"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { landingContent } from "@/content/landing";
import { heroGlassPanel } from "@/lib/hero-styles";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type Card = (typeof landingContent.whatYouGet.cards)[number];

const STEP_SIDES: Array<"left" | "right"> = ["right", "left", "right"];

/** Reliable horizontal dashes — avoids clipped border-dashed on 1px boxes. */
function DashedConnector({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn("h-px min-h-px min-w-[1.25rem] flex-1 self-center", className)}
      style={{
        backgroundImage:
          "repeating-linear-gradient(90deg, rgba(255,255,255,0.58) 0 5px, transparent 5px 10px)",
      }}
    />
  );
}

const IMAGE_FRAME =
  "relative aspect-[16/10] w-full max-w-[14rem] shrink-0 overflow-hidden border border-white/20";

function StepImage({ card }: { card: Card }) {
  return (
    <div className={IMAGE_FRAME}>
      <Image
        src={card.image}
        alt={card.title}
        fill
        className="object-cover"
        sizes="224px"
      />
    </div>
  );
}

function StepDescription({
  card,
  align,
  className,
}: {
  card: Card;
  align: "left" | "right" | "center";
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-body text-sm leading-relaxed text-white/90 md:text-[0.95rem]",
        "glass-capsule-overlay rounded-full px-5 py-3 md:px-6 md:py-4",
        align === "left" && "text-left",
        align === "right" && "text-right",
        align === "center" && "mx-auto max-w-sm text-center",
        className,
      )}
    >
      {card.description}
    </p>
  );
}

function StepMedia({
  card,
  showImage,
  align,
}: {
  card: Card;
  showImage: boolean;
  align: "left" | "right" | "center";
}) {
  return (
    <div
      className={cn(
        "max-w-[17rem] shrink-0 space-y-4 sm:max-w-xs md:max-w-sm",
        align === "left" && "mr-auto text-left",
        align === "right" && "ml-auto text-right",
        align === "center" && "mx-auto max-w-sm text-center",
      )}
    >
      {showImage ? <StepImage card={card} /> : null}
      <StepDescription card={card} align={align} />
    </div>
  );
}

function StepBadge({ label }: { label: string }) {
  return (
    <span className="relative inline-flex min-w-[7.5rem] items-center justify-center rounded-full bg-white px-5 py-2.5 font-sans text-[0.7rem] font-bold uppercase tracking-[0.18em] text-primary md:min-w-[8.5rem] md:px-6 md:text-xs">
      {label}
    </span>
  );
}

/** Image-row height matches StepImage aspect box so the badge sits on the same axis. */
const IMAGE_ROW_HEIGHT = "h-[8.75rem]";

function TimelineStep({
  card,
  side,
  showImage = false,
}: {
  card: Card;
  side: "left" | "right";
  showImage?: boolean;
}) {
  const isLeft = side === "left";
  const rowHeight = showImage ? IMAGE_ROW_HEIGHT : "min-h-[3rem]";

  return (
    <>
      <div className="hidden w-full lg:flex lg:items-stretch">
        {/* Left zone */}
        <div className="flex min-w-0 flex-1 flex-col">
          {isLeft ? (
            <>
              <div className={cn("flex items-center justify-end", rowHeight)}>
                {showImage ? (
                  <>
                    <StepImage card={card} />
                    <DashedConnector />
                  </>
                ) : (
                  <>
                    <StepMedia card={card} showImage={false} align="left" />
                    <DashedConnector />
                  </>
                )}
              </div>
              {showImage ? (
                <StepDescription
                  card={card}
                  align="left"
                  className="mt-4 max-w-sm self-end"
                />
              ) : null}
            </>
          ) : null}
        </div>

        {/* Center badge — on the vertical spine */}
        <div className={cn("relative z-20 flex shrink-0 items-center px-1", rowHeight)}>
          <StepBadge label={card.step} />
        </div>

        {/* Right zone */}
        <div className="flex min-w-0 flex-1 flex-col">
          {!isLeft ? (
            <>
              <div className={cn("flex items-center justify-start", rowHeight)}>
                {showImage ? (
                  <>
                    <DashedConnector />
                    <StepImage card={card} />
                  </>
                ) : (
                  <>
                    <DashedConnector />
                    <StepMedia card={card} showImage={false} align="right" />
                  </>
                )}
              </div>
              {showImage ? (
                <StepDescription
                  card={card}
                  align="right"
                  className="mt-4 max-w-sm self-start"
                />
              ) : null}
            </>
          ) : null}
        </div>
      </div>

      <div className="lg:hidden">
        <StepMedia card={card} showImage={showImage} align="center" />
      </div>
    </>
  );
}

function SectionBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 -z-10 bg-primary"
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_18%_12%,rgba(141,195,225,0.14),transparent_52%),radial-gradient(ellipse_at_82%_88%,rgba(221,228,102,0.08),transparent_48%)]" />
    </div>
  );
}

function SectionHeader({
  headline,
  label,
}: {
  headline: string;
  label: string;
}) {
  return (
    <div className="mx-auto max-w-3xl shrink-0 text-center">
      <h2 className="font-sans text-2xl font-bold uppercase tracking-[0.04em] text-accent sm:text-3xl md:text-[2.15rem]">
        {headline}
      </h2>
      <div
        className={cn(
          "mt-6 inline-flex items-center justify-center rounded-full px-6 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.2em] text-white md:mt-8 md:px-7 md:text-sm",
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

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const section = sectionRef.current;
      const timeline = timelineRef.current;
      const lineFill = lineFillRef.current;

      if (!section || !timeline || !lineFill) return;

      const steps = gsap.utils.toArray<HTMLElement>(
        timeline.querySelectorAll("[data-wyg-step]"),
      );

      if (steps.length === 0) return;

      gsap.set(lineFill, { scaleY: 0, transformOrigin: "top center" });
      gsap.set(steps, { autoAlpha: 0, y: 48 });

      const scrollTimeline = gsap.timeline({
        scrollTrigger: {
          id: "what-you-get-timeline",
          trigger: timeline,
          start: "top 72%",
          end: "bottom 28%",
          scrub: 0.65,
          invalidateOnRefresh: true,
        },
      });

      // Line draws downward through the full timeline height
      scrollTimeline.to(
        lineFill,
        {
          scaleY: 1,
          ease: "none",
          duration: steps.length,
        },
        0,
      );

      // Each step reveals as the line reaches it — stays visible (no fade-out)
      steps.forEach((step, index) => {
        scrollTimeline.fromTo(
          step,
          { autoAlpha: 0, y: 48 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            ease: "power2.out",
          },
          index * 0.85 + 0.15,
        );
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef, dependencies: [reduceMotion, whatYouGet.cards.length] },
  );

  return (
    <section
      ref={sectionRef}
      id="what-you-get"
      className="relative isolate overflow-hidden"
    >
      <SectionBackground />

      <div className="relative mx-auto flex w-full max-w-6xl flex-col px-5 py-16 md:px-8 md:py-20 lg:max-w-7xl lg:py-24">
        <SectionHeader headline={whatYouGet.headline} label={whatYouGet.label} />

        <div ref={timelineRef} className="relative mx-auto mt-8 w-full overflow-visible md:mt-10">
          {/* Vertical spine — sits behind step badges */}
          <div
            className="pointer-events-none absolute left-1/2 top-0 z-0 h-full w-px -translate-x-1/2 bg-white/20"
            aria-hidden
          >
            <div
              ref={lineFillRef}
              className="h-full w-full origin-top bg-accent/85"
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
                showImage={index > 0}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
