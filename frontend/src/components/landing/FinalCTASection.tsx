"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { landingContent } from "@/content/landing";
import { prefersReducedMotion } from "@/lib/motion";

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
    <div className="relative z-10 flex w-full max-w-6xl flex-col items-center text-center">
      <p className="font-sans text-lg italic tracking-[0.02em] text-white/90 md:text-xl">
        {finalCta.eyebrow}
      </p>

      <div className="relative mt-8 md:mt-10">
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 h-[140%] w-[140%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-light/12 blur-3xl"
          aria-hidden
        />
        <Image
          src={finalCta.image}
          alt=""
          width={512}
          height={512}
          className="relative h-auto w-36 object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)] sm:w-44 md:w-52 lg:w-60"
          sizes="(max-width: 640px) 9rem, 15rem"
        />
      </div>

      <h2
        className="mt-10 w-full font-sans text-[2rem] font-medium leading-[1.15] tracking-[-0.01em] text-white sm:text-4xl md:text-5xl md:leading-[1.12] lg:text-[3.25rem]"
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

      <Link
        href={finalCta.primaryCta.href}
        className="mt-14 inline-flex min-h-14 items-center justify-center rounded-full border border-white/85 px-10 font-sans text-xs font-semibold uppercase tracking-[0.22em] text-white transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        style={{ opacity: showCta ? 1 : 0, pointerEvents: showCta ? "auto" : "none" }}
      >
        {finalCta.primaryCta.label}
      </Link>
    </div>
  );
}

function FinalCtaShell({ children }: { children: ReactNode }) {
  return (
    <section className="bg-[#F4F5F7]">
      <div className="relative flex w-full min-h-[32rem] flex-col items-center justify-center overflow-hidden bg-black px-5 py-28 text-center md:min-h-[36rem] md:px-8 md:py-36 lg:min-h-[40rem] lg:px-10 lg:py-44">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_28%,rgba(141,195,225,0.16),transparent_55%),radial-gradient(ellipse_at_50%_72%,rgba(221,228,102,0.06),transparent_45%)]"
          aria-hidden
        />
        {children}
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

      // Hold, then a longer in-place spin — more scroll distance = more time to enjoy it
      tl.to({}, { duration: 0.14 }, 0).to(
        ballSpin,
        {
          rotation: 1080,
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
    <section ref={sectionRef} className="bg-[#F4F5F7]">
      <div
        ref={pinWrapRef}
        className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-black px-5 py-20 text-center md:px-8 md:py-24 lg:px-10"
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_28%,rgba(141,195,225,0.16),transparent_55%),radial-gradient(ellipse_at_50%_72%,rgba(221,228,102,0.06),transparent_45%)]"
          aria-hidden
        />

        <div className="relative z-10 flex w-full max-w-6xl flex-col items-center">
          <p
            data-final-eyebrow
            className="font-sans text-lg italic tracking-[0.02em] text-white/90 md:text-xl"
          >
            {finalCta.eyebrow}
          </p>

          <div data-final-ball className="relative mt-8 md:mt-10">
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
                className="relative h-auto w-36 object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)] sm:w-44 md:w-52 lg:w-60"
                sizes="(max-width: 640px) 9rem, 15rem"
              />
            </div>
          </div>

          <h2
            data-final-headline
            className="invisible mt-10 w-full font-sans text-[2rem] font-medium leading-[1.15] tracking-[-0.01em] text-white sm:text-4xl md:text-5xl md:leading-[1.12] lg:text-[3.25rem]"
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

          <Link
            data-final-cta
            href={finalCta.primaryCta.href}
            className="invisible mt-14 inline-flex min-h-14 items-center justify-center rounded-full border border-white/85 px-10 font-sans text-xs font-semibold uppercase tracking-[0.22em] text-white transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            {finalCta.primaryCta.label}
          </Link>
        </div>
      </div>
    </section>
  );
}
