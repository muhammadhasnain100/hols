"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { HeroButton } from "@/components/hero/HeroButton";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { landingContent } from "@/content/landing";
import { heroLayout } from "@/lib/hero-styles";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const FINAL_CTA_EYEBROW =
  "text-brand-caption uppercase tracking-[0.08em] text-white/80";
const FINAL_CTA_HEADLINE =
  "font-sans text-[1.5rem] font-bold leading-[1.1] tracking-[0.01em] text-balance text-white sm:text-[2.25rem] sm:leading-[1.05] md:text-[3.75rem]";

function FinalCtaCopy({
  showHeadline = true,
  showCta = true,
}: {
  showHeadline?: boolean;
  showCta?: boolean;
}) {
  const { finalCta } = landingContent;
  const accent = finalCta.headlineAccent;
  const parts = accent
    ? finalCta.headline.split(new RegExp(`(${accent})`, "i"))
    : [finalCta.headline];

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center text-center">
      <p className={FINAL_CTA_EYEBROW}>{finalCta.eyebrow}</p>

      <div className="relative mt-6 sm:mt-8 md:mt-10">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-light/12 blur-3xl"
          aria-hidden
        />
        <Image
          src={finalCta.image}
          alt=""
          width={512}
          height={512}
          className="relative h-auto w-28 object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)] sm:w-44 md:w-52 lg:w-60"
          sizes="(max-width: 640px) 7rem, 15rem"
        />
      </div>

      <h2
        className={cn("mt-6 w-full sm:mt-8 md:mt-10", FINAL_CTA_HEADLINE)}
        style={{ opacity: showHeadline ? 1 : 0 }}
      >
        {parts.map((part, index) =>
          part.toLowerCase() === accent?.toLowerCase() ? (
            <span key={`${part}-${index}`} className="text-accent">
              {part}
            </span>
          ) : (
            <span key={`${part}-${index}`}>{part}</span>
          ),
        )}
      </h2>

      <div
        className="mt-8 sm:mt-10 md:mt-14"
        style={{ opacity: showCta ? 1 : 0, pointerEvents: showCta ? "auto" : "none" }}
      >
        <HeroButton href={finalCta.primaryCta.href} variant="primary">
          {finalCta.primaryCta.label}
        </HeroButton>
      </div>
    </div>
  );
}

function FinalCtaShell({ children }: { children: ReactNode }) {
  return (
    <section className="relative w-full overflow-hidden bg-black">
      <div className="relative flex w-full min-h-[28rem] flex-col items-center justify-center overflow-hidden py-16 text-center sm:min-h-[32rem] sm:py-20 md:min-h-[36rem] md:py-28 lg:min-h-[40rem] lg:py-32">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_28%,rgba(141,195,225,0.16),transparent_55%),radial-gradient(ellipse_at_50%_72%,rgba(221,228,102,0.06),transparent_45%)]"
          aria-hidden
        />
        <div className={cn("relative z-10 w-full", heroLayout.gutterX)}>{children}</div>
      </div>
    </section>
  );
}

export function FinalCTASection() {
  const { finalCta } = landingContent;
  const accent = finalCta.headlineAccent;
  const parts = accent
    ? finalCta.headline.split(new RegExp(`(${accent})`, "i"))
    : [finalCta.headline];

  const sectionRef = useRef<HTMLElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const pinWrap = pinWrapRef.current;
      if (!pinWrap) return;

      const eyebrow = pinWrap.querySelector("[data-final-eyebrow]");
      const ball = pinWrap.querySelector("[data-final-ball]");
      const ballSpin = pinWrap.querySelector("[data-final-ball-spin]");
      const headline = pinWrap.querySelector("[data-final-headline]");
      const cta = pinWrap.querySelector("[data-final-cta]");

      if (!eyebrow || !ball || !ballSpin || !headline || !cta) return;

      // Eyebrow + ball visible immediately — no empty black frame on entry
      gsap.set(eyebrow, { autoAlpha: 1, y: 0 });
      gsap.set(ball, { autoAlpha: 1 });
      gsap.set(ballSpin, {
        rotation: 0,
        transformOrigin: "50% 50%",
        force3D: true,
      });
      gsap.set(headline, { autoAlpha: 0, y: 20 });
      gsap.set(cta, { autoAlpha: 0, y: 12 });

      const tl = gsap.timeline({
        scrollTrigger: {
          id: "final-cta-timeline",
          trigger: pinWrap,
          start: "top top",
          end: () => `+=${window.innerHeight * 1.55}`,
          pin: pinWrap,
          pinSpacing: true,
          scrub: 0.55,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Hold, then one full in-place spin
      tl.to({}, { duration: 0.14 }, 0).to(
        ballSpin,
        {
          rotation: 360,
          duration: 0.42,
          ease: "none",
        },
        0.18,
      );

      // Headline + CTA after the spin finishes
      tl.to(
        headline,
        { autoAlpha: 1, y: 0, duration: 0.18, ease: "power2.out" },
        0.64,
      ).to(
        cta,
        { autoAlpha: 1, y: 0, duration: 0.14, ease: "power2.out" },
        0.72,
      );

      tl.to({}, { duration: 0.14 });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );

  if (reduceMotion) {
    return (
      <FinalCtaShell>
        <FinalCtaCopy />
      </FinalCtaShell>
    );
  }

  return (
    <section ref={sectionRef} className="relative w-full overflow-hidden bg-black">
      <div
        ref={pinWrapRef}
        className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden py-14 text-center sm:py-16 md:py-24"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_28%,rgba(141,195,225,0.16),transparent_55%),radial-gradient(ellipse_at_50%_72%,rgba(221,228,102,0.06),transparent_45%)]"
          aria-hidden
        />

        <div
          className={cn(
            "relative z-10 mx-auto flex w-full max-w-6xl flex-col items-center",
            heroLayout.gutterX,
          )}
        >
          <p data-final-eyebrow className={FINAL_CTA_EYEBROW}>
            {finalCta.eyebrow}
          </p>

          <div data-final-ball className="relative mt-6 sm:mt-8 md:mt-10">
            <div
              className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-light/12 blur-3xl"
              aria-hidden
            />
            <div
              data-final-ball-spin
              className="relative will-change-transform"
            >
              <Image
                src={finalCta.image}
                alt=""
                width={512}
                height={512}
                className="relative h-auto w-28 object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)] sm:w-44 md:w-52 lg:w-60"
                sizes="(max-width: 640px) 7rem, 15rem"
              />
            </div>
          </div>

          <h2
            data-final-headline
            className={cn(
              "invisible mt-6 w-full sm:mt-8 md:mt-10",
              FINAL_CTA_HEADLINE,
            )}
          >
            {parts.map((part, index) =>
              part.toLowerCase() === accent?.toLowerCase() ? (
                <span key={`${part}-${index}`} className="text-accent">
                  {part}
                </span>
              ) : (
                <span key={`${part}-${index}`}>{part}</span>
              ),
            )}
          </h2>

          <div data-final-cta className="invisible mt-8 sm:mt-10 md:mt-14">
            <HeroButton href={finalCta.primaryCta.href} variant="primary">
              {finalCta.primaryCta.label}
            </HeroButton>
          </div>
        </div>
      </div>
    </section>
  );
}
