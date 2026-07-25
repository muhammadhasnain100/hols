import Image from "next/image";
import { HeroButton } from "@/components/hero/HeroButton";
import { landingContent } from "@/content/landing";
import { heroLayout } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

const FINAL_CTA_HEADLINE =
  "font-sans text-[1.5rem] font-normal leading-[1.1] tracking-tight text-white sm:text-[2rem] sm:leading-[1.08] md:text-[3rem] lg:text-[3.5rem] lg:leading-[1.05]";

/**
 * ball.png opaque sphere ≈ 70% of the square canvas (~15% transparent padding each side).
 *
 * Composition: ball hangs off the right edge so the curved silhouette faces the copy
 * (never a hard vertical clip through the sphere).
 *
 * The lime connectors sit on the asset’s right — `scale-x-[-1]` mirrors them onto the
 * visible side so they stay in frame after the right-edge crop.
 *
 * - Ball box ≈ 1.33× section height → visible sphere (0.7× box) ≈ 93% of band height,
 *   fully contained (no flat top/bottom cuts).
 * - Phones: translate-x-[52%] ≈ 50% visible; md+: translate-x-[40%] ≈ 65% visible.
 */
export function FinalCTASection() {
  const { finalCta } = landingContent;
  const accent = finalCta.headlineAccent;
  const whiteText = accent
    ? finalCta.headline.replace(new RegExp(`${accent}\\.?$`, "i"), "").trim()
    : finalCta.headline;
  const accentText = accent
    ? finalCta.headline.slice(finalCta.headline.toLowerCase().lastIndexOf(accent.toLowerCase()))
    : null;

  return (
    <section className="relative w-full overflow-hidden bg-black">
      <div
        className={cn(
          "pointer-events-none absolute top-1/2 right-0 z-0 aspect-square -translate-y-1/2 translate-x-[52%] md:translate-x-[40%]",
          "h-[32rem] w-[32rem]",
          "sm:h-[37rem] sm:w-[37rem]",
          "md:h-[45rem] md:w-[45rem]",
          "lg:h-[53rem] lg:w-[53rem]",
          "xl:h-[59rem] xl:w-[59rem]",
        )}
        aria-hidden
      >
        <Image
          src={finalCta.image}
          alt=""
          fill
          className="scale-x-[-1] object-contain"
          sizes="(max-width: 640px) 32rem, (max-width: 768px) 37rem, (max-width: 1024px) 45rem, 59rem"
          priority={false}
        />
      </div>

      {/* Soft left vignette keeps copy readable over the ball */}
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-[1] w-[58%] bg-[linear-gradient(90deg,rgba(0,0,0,0.6)_0%,rgba(0,0,0,0.28)_55%,transparent_100%)] sm:w-[52%] md:w-[48%]"
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 flex min-h-[24rem] w-full items-center py-14",
          "sm:min-h-[28rem] sm:py-16",
          "md:min-h-[34rem] md:py-20",
          "lg:min-h-[40rem] lg:py-24",
          "xl:min-h-[44rem]",
          heroLayout.gutterX,
        )}
      >
        <div className="relative z-10 w-full max-w-[20rem] text-left sm:max-w-md md:max-w-xl lg:max-w-2xl xl:max-w-3xl">
          <h2 className={FINAL_CTA_HEADLINE}>
            <span className="block whitespace-nowrap">{whiteText}</span>
            {accentText ? (
              <span className="block whitespace-nowrap text-accent">{accentText}</span>
            ) : null}
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
