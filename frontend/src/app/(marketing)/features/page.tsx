import { Section } from "@/components/ui/Section";
import { PageHero } from "@/components/ui/PageHero";
import { CTABlock } from "@/components/ui/CTABlock";
import { featuresContent } from "@/content/features";

export const metadata = {
  title: "Features | House of Life Sciences",
};

export default function FeaturesPage() {
  return (
    <>
      <Section variant="gradient" className="pt-20 pb-16 md:pt-28">
        <PageHero
          headline={featuresContent.hero.headline}
          subhead={featuresContent.hero.subhead}
        />
      </Section>

      {featuresContent.sections.map((feature, index) => (
        <Section
          key={feature.id}
          id={feature.id}
          variant={index % 2 === 0 ? "default" : "muted"}
        >
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-[1fr_1.2fr] md:items-center md:gap-16">
            <div>
              <p className="text-brand-caption font-medium uppercase tracking-wider text-primary-light">
                {feature.title}
              </p>
              <h2 className="mt-3 font-sans text-2xl font-semibold text-primary md:text-3xl">
                {feature.headline}
              </h2>
            </div>
            <p className="text-brand-body text-muted">{feature.body}</p>
          </div>
        </Section>
      ))}

      <CTABlock
        headline={featuresContent.closingCta.headline}
        primaryCta={featuresContent.closingCta.primaryCta}
        secondaryCta={featuresContent.closingCta.secondaryCta}
        variant="primary"
      />
    </>
  );
}
