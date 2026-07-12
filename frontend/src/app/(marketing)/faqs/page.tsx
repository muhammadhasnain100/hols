import { HeroShell } from "@/components/layout/HeroShell";
import { PageHero } from "@/components/ui/PageHero";
import { CTABlock } from "@/components/ui/CTABlock";
import { FAQsSection } from "@/components/faqs/FAQsSection";
import { faqsContent } from "@/content/faqs";

export default function FAQsPage() {
  return (
    <>
      <HeroShell variant="landing">
        <PageHero
          variant="landing"
          headline={faqsContent.hero.headline}
          subhead={faqsContent.hero.subhead}
        />
      </HeroShell>

      <FAQsSection />

      <CTABlock
        headline={faqsContent.closingCta.headline}
        primaryCta={faqsContent.closingCta.primaryCta}
        secondaryCta={faqsContent.closingCta.secondaryCta}
        variant="muted"
      />
    </>
  );
}
