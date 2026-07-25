import Image from "next/image";
import { HeroButton } from "@/components/hero/HeroButton";
import { landingContent } from "@/content/landing";
import { heroLayout } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

const FINAL_CTA_HEADLINE =
  "font-sans text-[1.875rem] font-normal leading-[1.05] tracking-tight text-balance text-white sm:text-[2.25rem] md:text-[3.25rem] lg:text-[3.5rem]";

/**
 * ball.png opaque sphere ≈ 70% of the canvas (~15% transparent padding each side).
 *
 * - Box is sized ~1.45× section height so the opaque sphere fills the band.
 * - translate-x ≈ 32% = right padding (15%) + 25% of opaque (17.5%), so ~75%
 *   of the real sphere stays in view and ~25% clips past the right edge.
 */
export function FinalCTASection() {
  const { finalCta } = landingContent;
  const accent = finalCta.headlineAccent;
  const parts = accent
    ? finalCta.headline.split(new RegExp(`(${accent})`, "i"))
    : [finalCta.headline];

  return (
    <section className="relative w-full overflow-hidden bg-black">
      {/* Soft glow behind the ball */}
      <div
        className="pointer-events-none absolute top-1/2 right-[-5%] z-0 h-[85%] w-[50%] -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_40%_50%,rgba(141,195,225,0.32)_0%,rgba(56,83,164,0.14)_45%,transparent_70%)] blur-3xl"
        aria-hidden
      />

      {/*
        Ball shell — rem sizes track section min-heights × ~1.45 so the
        opaque sphere (not the transparent padding) fills the vertical space.
      */}
      <div
        className={cn(
          "pointer-events-none absolute top-1/2 right-0 z-0 aspect-square -translate-y-1/2 translate-x-[32%]",
          "h-[32rem] w-[32rem]",
          "sm:h-[38rem] sm:w-[38rem]",
          "md:h-[46rem] md:w-[46rem]",
          "lg:h-[55rem] lg:w-[55rem]",
          "xl:h-[61rem] xl:w-[61rem]",
        )}
        aria-hidden
      >
        <Image
          src={finalCta.image}
          alt=""
          fill
          className="object-contain drop-shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
          sizes="(max-width: 640px) 32rem, (max-width: 768px) 38rem, (max-width: 1024px) 46rem, 61rem"
          priority={false}
        />
      </div>

      <div
        className={cn(
          "relative z-10 flex min-h-[22rem] w-full items-center py-14",
          "sm:min-h-[26rem] sm:py-16",
          "md:min-h-[32rem] md:py-20",
          "lg:min-h-[38rem] lg:py-24",
          "xl:min-h-[42rem]",
          heroLayout.gutterX,
        )}
      >
        <div className="relative z-10 w-full max-w-[17rem] text-left sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl">
          <h2 className={FINAL_CTA_HEADLINE}>
            {parts.map((part, index) =>
              part.toLowerCase() === accent?.toLowerCase() ? (
                <span key={`${part}-${index}`} className="text-accent">
                  {part}
                </span>
              ) : (
                <span key={`${part}-${index}`}>{part}</span>
              ),
            )}
          </h2>

          <div className="mt-8 sm:mt-10 md:mt-12">
            <HeroButton href={finalCta.primaryCta.href} variant="primary">
              {finalCta.primaryCta.label}
            </HeroButton>
          </div>
        </div>
      </div>
    </section>
  );
}
