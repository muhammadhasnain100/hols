import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { landingContent } from "@/content/landing";

export function HeroSection() {
  const { hero } = landingContent;

  return (
    <section className="relative overflow-hidden bg-gradient-science-haze pt-16 pb-20 md:pt-24 md:pb-28">
      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-accent/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-80 w-80 rounded-full bg-accent-light/30 blur-3xl" />

      <Container>
        <div className="relative mx-auto max-w-4xl text-center">
          <Eyebrow className="mb-6">{hero.eyebrow}</Eyebrow>
          <h1 className="text-brand-heading text-primary">{hero.headline}</h1>
          <p className="mx-auto mt-6 max-w-2xl text-brand-body text-muted">
            {hero.subhead}
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button href={hero.primaryCta.href} variant="primary">
              {hero.primaryCta.label}
            </Button>
            <Button href={hero.secondaryCta.href} variant="secondary">
              {hero.secondaryCta.label}
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
