import { Button } from "@/components/ui/Button";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { Container } from "@/components/ui/Container";
import { landingContent } from "@/content/landing";
import { cn } from "@/lib/utils";

function CheckIcon() {
  return (
    <svg
      className="mt-0.5 h-4 w-4 shrink-0 text-accent"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth="2.2"
      aria-hidden
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

const SHARED_INCLUDES = [
  "Courses, dosing tools & documents",
  "Evidence-based peptide reference",
  "Certification pathway",
] as const;

export function PricingTeaserSection() {
  const { pricingTeaser } = landingContent;

  return (
    <section
      id="pricing"
      data-nav-surface="dark"
      className="relative overflow-hidden bg-primary pt-20 text-white md:pt-28"
    >
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
          {/* Caption · Google Sans Regular · 14px */}
          <span className="text-brand-caption inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 uppercase tracking-[0.18em] text-accent">
            {pricingTeaser.eyebrow}
          </span>
          {/* Sub-heading · Google Sans Regular · 34px */}
          <h2 className="font-sans text-brand-subheading mt-5 text-white">
            {pricingTeaser.headline}
          </h2>
          {/* Body · Gilroy Light · 18px */}
          <p className="font-body text-brand-body mt-4 text-white/75">{pricingTeaser.body}</p>
        </ScrollReveal>

        <ScrollReveal
          className="relative mx-auto mt-14 grid max-w-6xl gap-5 md:grid-cols-3 md:gap-6"
          delay={0.08}
        >
          {pricingTeaser.plans.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "group relative flex flex-col rounded-3xl border p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 md:p-8",
                plan.featured
                  ? "border-accent/50 bg-white/[0.08] shadow-[0_0_60px_rgba(190,242,100,0.12)] md:-translate-y-2 md:hover:-translate-y-3.5"
                  : "border-white/15 bg-white/[0.04] hover:border-white/30",
              )}
            >
              {"badge" in plan && plan.badge ? (
                <span
                  className={cn(
                    "text-brand-caption absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1 uppercase tracking-[0.14em]",
                    plan.featured
                      ? "bg-accent text-primary"
                      : "border border-white/20 bg-primary text-accent",
                  )}
                >
                  {plan.badge}
                </span>
              ) : null}

              <p className="text-brand-caption uppercase tracking-[0.16em] text-white/55">
                {plan.title}
              </p>

              {/* Google Sans Bold */}
              <div className="mt-5 flex items-baseline gap-1">
                <span className="font-sans text-4xl font-bold tracking-tight text-white md:text-[2.75rem]">
                  {plan.price}
                </span>
              </div>

              <p className="font-body mt-3 flex items-center gap-2 text-base font-light tracking-[0.02em] text-white/70">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                {plan.duration}
              </p>

              <div className="my-6 h-px w-full bg-white/10" />

              <ul className="flex flex-1 flex-col gap-3">
                {SHARED_INCLUDES.map((feature) => (
                  <li
                    key={feature}
                    className="font-body flex items-start gap-3 text-base font-light tracking-[0.02em] text-white/80"
                  >
                    <CheckIcon />
                    {feature}
                  </li>
                ))}
              </ul>

              <Button
                href={plan.cta.href}
                variant={plan.featured ? "primary" : "secondary"}
                size="lg"
                className={cn(
                  "mt-8 w-full justify-center",
                  !plan.featured &&
                    "border-white/30 bg-white/10 text-white hover:border-accent hover:bg-accent hover:text-primary",
                )}
              >
                {plan.cta.label}
              </Button>
            </article>
          ))}
        </ScrollReveal>
      </Container>
    </section>
  );
}
