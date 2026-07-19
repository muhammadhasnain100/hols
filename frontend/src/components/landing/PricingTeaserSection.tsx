import Image from "next/image";
import Link from "next/link";
import { landingContent } from "@/content/landing";
import { cn } from "@/lib/utils";

export function PricingTeaserSection() {
  const { pricingTeaser } = landingContent;

  return (
    <section
      id="pricing"
      data-nav-surface="light"
      className="relative w-full overflow-hidden bg-[#F4F5F7] py-16 md:py-20 lg:py-24"
    >
      <div className="relative w-full px-4 md:px-5 lg:px-6">
        <div className="w-full max-w-3xl text-left">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-primary/50 md:text-xs">
            {pricingTeaser.eyebrow}
          </p>
          <h2 className="mt-4 font-sans text-3xl font-bold tracking-[-0.02em] text-primary md:text-4xl lg:text-[2.65rem] lg:leading-[1.12]">
            {pricingTeaser.headline}
          </h2>
          <p className="font-body mt-4 max-w-xl text-base text-muted md:text-lg">
            {pricingTeaser.body}
          </p>
        </div>

        {/* Brighton-style image plan cards — full-width row */}
        <div className="mt-10 grid w-full gap-3 md:mt-12 md:grid-cols-3 md:gap-4 lg:gap-5">
          {pricingTeaser.plans.map((plan) => (
            <article
              key={plan.id}
              className={cn(
                "group relative flex min-h-[28rem] flex-col overflow-hidden sm:min-h-[30rem] lg:min-h-[32rem]",
                plan.featured && "ring-2 ring-accent ring-offset-2 ring-offset-[#F4F5F7]",
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
                    "absolute left-4 top-4 z-10 rounded-full px-3 py-1 font-sans text-[0.65rem] font-semibold uppercase tracking-[0.14em]",
                    plan.featured
                      ? "bg-accent text-primary"
                      : "border border-white/35 bg-black/35 text-white backdrop-blur-sm",
                  )}
                >
                  {plan.badge}
                </span>
              ) : null}

              <div className="relative z-10 flex h-full flex-col items-center px-6 pb-8 pt-14 text-center sm:px-7 sm:pb-9 sm:pt-16">
                <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.28em] text-white/80 md:text-xs">
                  {plan.title}
                </p>

                <h3 className="mt-5 font-sans text-4xl font-bold tracking-[-0.02em] text-white md:text-5xl">
                  {plan.price}
                </h3>

                <p className="font-body mt-3 text-sm text-white/70 md:text-base">
                  {plan.duration}
                </p>

                <div className="mt-auto pt-10">
                  <Link
                    href={plan.cta.href}
                    className={cn(
                      "inline-flex min-h-11 items-center justify-center gap-2 border px-6 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] transition-colors duration-300",
                      plan.featured
                        ? "border-accent bg-accent text-primary hover:bg-white hover:border-white"
                        : "border-white/85 bg-transparent text-white hover:border-accent hover:bg-accent hover:text-primary",
                    )}
                  >
                    {plan.cta.label}
                    <span aria-hidden>→</span>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
