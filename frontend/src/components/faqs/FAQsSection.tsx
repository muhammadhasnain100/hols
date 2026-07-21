"use client";

import { useState } from "react";
import { FAQItem } from "@/components/faqs/FAQItem";
import { faqsContent } from "@/content/faqs";
import { heroLayout } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

const landingFaqs = faqsContent.items.slice(0, faqsContent.landing.maxItems);

export function FAQsSection() {
  const [openItems, setOpenItems] = useState(() => new Set<number>());

  const toggleItem = (index: number) => {
    setOpenItems((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  return (
    <section
      id="faqs"
      data-nav-surface="light"
      className="relative w-full overflow-hidden bg-[#F4F5F7] py-12 md:py-14 lg:py-16"
    >
      <div className={cn("relative w-full", heroLayout.gutterX)}>
        <div className="grid items-start gap-8 md:gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-12 xl:gap-16">
          <div className="w-full max-w-xl text-left lg:max-w-none">
            <h2 className="font-sans text-[1.875rem] font-bold leading-[1.05] tracking-[0.01em] text-primary sm:text-[2.25rem] md:text-[3.75rem]">
              {faqsContent.hero.headline}
            </h2>
            <p className="text-brand-body mt-4 max-w-xl text-primary/75 md:mt-5">
              {faqsContent.hero.subhead}
            </p>
          </div>

          <div className="flex flex-col gap-2.5 md:gap-3">
            {landingFaqs.map((item, index) => (
              <FAQItem
                key={item.question}
                question={item.question}
                answer={item.answer}
                open={openItems.has(index)}
                onToggle={() => toggleItem(index)}
                variant="card"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
