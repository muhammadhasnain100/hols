"use client";

import { useState } from "react";
import { FAQItem } from "@/components/faqs/FAQItem";
import { faqsContent } from "@/content/faqs";

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
      className="relative w-full overflow-hidden bg-[#F4F5F7] py-16 md:py-20 lg:py-24"
    >
      <div className="relative w-full px-4 md:px-5 lg:px-6">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16 xl:gap-20">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <div className="w-full max-w-3xl text-left">
              <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-primary/50 md:text-xs">
                {faqsContent.hero.eyebrow}
              </p>
              <h2 className="mt-4 font-sans text-3xl font-bold tracking-[-0.02em] text-primary md:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
                {faqsContent.hero.headline}
              </h2>
              <p className="font-body mt-4 max-w-xl text-base text-muted md:text-lg">
                {faqsContent.hero.subhead}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 md:gap-4">
            {faqsContent.items.map((item, index) => (
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
