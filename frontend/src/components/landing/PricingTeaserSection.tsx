import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { landingContent } from "@/content/landing";

export function PricingTeaserSection() {
  const { pricingTeaser } = landingContent;

  return (
    <Section variant="muted">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-brand-subheading text-primary">
          {pricingTeaser.headline}
        </h2>
        <p className="mt-4 text-brand-body text-muted">{pricingTeaser.body}</p>
        <div className="mt-8">
          <Button href={pricingTeaser.cta.href} variant="primary">
            {pricingTeaser.cta.label}
          </Button>
        </div>
      </div>
    </Section>
  );
}
