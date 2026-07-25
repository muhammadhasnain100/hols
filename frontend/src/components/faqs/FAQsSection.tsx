"use client";

import { useState } from "react";
import { FAQItem } from "@/components/faqs/FAQItem";
import { faqsContent } from "@/content/faqs";
import { heroLayout } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

/** Match Hook / Pillars / Footer landing surface */
const FAQS_BG = "#E5E5E5";

const landingFaqs = faqsContent.items.slice(0, faqsContent.landing.maxItems);

export function FAQsSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section
      id="faqs"
      data-nav-surface="light"
      className="relative w-full overflow-x-hidden py-10 sm:py-12 md:py-14 lg:py-16"
      style={{ backgroundColor: FAQS_BG }}
    >
      <div className={cn("relative w-full", heroLayout.gutterX)}>
        <div className="grid items-start gap-6 sm:gap-8 md:gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)] lg:gap-12 xl:gap-16">
          <div className="w-full max-w-xl text-left lg:sticky lg:top-24 lg:max-w-none">
            <h2 className="font-sans text-[1.5rem] font-normal leading-[1.12] tracking-tight text-balance text-primary sm:text-[2rem] sm:leading-[1.08] md:text-[2.75rem] lg:text-[3.5rem] xl:text-[3.75rem]">
              {faqsContent.hero.headline}
            </h2>
            <p className="text-brand-body mt-3 max-w-xl text-pretty text-primary/75 sm:mt-4 md:mt-5">
              {faqsContent.hero.subhead}
            </p>
          </div>

          {/*
            Accordion only — do not call ScrollTrigger.refresh on toggle.
            Refresh mid-scroll scrambles pinned sections above (Hook / Who It's For).
          */}
          <div className="flex min-w-0 w-full flex-col gap-2 sm:gap-2.5 md:gap-3">
            {landingFaqs.map((item, index) => (
              <FAQItem
                key={item.question}
                question={item.question}
                answer={item.answer}
                open={openIndex === index}
                onToggle={() =>
                  setOpenIndex((current) => (current === index ? null : index))
                }
                variant="card"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
