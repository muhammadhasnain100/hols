import {
  HeroBackground,
  HeroHeadline,
  HeroNavbar,
} from "@/components/hero";

export function HeroSection() {
  return (
    <section className="relative min-h-svh overflow-hidden">
      <HeroBackground variant="photo" />
      <HeroNavbar variant="overlay" />

      <div className="relative z-10 flex min-h-svh flex-col">
        <div className="mt-auto flex w-full flex-col gap-10 px-5 pb-14 pt-28 md:flex-row md:items-end md:justify-between md:gap-12 md:px-6 md:pb-20 lg:px-8 lg:pb-24">
          {/* Left */}
          <div className="max-w-xs shrink-0 md:pb-2">
            <p className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.28em] text-white/90">
              <span className="inline-block h-1.5 w-1.5 rounded-[1px] bg-white" />
              Welcome
            </p>
            <p className="font-body mt-4 text-sm leading-relaxed text-white/65 md:text-[0.95rem]">
              House of Life Sciences — science that supports life, not just
              treats it.
            </p>
          </div>

          {/* Right */}
          <HeroHeadline />
        </div>
      </div>
    </section>
  );
}
