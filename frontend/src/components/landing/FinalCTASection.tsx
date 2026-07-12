import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Container } from "@/components/ui/Container";
import { landingContent } from "@/content/landing";

export function FinalCTASection() {
  const { finalCta, trustStrip } = landingContent;

  return (
    <section className="bg-primary pb-24 pt-16 text-white md:pb-28 md:pt-20">
      <Container>
        <ScrollReveal>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.09] via-white/[0.04] to-transparent px-8 py-16 text-center md:px-16 md:py-20">
            {/* Decorative glow + grid */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 50% 0%, rgba(190,242,100,0.16), transparent 55%)",
              }}
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
                backgroundSize: "44px 44px",
                maskImage: "radial-gradient(circle at 50% 40%, black, transparent 70%)",
                WebkitMaskImage: "radial-gradient(circle at 50% 40%, black, transparent 70%)",
              }}
            />

            <div className="relative">
              <h2 className="mx-auto max-w-3xl font-serif text-3xl leading-[1.1] text-white sm:text-4xl md:text-[2.75rem]">
                {finalCta.headline}
              </h2>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button href={finalCta.primaryCta.href} variant="primary" size="lg">
                  {finalCta.primaryCta.label}
                </Button>
                <Button
                  href={finalCta.secondaryCta.href}
                  variant="secondary"
                  size="lg"
                  className="border-white/30 bg-white/10 text-white hover:border-accent hover:bg-accent hover:text-primary"
                >
                  {finalCta.secondaryCta.label}
                </Button>
              </div>

              <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {trustStrip.map((item) => (
                  <span key={item} className="flex items-center gap-2 font-sans text-sm text-white/60">
                    <svg className="h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                    </svg>
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
