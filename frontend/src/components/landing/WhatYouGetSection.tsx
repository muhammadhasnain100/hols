"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { landingContent } from "@/content/landing";
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
      <p className="font-body text-sm leading-relaxed text-white/90 md:text-[0.95rem]">
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
        <span className="inline-flex min-w-[7.5rem] items-center justify-center bg-white px-4 py-2 font-sans text-[0.7rem] font-bold uppercase tracking-[0.18em] text-primary md:min-w-[8.5rem] md:text-xs">
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
      <div className="mt-6 inline-flex items-center justify-center bg-accent px-5 py-2.5 font-sans text-xs font-bold uppercase tracking-[0.2em] text-primary md:mt-8 md:text-sm">
        {label}
      </div>
    </div>
  );
}

function WhatYouGetStatic() {
  const { whatYouGet } = landingContent;

  return (
    <section id="what-you-get" className="relative isolate overflow-hidden">
      <SectionBackground src={whatYouGet.backgroundImage} />
      <div className="relative mx-auto flex w-full max-w-5xl flex-col px-5 py-16 md:px-8 md:py-20 lg:py-24">
        <SectionHeader headline={whatYouGet.headline} label={whatYouGet.label} />
        <div className="relative mx-auto mt-8 w-full">
          <div
            className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-white/35"
            aria-hidden
          />
          {whatYouGet.cards.map((card, index) => (
            <div key={card.id} className="py-10 md:py-12">
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

export function WhatYouGetSection() {
  const { whatYouGet } = landingContent;
  const [reduceMotion, setReduceMotion] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const lineFillRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const pinWrap = pinWrapRef.current;
      const lineFill = lineFillRef.current;

      if (!pinWrap || !lineFill) return;

      const steps = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-wyg-step]"),
      );

      if (steps.length === 0) return;

      const scrollDistance = () => window.innerHeight * Math.max(steps.length, 1) * 0.95;

      gsap.set(steps, { autoAlpha: 0, y: 36 });
      gsap.set(lineFill, { scaleY: 0, transformOrigin: "top center" });

      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "what-you-get-timeline",
          trigger: pinWrap,
          start: "top top",
          end: () => `+=${scrollDistance()}`,
          pin: pinWrap,
          pinSpacing: true,
          scrub: 0.8,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline.to(
        lineFill,
        {
          scaleY: 1,
          ease: "none",
          duration: steps.length,
        },
        0,
      );

      steps.forEach((step, index) => {
        const start = index;
        timeline.fromTo(
          step,
          { autoAlpha: 0, y: 36 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.55,
            ease: "power2.out",
          },
          start,
        );

        if (index < steps.length - 1) {
          timeline.to(
            step,
            {
              autoAlpha: 0,
              y: -28,
              duration: 0.45,
              ease: "power2.in",
            },
            start + 0.7,
          );
        }
      });

      // Keep final step visible through the end of the scrub
      timeline.to({}, { duration: 0.35 });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef, dependencies: [reduceMotion, whatYouGet.cards.length] },
  );

  if (reduceMotion) {
    return <WhatYouGetStatic />;
  }

  return (
    <section
      ref={sectionRef}
      id="what-you-get"
      className="relative isolate"
    >
      {/* Only this wrapper is pinned — pinSpacing keeps following sections undisturbed */}
      <div
        ref={pinWrapRef}
        className="relative flex h-[100dvh] flex-col overflow-hidden"
      >
        <SectionBackground src={whatYouGet.backgroundImage} />

        <div className="relative mx-auto flex h-full w-full max-w-5xl flex-col px-5 py-10 md:px-8 md:py-12 lg:py-14">
          <SectionHeader headline={whatYouGet.headline} label={whatYouGet.label} />

          <div className="relative mx-auto mt-6 flex w-full flex-1 items-center md:mt-8">
            <div
              className="absolute left-1/2 top-[8%] bottom-[8%] w-px -translate-x-1/2 overflow-hidden bg-white/20"
              aria-hidden
            >
              <div
                ref={lineFillRef}
                className="h-full w-full bg-accent/80"
              />
            </div>

            <div className="relative w-full">
              {whatYouGet.cards.map((card, index) => (
                <div
                  key={card.id}
                  className="absolute inset-0 flex items-center"
                >
                  <div data-wyg-step className="w-full will-change-transform">
                    <TimelineStep
                      card={card}
                      side={STEP_SIDES[index] ?? "right"}
                      showImage={index > 0}
                    />
                  </div>
                </div>
              ))}

              {/* Reserve height so absolute steps have a stable stage */}
              <div className="pointer-events-none invisible" aria-hidden>
                <TimelineStep
                  card={whatYouGet.cards[0]}
                  side="right"
                  showImage
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
