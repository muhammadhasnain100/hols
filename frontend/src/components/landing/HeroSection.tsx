import {
  HeroBackground,
  HeroHeadline,
  HeroNavbar,
} from "@/components/hero";
import { heroLayout } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative min-h-svh overflow-hidden">
      <HeroBackground variant="photo" />
      <HeroNavbar variant="overlay" />

      <div className="relative z-10 flex min-h-svh flex-col">
        <div
          className={cn(
            "mt-auto flex w-full flex-col md:items-end",
            heroLayout.content.shell,
          )}
        >
          <div className="w-full md:ml-auto md:max-w-2xl md:shrink-0 lg:max-w-[42rem] xl:mr-6">
            <HeroHeadline />
          </div>
        </div>
      </div>
    </section>
  );
}
