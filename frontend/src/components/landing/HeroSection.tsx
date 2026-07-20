import {
  HeroBackground,
  HeroHeadline,
  HeroNavbar,
  HeroTrustStrip,
} from "@/components/hero";
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
          {/* Left — welcome */}
          <div className="max-w-xs shrink-0 md:pb-2">
            <p className={heroWelcome.eyebrow}>
              <span className={heroWelcome.eyebrowDot} />
              Welcome
            </p>
            <p className={heroWelcome.tagline}>
              House of Life Sciences — science that supports life, not just
              treats it.
            </p>
          </div>

          {/* Right — headline, subhead, CTAs */}
          <HeroHeadline />
        </div>

        <HeroTrustStrip variant="overlay" />
      </div>
    </section>
  );
}
