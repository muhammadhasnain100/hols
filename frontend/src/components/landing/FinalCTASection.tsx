import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Container } from "@/components/ui/Container";
import { landingContent } from "@/content/landing";

export function FinalCTASection() {
  const { finalCta } = landingContent;

  return (
    <section className="border-t border-white/10 bg-primary py-14 text-white md:py-16">
      <Container>
        <ScrollReveal className="mx-auto max-w-3xl text-center">
          <p className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-accent">
            {finalCta.eyebrow}
          </p>
          <h2 className="font-serif text-3xl leading-[1.12] text-white sm:text-4xl md:text-[2.5rem]">
            {finalCta.headline}
          </h2>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-0">
            <Button href={finalCta.primaryCta.href} variant="primary" size="lg">
              {finalCta.primaryCta.label}
            </Button>
            <span aria-hidden className="hidden px-4 text-white/40 sm:inline">
              ·
            </span>
            <Button
              href={finalCta.secondaryCta.href}
              variant="secondary"
              size="lg"
              className="border-white/30 bg-white/10 text-white hover:border-accent hover:bg-accent hover:text-primary"
            >
              {finalCta.secondaryCta.label}
            </Button>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
