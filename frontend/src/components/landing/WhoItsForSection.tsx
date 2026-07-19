"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { landingContent } from "@/content/landing";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

function WhoItsForStatic() {
  const { whoItsFor } = landingContent;

  return (
    <section id="who-its-for" className="relative isolate overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <Image
          src={whoItsFor.backgroundImage}
          alt=""
          fill
          className="object-cover object-center"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-primary/70" />
      </div>

      <div className="relative mx-auto w-full max-w-5xl px-5 py-20 md:px-8 md:py-28">
        <p className="font-sans text-xs font-semibold uppercase tracking-[0.28em] text-accent">
          Who it&apos;s for
        </p>
        <h2 className="mt-4 font-sans text-3xl font-bold text-white md:text-4xl">
          {whoItsFor.headline}
        </h2>

        <div className="mt-12 space-y-10">
          {whoItsFor.audiences.map((audience) => (
            <div key={audience.id} className="max-w-xl">
              <h3 className="font-sans text-2xl font-bold text-white">
                {audience.title}
              </h3>
              <p className="font-body mt-3 text-base leading-relaxed text-white/75">
                {audience.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function WhoItsForSection() {
  const { whoItsFor } = landingContent;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const pinWrap = pinWrapRef.current;
      if (!pinWrap) return;

      const texts = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-wif-text]"),
      );
      const bgs = gsap.utils.toArray<HTMLElement>(
        pinWrap.querySelectorAll("[data-wif-bg]"),
      );

      if (texts.length === 0) return;

      const scrollDistance = () =>
        window.innerHeight * Math.max(texts.length, 1) * 0.9;

      gsap.set(texts, { autoAlpha: 0, y: 32 });
      gsap.set(bgs, { autoAlpha: 0 });
      gsap.set(texts[0], { autoAlpha: 1, y: 0 });
      if (bgs[0]) gsap.set(bgs[0], { autoAlpha: 1 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          id: "who-its-for-timeline",
          trigger: pinWrap,
          start: "top top",
          end: () => `+=${scrollDistance()}`,
          pin: pinWrap,
          pinSpacing: true,
          scrub: 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            const index = Math.min(
              texts.length - 1,
              Math.round(self.progress * (texts.length - 1)),
            );
            setActiveIndex(index);
          },
        },
      });

      texts.forEach((text, index) => {
        const start = index;

        if (index === 0) {
          timeline.to(text, { autoAlpha: 1, y: 0, duration: 0.35 }, 0);
        } else {
          timeline.fromTo(
            text,
            { autoAlpha: 0, y: 32 },
            { autoAlpha: 1, y: 0, duration: 0.5, ease: "power2.out" },
            start,
          );
        }

        if (bgs[index]) {
          timeline.to(
            bgs[index],
            { autoAlpha: 1, duration: 0.5, ease: "power1.inOut" },
            start,
          );
        }

        if (index < texts.length - 1) {
          timeline.to(
            text,
            { autoAlpha: 0, y: -24, duration: 0.4, ease: "power2.in" },
            start + 0.65,
          );
          if (bgs[index]) {
            timeline.to(
              bgs[index],
              { autoAlpha: 0, duration: 0.4, ease: "power1.inOut" },
              start + 0.65,
            );
          }
        }
      });

      timeline.to({}, { duration: 0.3 });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef, dependencies: [reduceMotion, whoItsFor.audiences.length] },
  );

  if (reduceMotion) {
    return <WhoItsForStatic />;
  }

  return (
    <section ref={sectionRef} id="who-its-for" className="relative isolate">
      <div
        ref={pinWrapRef}
        className="relative flex h-[100dvh] flex-col overflow-hidden"
      >
        {/* Background layers — crossfade on scroll */}
        <div className="absolute inset-0 -z-10">
          <Image
            src={whoItsFor.backgroundImage}
            alt=""
            fill
            className="object-cover object-center"
            sizes="100vw"
            priority={false}
          />
          {whoItsFor.audiences.map((audience) => (
            <div
              key={audience.id}
              data-wif-bg
              className="absolute inset-0"
            >
              <Image
                src={audience.image}
                alt=""
                fill
                className="object-cover object-center"
                sizes="100vw"
              />
            </div>
          ))}
          <div className="absolute inset-0 bg-primary/65" />
          <div className="absolute inset-0 bg-[linear-gradient(105deg,rgba(21,39,68,0.82)_0%,rgba(21,39,68,0.45)_55%,rgba(21,39,68,0.55)_100%)]" />
        </div>

        <div className="relative mx-auto flex h-full w-full max-w-6xl flex-col px-5 py-12 md:px-8 md:py-14 lg:px-10">
          <div className="shrink-0">
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.28em] text-accent">
              Who it&apos;s for
            </p>
            <h2 className="mt-3 max-w-2xl font-sans text-3xl font-bold tracking-[-0.02em] text-white md:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {whoItsFor.headline}
            </h2>
          </div>

          <div className="relative flex flex-1 items-center">
            <div className="relative w-full max-w-xl">
              {whoItsFor.audiences.map((audience, index) => (
                <div
                  key={audience.id}
                  className="absolute inset-0 flex items-center"
                >
                  <div data-wif-text className="w-full will-change-transform">
                    <p className="font-sans text-sm font-semibold uppercase tracking-[0.2em] text-accent/90">
                      {String(index + 1).padStart(2, "0")} /{" "}
                      {String(whoItsFor.audiences.length).padStart(2, "0")}
                    </p>
                    <h3 className="mt-4 font-sans text-3xl font-bold text-white md:text-4xl lg:text-[2.75rem]">
                      {audience.title}
                    </h3>
                    <p className="font-body mt-5 text-base leading-relaxed text-white/80 md:text-lg md:leading-[1.55]">
                      {audience.description}
                    </p>
                  </div>
                </div>
              ))}

              {/* Height reserve */}
              <div className="pointer-events-none invisible" aria-hidden>
                <p className="text-sm">00 / 00</p>
                <h3 className="mt-4 text-3xl md:text-4xl lg:text-[2.75rem]">
                  {whoItsFor.audiences[0]?.title}
                </h3>
                <p className="mt-5 text-base md:text-lg">
                  {whoItsFor.audiences[0]?.description}
                </p>
              </div>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2 pb-2">
            {whoItsFor.audiences.map((audience, index) => (
              <span
                key={audience.id}
                aria-hidden
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  index === activeIndex
                    ? "w-10 bg-accent"
                    : "w-1.5 bg-white/35",
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
