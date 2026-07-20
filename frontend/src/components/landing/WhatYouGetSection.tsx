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
        "max-w-sm space-y-4",
        align === "left" && "mr-auto text-left",
        align === "right" && "ml-auto text-right",
        align === "center" && "mx-auto text-center",
      )}
    >
      {showImage ? (
        <div
          className={cn(
            "relative aspect-[16/10] w-full max-w-[14rem] overflow-hidden border border-white/20",
            align === "right" && "ml-auto",
            align === "left" && "mr-auto",
            align === "center" && "mx-auto",
          )}
        >
          <Image
            src={card.image}
            alt={card.title}
            fill
            className="object-cover"
            sizes="224px"
          />
        </div>
      ) : null}
      <p
        className={cn(
          "font-body text-sm leading-relaxed text-white/90 md:text-[0.95rem]",
          "glass-capsule-overlay rounded-full px-5 py-3 md:px-6 md:py-4",
        )}
      >
        {card.description}
      </p>
    </div>
  );
}

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

  return (
    <div className="relative grid w-full grid-cols-1 items-center gap-5 lg:grid-cols-[1fr_auto_1fr] lg:gap-0">
      <div className="hidden lg:block lg:pr-10">
        {isLeft ? <StepMedia card={card} showImage={showImage} align="right" /> : null}
      </div>

      <div className="relative z-10 flex justify-center">
        <div
          className={cn(
            "pointer-events-none absolute top-1/2 hidden h-px w-[min(26vw,10.5rem)] -translate-y-1/2 border-t border-dashed border-white/45 lg:block",
            isLeft ? "right-full" : "left-full",
          )}
          aria-hidden
        />
        <span className="inline-flex min-w-[7.5rem] items-center justify-center rounded-full bg-white px-5 py-2.5 font-sans text-[0.7rem] font-bold uppercase tracking-[0.18em] text-primary md:min-w-[8.5rem] md:px-6 md:text-xs">
          {card.step}
        </span>
      </div>

      <div className="hidden lg:block lg:pl-10">
        {!isLeft ? <StepMedia card={card} showImage={showImage} align="left" /> : null}
      </div>

      <div className="lg:hidden">
        <StepMedia card={card} showImage={showImage} align="center" />
      </div>
    </div>
  );
}

function SectionBackground({ src }: { src: string }) {
  return (
    <div className="absolute inset-0 -z-10">
      <Image
        src={src}
        alt=""
        fill
        className="object-cover object-center"
        sizes="100vw"
        priority={false}
      />
      <div className="absolute inset-0 bg-primary/55" />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(21,39,68,0.55)_0%,rgba(21,39,68,0.35)_40%,rgba(21,39,68,0.6)_100%)]" />
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
      <SectionBackground src={whatYouGet.backgroundImage} />

      <div className="relative mx-auto flex w-full max-w-5xl flex-col px-5 py-16 md:px-8 md:py-20 lg:py-24">
        <SectionHeader headline={whatYouGet.headline} label={whatYouGet.label} />

        <div ref={timelineRef} className="relative mx-auto mt-8 w-full md:mt-10">
          {/* Vertical track — line grows top → bottom on scroll */}
          <div
            className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 overflow-hidden bg-white/20"
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
