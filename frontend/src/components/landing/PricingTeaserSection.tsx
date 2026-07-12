import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Container } from "@/components/ui/Container";
import { landingContent } from "@/content/landing";
import { cn } from "@/lib/utils";

const PLAN_DETAILS = [
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.25a7.5 7.5 0 0 1 15 0" />
      </svg>
    ),
    features: ["One provider seat", "Full platform access", "Courses, dosing tools & documents"],
    featured: false,
  },
  {
    icon: (
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.6" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.75a6 6 0 0 0-12 0M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM19.5 10.5a2.25 2.25 0 1 0 0-4.5M4.5 10.5a2.25 2.25 0 1 1 0-4.5M21.75 18.75a5.99 5.99 0 0 0-3.75-5.56M2.25 18.75a5.99 5.99 0 0 1 3.75-5.56" />
      </svg>
    ),
    features: ["Seats for your whole team", "One shared clinical standard", "Everything in Single provider"],
    featured: true,
  },
];

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

export function PricingTeaserSection() {
  const { pricingTeaser } = landingContent;

  return (
    <section className="relative overflow-hidden bg-primary pt-20 text-white md:pt-28">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle at 50% -10%, rgba(190,242,100,0.12), transparent 45%), radial-gradient(circle at 90% 20%, rgba(141,195,225,0.10), transparent 40%)",
        }}
      />
      <Container>
        <ScrollReveal className="relative mx-auto max-w-2xl text-center">
          <h2 className="text-brand-subheading text-white">{pricingTeaser.headline}</h2>
          <p className="mt-4 text-base leading-relaxed text-white/75 md:text-lg">
            {pricingTeaser.body}
          </p>
        </ScrollReveal>

        <ScrollReveal className="relative mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2" delay={0.08}>
          {pricingTeaser.plans.map((plan, index) => {
            const detail = PLAN_DETAILS[index] ?? PLAN_DETAILS[0];
            return (
              <div
                key={plan.title}
                className={cn(
                  "group relative flex flex-col rounded-3xl border p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 md:p-8",
                  detail.featured
                    ? "border-accent/50 bg-white/[0.08] shadow-[0_0_60px_rgba(190,242,100,0.12)]"
                    : "border-white/15 bg-white/[0.04] hover:border-white/30",
                )}
              >
                {detail.featured && (
                  <span className="absolute -top-3 right-7 rounded-full bg-accent px-3 py-1 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-primary">
                    Recommended
                  </span>
                )}

                <span
                  className={cn(
                    "inline-flex h-12 w-12 items-center justify-center rounded-2xl transition-colors duration-300",
                    detail.featured
                      ? "bg-accent text-primary"
                      : "bg-accent/15 text-accent group-hover:bg-accent group-hover:text-primary",
                  )}
                >
                  {detail.icon}
                </span>

                <h3 className="mt-6 font-sans text-xl font-semibold text-white">{plan.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{plan.description}</p>

                <div className="my-6 h-px w-full bg-white/10" />

                <ul className="flex flex-col gap-3">
                  {detail.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3 text-sm text-white/80">
                      <CheckIcon />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </ScrollReveal>

        <ScrollReveal className="relative mt-12 flex justify-center" delay={0.12}>
          <Button href={pricingTeaser.cta.href} variant="primary" size="lg">
            {pricingTeaser.cta.label}
          </Button>
        </ScrollReveal>
      </Container>
    </section>
  );
}
