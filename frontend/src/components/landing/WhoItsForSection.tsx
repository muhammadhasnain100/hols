"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { Container } from "@/components/ui/Container";
import { landingContent } from "@/content/landing";
import { prefersReducedMotion } from "@/lib/motion";

const AUDIENCE_META = [
  { tag: "Owners", tags: ["Standards", "Lower risk", "Professional"], metric: "Whole-team access" },
  { tag: "Providers", tags: ["Dosing", "Protocols", "Credential"], metric: "Clinical confidence" },
  { tag: "Learners", tags: ["Evidence-based", "Clear"], metric: "Self-paced" },
] as const;

function DashboardCard({
  title,
  description,
  image,
  index,
}: {
  title: string;
  description: string;
  image: string;
  index: number;
}) {
  const meta = AUDIENCE_META[index] ?? AUDIENCE_META[0];

  return (
    <article className="group flex h-full flex-col rounded-2xl border border-white/10 bg-white/[0.04] p-3 transition-colors duration-300 hover:border-white/20 hover:bg-white/[0.07]">
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-white/10 bg-white/[0.03]">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-[900ms] ease-out group-hover:scale-[1.06]"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
        <span className="absolute left-3 top-3 rounded-full bg-primary/70 px-2.5 py-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-white backdrop-blur">
          {meta.tag}
        </span>
      </div>

      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center gap-2">
          <span className="font-sans text-xs font-semibold text-accent">0{index + 1}</span>
          <h3 className="font-sans text-lg font-semibold text-white">{title}</h3>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-white/65">{description}</p>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {meta.tags.map((t) => (
            <span
              key={t}
              className="rounded-md border border-white/10 bg-white/[0.04] px-2 py-1 font-sans text-[0.7rem] font-medium text-white/70"
            >
              {t}
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 border-t border-white/10 pt-3">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          <span className="font-sans text-xs text-white/55">{meta.metric}</span>
        </div>
      </div>
    </article>
  );
}

export function WhoItsForSection() {
  const { whoItsFor } = landingContent;
  const [reduceMotion, setReduceMotion] = useState(false);

  const sectionRef = useRef<HTMLElement>(null);
  const headlineRef = useRef<HTMLDivElement>(null);
  const headlineTextRef = useRef<HTMLHeadingElement>(null);
  const shellRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  useGSAP(
    () => {
      if (reduceMotion) return;

      registerGsap();

      const headlineText = headlineTextRef.current;
      const headline = headlineRef.current;
      const shell = shellRef.current;
      const cards = cardRefs.current.filter(Boolean) as HTMLDivElement[];

      if (!headlineText || !headline || !shell || !cards.length) return;

      gsap.set(headlineText, { yPercent: 110, opacity: 0 });
      gsap.set(shell, { autoAlpha: 0, y: 40 });
      gsap.set(cards, { autoAlpha: 0, y: 28, scale: 0.97 });

      gsap.to(headlineText, {
        yPercent: 0,
        opacity: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: headline,
          start: "top 82%",
          toggleActions: "play none none reverse",
        },
      });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 66%",
          toggleActions: "play none none reverse",
        },
      });

      tl.to(shell, { autoAlpha: 1, y: 0, duration: 0.7, ease: "power3.out" }).to(
        cards,
        {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          ease: "power3.out",
          stagger: 0.12,
        },
        "-=0.35",
      );

      requestAnimationFrame(() => ScrollTrigger.refresh());
    },
    { scope: sectionRef, dependencies: [reduceMotion] },
  );

  return (
    <section ref={sectionRef} id="who-its-for" className="relative overflow-hidden bg-[#142644] py-20 md:py-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 0%, rgba(255,255,255,0.08), transparent 45%), radial-gradient(circle at 85% 100%, rgba(190,242,100,0.08), transparent 40%)",
        }}
      />
      <Container>
        <div ref={headlineRef} className="mx-auto max-w-3xl overflow-hidden text-center">
          <h2 ref={headlineTextRef} className="text-brand-subheading text-white">
            {whoItsFor.headline}
          </h2>
        </div>
        <p className="mx-auto mt-4 max-w-xl text-center text-sm text-white/60 md:text-base">
          One platform, every role in your clinic covered.
        </p>

        {/* Dashboard shell */}
        <div
          ref={shellRef}
          className="mx-auto mt-12 max-w-6xl rounded-3xl border border-white/10 bg-white/[0.03] p-3 shadow-[0_30px_90px_rgba(0,0,0,0.35)] backdrop-blur md:mt-16 md:p-4"
        >
          {/* Window / top bar */}
          <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-white/20" />
              <span className="h-3 w-3 rounded-full bg-accent/70" />
            </div>
            <span className="font-sans text-xs font-medium uppercase tracking-[0.18em] text-white/60">
              Practice overview
            </span>
            <span className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 font-sans text-xs text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              Active
            </span>
          </div>

          {/* Cards grid */}
          <div className="grid gap-3 p-1 pt-3 md:grid-cols-3 md:gap-4 md:p-3">
            {whoItsFor.audiences.map((audience, index) => (
              <div
                key={audience.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
              >
                <DashboardCard
                  title={audience.title}
                  description={audience.description}
                  image={audience.image}
                  index={index}
                />
              </div>
            ))}
          </div>

          {/* Summary strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3">
            <span className="font-sans text-xs text-white/55">
              {whoItsFor.audiences.length} roles · one shared standard
            </span>
            <div className="flex items-center gap-4 font-sans text-xs text-white/70">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Training
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Dosing
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" /> Paperwork
              </span>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
