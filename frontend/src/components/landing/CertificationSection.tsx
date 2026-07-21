import Image from "next/image";
import { HeroButton } from "@/components/hero/HeroButton";
import { landingContent } from "@/content/landing";
import { heroLayout } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

export function CertificationSection() {
  const { certification } = landingContent;

  const accent = certification.headlineAccent;
  const headlineParts = accent
    ? certification.headline.split(new RegExp(`(${accent})`, "i"))
    : [certification.headline];

  return (
    <section
      id="certification"
      data-nav-surface="light"
      className="relative w-full overflow-hidden bg-[#F4F5F7] py-12 md:py-14 lg:py-16"
    >
      <div className={cn("relative w-full", heroLayout.gutterX)}>
        <div className="relative overflow-hidden rounded-[1.75rem] bg-black shadow-[0_16px_48px_rgba(21,39,68,0.12)]">
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_78%_42%,rgba(141,195,225,0.14),transparent_52%),radial-gradient(ellipse_at_18%_75%,rgba(221,228,102,0.07),transparent_42%)]"
            aria-hidden
          />

          <div className="relative grid items-center gap-10 px-6 py-10 sm:px-8 sm:py-12 md:gap-12 md:px-10 md:py-14 lg:grid-cols-2 lg:gap-14 lg:px-12 lg:py-16 xl:px-14">
            <div className="order-1 w-full max-w-xl lg:max-w-none">
              <p className="text-brand-caption font-semibold uppercase tracking-[0.08em] text-white/55">
                {certification.label}
              </p>

              <h2 className="font-sans mt-3 text-[1.875rem] font-bold leading-[1.05] tracking-[0.01em] text-white sm:text-[2.25rem] md:text-[3.75rem]">
                {headlineParts.map((part, index) =>
                  part.toLowerCase() === accent?.toLowerCase() ? (
                    <em key={`${part}-${index}`} className="not-italic text-accent">
                      {part}
                    </em>
                  ) : (
                    <span key={`${part}-${index}`}>{part}</span>
                  ),
                )}
              </h2>

              <p className="text-brand-body mt-6 max-w-lg text-white/75">{certification.body}</p>

              <div className="mt-10">
                <HeroButton href={certification.cta.href} variant="primary">
                  {certification.cta.label}
                </HeroButton>
              </div>
            </div>

            <div className="relative order-2 flex min-h-[18rem] w-full items-center justify-center sm:min-h-[20rem] lg:min-h-[24rem]">
              <div
                className="pointer-events-none absolute h-[70%] w-[70%] rounded-full bg-accent-light/15 blur-3xl"
                aria-hidden
              />
              <div className="relative aspect-[4/5] w-full max-w-[16rem] rotate-[-6deg] transition-transform duration-700 hover:rotate-[-3deg] sm:max-w-[18rem] md:max-w-[20rem] lg:max-w-[22rem]">
                <Image
                  src={certification.image}
                  alt={certification.headline}
                  fill
                  className="object-contain drop-shadow-[0_24px_48px_rgba(0,0,0,0.45)]"
                  sizes="(max-width: 768px) 16rem, 22rem"
                  priority={false}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
