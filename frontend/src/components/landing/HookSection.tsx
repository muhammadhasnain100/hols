"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { Container } from "@/components/ui/Container";
import { landingContent } from "@/content/landing";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

function SplitTitle({ text, className }: { text: string; className?: string }) {
  return (
    <h2 className={className} aria-label={text}>
      {text.split(" ").map((word, index) => (
        <span key={`${word}-${index}`} className="hook-title-word inline-block overflow-hidden pb-1">
          <span className="hook-title-inner inline-block">{word}&nbsp;</span>
        </span>
      ))}
    </h2>
  );
}

function HookImage({
  src,
  alt,
  label,
  dark = false,
}: {
  src: string;
  alt: string;
  label: string;
  dark?: boolean;
}) {
  return (
    <figure
      className={cn(
        "overflow-hidden rounded-2xl border shadow-[0_20px_60px_rgba(21,39,68,0.10)]",
        dark ? "border-white/20 bg-primary" : "border-primary/10 bg-white",
      )}
    >
      <div className="relative aspect-[16/10] w-full">
        <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
      </div>
      <figcaption
        className={cn(
          "px-5 py-3 text-brand-caption uppercase tracking-[0.16em]",
          dark ? "bg-primary/90 text-white" : "border-t border-primary/5 bg-white text-primary",
        )}
      >
        {label}
      </figcaption>
    </figure>
  );
}

function HookPanelContent({
  imageLeft,
  label,
  text,
  image,
  imageAlt,
  dark = false,
}: {
  imageLeft: boolean;
  label: string;
  text: string;
  image: string;
  imageAlt: string;
  dark?: boolean;
}) {
  const imageBlock = (
    <HookImage src={image} alt={imageAlt} label={label} dark={dark} />
  );

  const copy = (
    <div className="flex flex-col justify-center px-1 lg:px-4">
      <p className="text-brand-caption uppercase tracking-[0.22em] text-primary-light">
        {label}
      </p>
      {/* Gilroy Light · 18px */}
      <p className="font-body text-brand-body mt-5 text-muted">{text}</p>
    </div>
  );

  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      {imageLeft ? (
        <>
          <div>{imageBlock}</div>
          <div>{copy}</div>
        </>
      ) : (
        <>
          <div className="lg:order-1">{copy}</div>
          <div className="lg:order-2">{imageBlock}</div>
        </>
      )}
    </div>
  );
}

function HookSectionStatic() {
  const { hook } = landingContent;

  return (
    <section id="problem" className="bg-background py-24 md:py-32">
      <Container>
        <SplitTitle
          text={hook.headline}
          className="font-sans text-brand-subheading mx-auto max-w-4xl text-center text-primary"
        />
        <div className="mt-16 space-y-20">
          <HookPanelContent
            imageLeft
            label={hook.beforeLabel}
            text={hook.problem}
            image={hook.problemImage}
            imageAlt={hook.beforeLabel}
            dark
          />
          <HookPanelContent
            imageLeft={false}
            label={hook.afterLabel}
            text={hook.resolution}
            image={hook.solutionImage}
            imageAlt={hook.afterLabel}
            dark
          />
        </div>
      </Container>
    </section>
  );
}

export function HookSection() {
  const { hook } = landingContent;
  const [reduceMotion, setReduceMotion] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLDivElement>(null);
  const panel1Ref = useRef<HTMLDivElement>(null);
  const panel2Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const pinWrap = pinWrapRef.current;
      const pin = pinRef.current;
      const panel1 = panel1Ref.current;
      const panel2 = panel2Ref.current;
      const title = titleRef.current;

      if (!pinWrap || !pin || !panel1 || !panel2 || !title) return;

      const titleWords = title.querySelectorAll(".hook-title-inner");
      const scrollDistance = () => window.innerHeight * 2;

      gsap.set(titleWords, { yPercent: 110 });
      gsap.set(panel1, { autoAlpha: 0, y: 48, zIndex: 2 });
      gsap.set(panel2, { autoAlpha: 0, y: 48, x: 0, zIndex: 1, pointerEvents: "none" });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: pinWrap,
          start: "top top",
          end: () => `+=${scrollDistance()}`,
          pin,
          scrub: 0.85,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      timeline
        .to(titleWords, {
          yPercent: 0,
          duration: 0.22,
          stagger: 0.012,
          ease: "power3.out",
        })
        .to(
          panel1,
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.24,
            ease: "power3.out",
          },
          0.12,
        )
        .to(
          title,
          {
            y: -12,
            autoAlpha: 0.55,
            duration: 0.18,
            ease: "power2.inOut",
          },
          0.38,
        )
        .to(
          panel1,
          {
            autoAlpha: 0,
            x: -40,
            pointerEvents: "none",
            duration: 0.18,
            ease: "power2.in",
          },
          0.48,
        )
        .set(panel1, { visibility: "hidden" }, 0.66)
        .set(panel2, { visibility: "visible", zIndex: 2 }, 0.66)
        .fromTo(
          panel2,
          { autoAlpha: 0, x: 40, y: 0 },
          {
            autoAlpha: 1,
            x: 0,
            pointerEvents: "auto",
            duration: 0.22,
            ease: "power2.out",
          },
          0.66,
        );

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );

  if (reduceMotion) {
    return <HookSectionStatic />;
  }

  return (
    <section ref={sectionRef} id="problem" className="relative isolate z-0 overflow-hidden bg-background">
      <div ref={pinWrapRef} className="relative">
        <div
          ref={pinRef}
          className="relative flex min-h-[100dvh] flex-col justify-center overflow-hidden bg-background py-24 md:py-28"
        >
          <Container className="relative">
            <div ref={titleRef} className="mx-auto max-w-4xl text-center">
              <SplitTitle
                text={hook.headline}
                className="font-sans text-brand-subheading text-primary"
              />
            </div>

            <div className="relative mx-auto mt-12 w-full max-w-6xl md:mt-16">
              <div ref={panel1Ref} className="absolute inset-0 z-[2] overflow-hidden">
                <HookPanelContent
                  imageLeft
                  label={hook.beforeLabel}
                  text={hook.problem}
                  image={hook.problemImage}
                  imageAlt={hook.beforeLabel}
                  dark
                />
              </div>

              <div ref={panel2Ref} className="absolute inset-0 z-[1] overflow-hidden invisible">
                <HookPanelContent
                  imageLeft={false}
                  label={hook.afterLabel}
                  text={hook.resolution}
                  image={hook.solutionImage}
                  imageAlt={hook.afterLabel}
                  dark
                />
              </div>

              {/* Reserve height so panels don't collapse or bleed into the next section */}
              <div className="invisible pointer-events-none" aria-hidden>
                <HookPanelContent
                  imageLeft
                  label={hook.beforeLabel}
                  text={hook.problem}
                  image={hook.problemImage}
                  imageAlt={hook.beforeLabel}
                  dark
                />
              </div>
            </div>
          </Container>
        </div>
      </div>
    </section>
  );
}
