import { HeroShell } from "@/components/layout/HeroShell";
import { PageHero } from "@/components/ui/PageHero";
import { CTABlock } from "@/components/ui/CTABlock";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { featuresContent } from "@/content/features";

export const metadata = {
  title: "Features | House of Life Sciences",
};

export default function FeaturesPage() {
  return (
    <>
      <HeroShell>
        <PageHero
          headline={featuresContent.hero.headline}
          subhead={featuresContent.hero.subhead}
        />
      </HeroShell>

      {featuresContent.sections.map((feature, index) => (
        <section
          key={feature.id}
          id={feature.id}
          className={`py-16 md:py-24 ${index % 2 === 0 ? "bg-background" : "bg-primary/[0.03]"}`}
        >
          <ScrollReveal className="mx-auto grid max-w-5xl gap-8 px-6 md:grid-cols-[1fr_1.2fr] md:items-center md:gap-16 lg:px-8">
            <div>
              <p className="text-brand-caption font-medium uppercase tracking-wider text-primary-light">
                {feature.title}
              </p>
              <h2 className="mt-3 font-sans text-2xl font-semibold text-primary md:text-3xl">
                {feature.headline}
              </h2>
            </div>
            <p className="text-brand-body text-muted">{feature.body}</p>
          </ScrollReveal>
        </section>
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
