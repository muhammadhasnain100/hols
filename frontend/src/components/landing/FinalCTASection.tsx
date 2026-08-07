import Image from "next/image";
import { HeroButton } from "@/components/hero/HeroButton";
import { brand } from "@/config/brand";
import { landingContent } from "@/content/landing";
import { heroLayout } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

/** Brand Prussian Blue — continuous with the footer below */
const FINAL_CTA_BG = brand.colors.primary.prussianBlue;

const FINAL_CTA_HEADLINE = cn(
  "font-sans font-normal tracking-tight text-white",
  "text-[clamp(1.25rem,5.6vw,1.5rem)] leading-[1.15]",
  "sm:text-[2rem] sm:leading-[1.08]",
  "md:text-[3rem] md:leading-[1.06]",
  "lg:text-[3.5rem] lg:leading-[1.05]",
);

/**
 * ball.png opaque sphere ≈ 70% of the square canvas (~15% transparent padding each side).
 *
 * Composition: ball hangs off the right edge so the curved silhouette faces the copy
 * (never a hard vertical clip through the sphere).
 *
 * The lime connectors sit on the asset’s right — `scale-x-[-1]` mirrors them onto the
 * visible side so they stay in frame after the right-edge crop.
 *
 * Responsive:
 * - Phones: smaller ball, heavier right crop (~45% visible), copy can wrap.
 * - md+: larger ball, ~65% visible, headline stays two single lines.
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
    <section
      data-nav-surface="dark"
      className="relative w-full overflow-hidden"
      style={{ backgroundColor: FINAL_CTA_BG }}
    >
      <div
        className={cn(
          "pointer-events-none absolute top-1/2 right-0 z-0 aspect-square -translate-y-1/2",
          // Crop more on small screens so copy stays clear of the sphere
          "translate-x-[58%] sm:translate-x-[52%] md:translate-x-[40%]",
          "h-[22rem] w-[22rem]",
          "sm:h-[32rem] sm:w-[32rem]",
          "md:h-[42rem] md:w-[42rem]",
          "lg:h-[50rem] lg:w-[50rem]",
          "xl:h-[56rem] xl:w-[56rem]",
        )}
        aria-hidden
      >
        <Image
          src={finalCta.image}
          alt=""
          fill
          className="scale-x-[-1] object-contain"
          sizes="(max-width: 640px) 22rem, (max-width: 768px) 32rem, (max-width: 1024px) 42rem, 56rem"
          priority={false}
        />
      </div>

      {/* Soft left vignette keeps copy readable over the ball */}
      <div
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 z-[1]",
          "w-[72%] bg-[linear-gradient(90deg,rgba(21,39,68,0.78)_0%,rgba(21,39,68,0.42)_48%,transparent_100%)]",
          "sm:w-[58%] sm:bg-[linear-gradient(90deg,rgba(21,39,68,0.65)_0%,rgba(21,39,68,0.3)_55%,transparent_100%)]",
          "md:w-[50%]",
        )}
        aria-hidden
      />

      <div
        className={cn(
          "relative z-10 flex w-full items-center",
          "min-h-[18rem] py-12",
          "sm:min-h-[24rem] sm:py-14",
          "md:min-h-[32rem] md:py-20",
          "lg:min-h-[38rem] lg:py-24",
          "xl:min-h-[42rem]",
          heroLayout.gutterX,
        )}
      >
        <div
          className={cn(
            "relative z-10 w-full text-left",
            // Leave room for the ball; avoid nowrap overflow on phones
            "max-w-[min(100%,18.5rem)] pr-2",
            "sm:max-w-md sm:pr-0",
            "md:max-w-xl",
            "lg:max-w-2xl",
            "xl:max-w-3xl",
          )}
        >
          <h2 className={FINAL_CTA_HEADLINE}>
            <span className="block text-pretty sm:whitespace-nowrap">
              {whiteText}
            </span>
            {accentText ? (
              <span className="mt-1 block text-pretty text-accent sm:mt-0 sm:whitespace-nowrap">
                {accentText}
              </span>
            ) : null}
          </h2>

          <div className="mt-7 sm:mt-9 md:mt-12">
            <HeroButton href={finalCta.primaryCta.href} variant="primary">
              {finalCta.primaryCta.label}
            </HeroButton>
          </div>
        </div>
      </div>
    </section>
  );
}
