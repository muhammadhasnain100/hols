"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { Container } from "@/components/ui/Container";
import { landingContent } from "@/content/landing";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const CARDS_PER_VIEW = 1;
const TRACK_GAP_PX = 24;

function PillarCard({
  title,
  description,
  image,
  isActive,
}: {
  title: string;
  description: string;
  image: string;
  isActive?: boolean;
}) {
  return (
    <article
      className={cn(
        "flex h-full w-full flex-col overflow-hidden rounded-3xl border border-border/50 bg-white shadow-[0_8px_30px_rgba(21,39,68,0.07)] transition-all duration-500 md:flex-row",
        isActive
          ? "scale-100 opacity-100 shadow-[0_16px_40px_rgba(21,39,68,0.12)]"
          : "scale-[0.98] opacity-80",
      )}
    >
      <div className="flex flex-1 flex-col justify-center p-8 md:p-12 lg:p-16">
        <h3 className="font-sans text-2xl font-semibold leading-tight text-primary md:text-3xl lg:text-4xl">
          {title}
        </h3>
        <p className="mt-5 max-w-xl text-base leading-relaxed text-muted md:text-lg lg:text-xl">
          {description}
        </p>
      </div>
      <div className="relative w-full flex-1 shrink-0 border-t border-border/40 bg-primary/[0.02] md:w-[55%] md:flex-none md:self-stretch md:border-l md:border-t-0 lg:w-[58%]">
        <Image src={image} alt={title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 60vw" />
      </div>
    </article>
  );
}

function PillarsSectionStatic() {
  const { pillars } = landingContent;

  return (
    <section id="everything-inside" className="bg-background py-16 md:py-24">
      <Container>
        <h2 className="text-brand-subheading text-center text-primary">{pillars.headline}</h2>
        <div className="mt-12 grid grid-cols-1 gap-6 md:gap-8">
          {pillars.items.map((item) => (
            <PillarCard
              key={item.id}
              title={item.title}
              description={item.description}
              image={item.image}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}

export function PillarsSection() {
  const { pillars } = landingContent;
  const [reduceMotion, setReduceMotion] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [cardWidth, setCardWidth] = useState(0);

  const sectionRef = useRef<HTMLElement>(null);
  const pinWrapRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const cardCount = pillars.items.length;
  const pageCount = Math.ceil(cardCount / CARDS_PER_VIEW);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateCardWidth = () => {
      setCardWidth(viewport.offsetWidth);
    };

    updateCardWidth();
    window.addEventListener("resize", updateCardWidth);
    return () => window.removeEventListener("resize", updateCardWidth);
  }, []);

  useGSAP(
    () => {
      if (reduceMotion || !cardWidth) return;

      registerGsap();

      const pinWrap = pinWrapRef.current;
      const viewport = viewportRef.current;
      const track = trackRef.current;
      if (!pinWrap || !viewport || !track) return;

      const getTravel = () => Math.max(0, track.scrollWidth - viewport.offsetWidth);
      const getScrollLength = () => window.innerHeight * 0.5 * pageCount;

      gsap.set(track, { x: 0 });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: pinWrap,
          start: "top top",
          end: () => `+=${getScrollLength()}`,
          pin: pinWrap,
          pinSpacing: true,
          scrub: 0.85,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          snap: {
            snapTo: (value) => {
              if (pageCount <= 1) return 0;
              const step = 1 / (pageCount - 1);
              return Math.round(value / step) * step;
            },
            duration: { min: 0.2, max: 0.45 },
            ease: "power2.inOut",
          },
          onUpdate: (self) => {
            if (pageCount <= 1) {
              setActivePage(0);
              return;
            }
            const page = Math.min(
              pageCount - 1,
              Math.round(self.progress * (pageCount - 1)),
            );
            setActivePage(page);
          },
        },
      });

      timeline.to(track, {
        x: () => -getTravel(),
        ease: "none",
        duration: 1,
      });

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef, dependencies: [reduceMotion, cardCount, pageCount, cardWidth] },
  );

  if (reduceMotion) {
    return <PillarsSectionStatic />;
  }

  return (
    <section ref={sectionRef} id="everything-inside" className="relative bg-background">
      <div ref={pinWrapRef} className="flex h-[100dvh] flex-col justify-center overflow-hidden bg-background py-6 md:py-8">
        <Container className="flex h-full flex-col">
          <h2 className="text-brand-subheading shrink-0 pt-4 text-center text-primary md:pt-6">
            {pillars.headline}
          </h2>

          <div ref={viewportRef} className="mt-6 w-full flex-1 overflow-x-hidden md:mt-8">
            <div
              ref={trackRef}
              className="flex h-full will-change-transform"
              style={{ gap: TRACK_GAP_PX }}
            >
              {pillars.items.map((item, index) => {
                const isActive = index === activePage;

                return (
                  <div
                    key={item.id}
                    className="h-full shrink-0"
                    style={{ width: cardWidth > 0 ? cardWidth : undefined }}
                  >
                    <PillarCard
                      title={item.title}
                      description={item.description}
                      image={item.image}
                      isActive={isActive}
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 flex shrink-0 items-center justify-center gap-2 md:mt-6">
            {Array.from({ length: pageCount }).map((_, index) => (
              <span
                key={index}
                aria-hidden
                className={cn(
                  "h-2 rounded-full transition-all duration-300",
                  index === activePage ? "w-8 bg-primary" : "w-2 bg-primary/20",
                )}
              />
            ))}
          </div>

          <p className="mt-3 shrink-0 pb-2 text-center font-sans text-xs font-medium uppercase tracking-[0.2em] text-primary-light">
            {activePage + 1} / {pageCount}
          </p>
        </Container>
      </div>
    </section>
  );
}
