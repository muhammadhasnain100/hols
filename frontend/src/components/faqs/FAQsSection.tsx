"use client";

import { useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap, ScrollTrigger } from "@/lib/gsap";
import { FAQsIllustration } from "@/components/illustrations/FAQsIllustration";
import { FAQItem } from "@/components/faqs/FAQItem";
import { Container } from "@/components/ui/Container";
import { faqsContent } from "@/content/faqs";
import { prefersReducedMotion } from "@/lib/motion";

export function FAQsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const imageRef = useRef<HTMLDivElement>(null);
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

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !sectionRef.current) return;

      const cards = sectionRef.current.querySelectorAll("[data-faq-card]");

      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { autoAlpha: 0, y: 40, scale: 0.98 },
          {
            autoAlpha: 1,
            y: 0,
            scale: 1,
            duration: 0.7,
            ease: "power3.out",
            scrollTrigger: {
              trigger: card,
              start: "top 88%",
              toggleActions: "play none none reverse",
            },
          },
        );
      });

      if (imageRef.current) {
        gsap.fromTo(
          imageRef.current,
          { autoAlpha: 0, x: -32 },
          {
            autoAlpha: 1,
            x: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: {
              trigger: sectionRef.current,
              start: "top 75%",
              toggleActions: "play none none reverse",
            },
          },
        );
      }
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="bg-background py-16 md:py-24">
      <Container>
        <div className="grid items-start gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
          <div
            ref={imageRef}
            className="lg:sticky lg:top-28 lg:self-start"
          >
            <div className="overflow-hidden rounded-3xl border border-border/40 bg-white shadow-[0_12px_40px_rgba(21,39,68,0.08)]">
              <FAQsIllustration className="h-auto w-full" />
            </div>
            <p className="mt-6 hidden font-sans text-sm leading-relaxed text-muted lg:block">
              Clear answers for clinic owners, providers, and anyone learning peptides
              the right way.
            </p>
          </div>

          <div className="flex flex-col gap-2.5 md:gap-3">
            {faqsContent.items.map((item, index) => (
              <div key={item.question} data-faq-card>
                <FAQItem
                  question={item.question}
                  answer={item.answer}
                  open={openItems.has(index)}
                  onToggle={() => toggleItem(index)}
                  glass
                />
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
