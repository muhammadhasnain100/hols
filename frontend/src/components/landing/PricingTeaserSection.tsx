import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Container } from "@/components/ui/Container";
import { landingContent } from "@/content/landing";

export function PricingTeaserSection() {
  const { pricingTeaser } = landingContent;

  return (
    <section className="bg-primary pt-16 text-white md:pt-20">
      <Container>
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            {pricingTeaser.eyebrow}
          </p>
          <h2 className="text-brand-subheading text-white">{pricingTeaser.headline}</h2>
          <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">
            {pricingTeaser.body}
          </p>
        </ScrollReveal>

        <ScrollReveal className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-2 md:mt-12" delay={0.08}>
          {pricingTeaser.plans.map((plan) => (
            <div
              key={plan.title}
              className="rounded-2xl border border-white/15 bg-white/5 px-6 py-5 backdrop-blur-sm"
            >
              <h3 className="font-sans text-lg font-semibold text-white">{plan.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{plan.description}</p>
            </div>
          ))}
        </ScrollReveal>

        <ScrollReveal className="mt-10 flex justify-center pb-16 md:mt-12 md:pb-20" delay={0.12}>
          <Button href={pricingTeaser.cta.href} variant="primary" size="lg">
            {pricingTeaser.cta.label}
          </Button>
        </ScrollReveal>
      </Container>
    </section>
  );
}
