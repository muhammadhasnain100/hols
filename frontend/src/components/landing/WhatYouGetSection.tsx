import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { ScrollReveal, StaggerChildren } from "@/components/animations/ScrollReveal";
import { landingContent } from "@/content/landing";
import { cn } from "@/lib/utils";

function Callout({
  index,
  title,
  description,
  side,
}: {
  index: number;
  title: string;
  description: string;
  side: "left" | "right";
}) {
  const connector =
    side === "left" ? (
      <div className="relative hidden h-px w-16 shrink-0 bg-gradient-to-l from-accent to-transparent lg:block lg:-mr-6 xl:w-24">
        <span className="absolute right-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_4px_rgba(21,39,68,0.06)]" />
      </div>
    ) : (
      <div className="relative hidden h-px w-16 shrink-0 bg-gradient-to-r from-accent to-transparent lg:block lg:-ml-6 xl:w-24">
        <span className="absolute left-0 top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_0_4px_rgba(21,39,68,0.06)]" />
      </div>
    );

  return (
    <div
      data-stagger-item
      className={cn("flex items-start", side === "left" ? "lg:justify-end" : "lg:justify-start")}
    >
      <div className={cn("flex-1", side === "left" ? "lg:text-right" : "lg:text-left")}>
        <div
          className={cn(
            "flex items-center gap-3",
            side === "left" ? "lg:justify-end" : "lg:justify-start",
          )}
        >
          {side === "right" ? connector : null}
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 font-sans text-xs font-semibold text-accent">
            0{index}
          </span>
          <h3 className="font-sans text-lg font-semibold text-white md:text-xl">{title}</h3>
          {side === "left" ? connector : null}
        </div>
        {/* Gilroy Light · 18px */}
        <p className="font-body text-brand-body mt-3 text-white/70">{description}</p>
      </div>
    </div>
  );
}

export function WhatYouGetSection() {
  const { whatYouGet } = landingContent;
  const [courses, dosing, documents] = whatYouGet.cards;

  return (
    <Section
      id="what-you-get"
      variant="primary"
      className="relative z-10 overflow-hidden bg-[#142644] py-20 md:py-28"
    >
      <ScrollReveal className="mx-auto max-w-3xl text-center">
        {/* Google Sans Regular · 34px */}
        <h2 className="font-sans text-brand-subheading text-white">{whatYouGet.headline}</h2>
      </ScrollReveal>

      <StaggerChildren
        className="mx-auto mt-16 grid max-w-6xl items-center gap-10 md:mt-20 lg:grid-cols-[1fr_minmax(0,22rem)_1fr] lg:gap-6"
        stagger={0.12}
      >
        <div className="flex flex-col gap-14 lg:gap-28">
          <Callout index={1} title={courses.title} description={courses.description} side="left" />
          <Callout index={3} title={documents.title} description={documents.description} side="left" />
        </div>

        <div data-stagger-item className="relative order-first mx-auto w-full max-w-sm lg:order-none">
          <div className="absolute -inset-6 rounded-full bg-accent/10 blur-3xl" aria-hidden />
          <div className="relative mx-auto aspect-[4/5] w-full max-w-[22rem]">
            <Image
              src="/assets/creatives/One%20place%20to%20train%20your%20team%20and%20run%20peptides%20properly_-Photoroom.png"
              alt={whatYouGet.headline}
              fill
              className="object-contain drop-shadow-[0_24px_60px_rgba(0,0,0,0.35)]"
              sizes="(max-width: 1024px) 90vw, 22rem"
              priority={false}
            />
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <Callout index={2} title={dosing.title} description={dosing.description} side="right" />
        </div>
      </StaggerChildren>
    </Section>
  );
}
