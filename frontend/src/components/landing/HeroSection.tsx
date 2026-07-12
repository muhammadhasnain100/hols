import {
  HeroBackground,
  HeroCTAs,
  HeroHeadline,
  HeroNavbar,
  HeroTrustStrip,
} from "@/components/hero";

export function HeroSection() {
  return (
    <section className="relative min-h-svh overflow-hidden">
      <HeroBackground />
      <HeroNavbar variant="landing" />

      <div className="relative z-10 flex min-h-svh flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-6 pt-28 md:pt-32">
          <HeroHeadline />
          <HeroCTAs />
        </div>

        <HeroTrustStrip />
      </div>
    </section>
  );
}
