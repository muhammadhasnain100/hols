import Image from "next/image";
import { HeroButton } from "@/components/hero/HeroButton";
import { landingContent } from "@/content/landing";
import { heroLayout } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

export function PricingTeaserSection() {
  const { pricingTeaser } = landingContent;

  return (
    <section
      id="pricing"
      data-nav-surface="light"
      className="relative w-full overflow-hidden bg-[#F4F5F7] pt-12 pb-8 md:pt-14 md:pb-10 lg:pt-16 lg:pb-10"
    >
      <div className={cn("relative w-full", heroLayout.gutterX)}>
        <div className="w-full max-w-3xl text-left lg:max-w-4xl">
          <h2 className="font-sans text-[1.875rem] font-bold leading-[1.05] tracking-[0.01em] text-primary sm:text-[2.25rem] md:text-[3.75rem]">
            {pricingTeaser.headline}
          </h2>
          <p className="text-brand-body mt-4 max-w-xl text-primary/75 md:mt-5">
            {pricingTeaser.body}
          </p>
        </div>

        <div className="mt-8 grid w-full gap-4 md:mt-10 md:grid-cols-3 lg:gap-5">
          {pricingTeaser.plans.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "group relative mx-auto aspect-[4/5] w-full max-w-[22rem] overflow-hidden rounded-2xl shadow-[0_8px_24px_rgba(21,39,68,0.08)] md:max-w-none",
                plan.featured &&
                  "ring-2 ring-accent ring-offset-2 ring-offset-[#F4F5F7]",
              )}
            >
              <Image
                src={plan.image}
                alt=""
                fill
                className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
                sizes="(max-width: 768px) 100vw, 33vw"
              />
              <div
                aria-hidden
                className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/45 to-black/25"
              />

              {"badge" in plan && plan.badge ? (
                <span
                  className={cn(
                    "text-brand-caption absolute left-4 top-4 z-10 rounded-full px-3 py-1.5 font-semibold uppercase tracking-[0.08em]",
                    plan.featured
                      ? "bg-accent text-primary"
                      : "border border-white/35 bg-black/35 text-white backdrop-blur-sm",
                  )}
                >
                  {plan.badge}
                </span>
              ) : null}

              <div className="relative z-10 flex h-full flex-col justify-end gap-4 px-5 pb-5 pt-12 text-center sm:px-6 sm:pb-6">
                <div className="space-y-2">
                  <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-white/85">
                    {plan.title}
                  </p>

                  <h3 className="font-sans text-3xl font-bold tracking-[0.01em] text-white sm:text-4xl">
                    {plan.price}
                  </h3>

                  <p className="text-brand-body text-white/70">{plan.duration}</p>
                </div>

                <div className="flex justify-center pt-1">
                  <HeroButton
                    href={plan.cta.href}
                    variant={plan.featured ? "primary" : "secondary"}
                  >
                    {plan.cta.label}
                  </HeroButton>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
