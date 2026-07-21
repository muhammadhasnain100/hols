import {
  HeroBackground,
  HeroHeadline,
  HeroNavbar,
  HeroTrustStrip,
} from "@/components/hero";
import { brand } from "@/config/brand";
import { heroContent } from "@/content/hero";
import { heroLayout, heroWelcome } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative min-h-svh overflow-hidden">
      <HeroBackground variant="photo" />
      <HeroNavbar variant="overlay" />

      <div className="relative z-10 flex min-h-svh flex-col">
        <div
          className={cn(
            "mt-auto flex w-full flex-col md:flex-row md:items-end md:justify-between",
            heroLayout.content.shell,
            heroLayout.content.gap,
          )}
        >
          <div className="order-1 w-full md:order-2 md:max-w-2xl lg:max-w-[42rem] lg:shrink-0">
            <HeroHeadline />
          </div>

          <div className="order-2 hidden w-full md:order-1 md:block md:max-w-xs md:shrink-0 lg:max-w-sm md:pb-2">
            <p className={heroWelcome.eyebrow}>{heroContent.eyebrow}</p>
            <p className={heroWelcome.tagline}>{brand.tagline}</p>
            <p className={heroWelcome.motto}>{brand.motto}</p>
          </div>
        </div>

        <HeroTrustStrip variant="overlay" />
      </div>
    </section>
  );
}
