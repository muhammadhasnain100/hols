import { Section } from "@/components/ui/Section";
import { PageHero } from "@/components/ui/PageHero";
import { CTABlock } from "@/components/ui/CTABlock";
import { FAQItem } from "@/components/faqs/FAQItem";
import { faqsContent } from "@/content/faqs";

export default function FAQsPage() {
  return (
    <>
      <Section variant="gradient" className="pt-20 pb-16 md:pt-28">
        <PageHero
          headline={faqsContent.hero.headline}
          subhead={faqsContent.hero.subhead}
        />
      </Section>

      <Section variant="default">
        <div className="mx-auto max-w-3xl">
          {faqsContent.items.map((item, index) => (
            <FAQItem
              key={item.question}
              question={item.question}
              answer={item.answer}
              defaultOpen={index === 0}
            />
          ))}
        </div>
      </Section>

      <CTABlock
        headline={faqsContent.closingCta.headline}
        primaryCta={faqsContent.closingCta.primaryCta}
        secondaryCta={faqsContent.closingCta.secondaryCta}
        variant="muted"
      />
    </>
  );
}
