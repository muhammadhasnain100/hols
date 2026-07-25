import Image from "next/image";
import { HeroButton } from "@/components/hero/HeroButton";
import { landingContent } from "@/content/landing";
import { heroLayout } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

const FINAL_CTA_HEADLINE =
  "font-sans text-[1.5rem] font-normal leading-[1.1] tracking-tight text-white sm:text-[2rem] sm:leading-[1.08] md:text-[3rem] lg:text-[3.5rem] lg:leading-[1.05]";

/**
 * ball.png opaque sphere ≈ 70% of the canvas (~15% transparent padding each side).
 *
 * - Box is sized ~1.65× section height so the opaque sphere reads zoomed-in.
 * - translate-x ≈ 40% = right padding (15%) + 35% of opaque (24.5%), so ~65%
 *   of the real sphere stays in view and ~35% clips past the right edge.
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
          "pointer-events-none absolute top-1/2 right-0 z-0 aspect-square -translate-y-1/2 translate-x-[40%]",
          "h-[37rem] w-[37rem]",
          "sm:h-[44rem] sm:w-[44rem]",
          "md:h-[53rem] md:w-[53rem]",
          "lg:h-[63rem] lg:w-[63rem]",
          "xl:h-[70rem] xl:w-[70rem]",
        )}
        aria-hidden
      >
        <Image
          src={finalCta.image}
          alt=""
          fill
          className="object-contain drop-shadow-[0_28px_80px_rgba(0,0,0,0.55)]"
          sizes="(max-width: 640px) 37rem, (max-width: 768px) 44rem, (max-width: 1024px) 53rem, 70rem"
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
