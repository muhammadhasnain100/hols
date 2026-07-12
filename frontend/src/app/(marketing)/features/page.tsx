import { HeroShell } from "@/components/layout/HeroShell";
import { PageHero } from "@/components/ui/PageHero";
import { CTABlock } from "@/components/ui/CTABlock";
import { FeaturesSection } from "@/components/features/FeaturesSection";
import { featuresContent } from "@/content/features";

export const metadata = {
  title: "Features | House of Life Sciences",
};

export default function FeaturesPage() {
  return (
    <>
      <HeroShell variant="landing">
        <PageHero
          variant="landing"
          headline={featuresContent.hero.headline}
          subhead={featuresContent.hero.subhead}
        />
      </HeroShell>

      <FeaturesSection />

      <CTABlock
        headline={featuresContent.closingCta.headline}
        primaryCta={featuresContent.closingCta.primaryCta}
        secondaryCta={featuresContent.closingCta.secondaryCta}
        variant="primary"
      />
    </>
  );
}
