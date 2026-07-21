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
      className="relative flex min-h-svh w-full items-center overflow-hidden bg-black"
    >
      {/* Theme atmosphere — lemon lime + baby blue on black */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_78%_42%,rgba(141,195,225,0.14),transparent_52%),radial-gradient(ellipse_at_18%_75%,rgba(221,228,102,0.07),transparent_42%)]"
        aria-hidden
      />

      <div
        className={cn(
          "relative grid w-full items-center gap-12 py-16 md:gap-16 md:py-20 lg:grid-cols-2 lg:gap-14 lg:py-24",
          heroLayout.gutterX,
        )}
      >
        {/* Text */}
        <div className="order-1 w-full max-w-xl lg:max-w-none">
          <h2 className="font-sans text-[1.875rem] font-bold leading-[1.05] tracking-[0.01em] text-white sm:text-[2.25rem] md:text-[3.75rem]">
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

          <p className="text-brand-body mt-6 max-w-lg text-white/75">
            {certification.body}
          </p>

          <div className="mt-10">
            <HeroButton href={certification.cta.href} variant="primary">
              {certification.cta.label}
            </HeroButton>
          </div>
        </div>

        {/* Image */}
        <div className="relative order-2 flex min-h-[22rem] w-full items-center justify-center lg:min-h-[28rem]">
          <div
            className="pointer-events-none absolute h-[65%] w-[65%] rounded-full bg-accent-light/15 blur-3xl"
            aria-hidden
          />
          <div className="relative aspect-[4/5] w-full max-w-[18rem] rotate-[-8deg] transition-transform duration-700 hover:rotate-[-4deg] sm:max-w-[20rem] md:max-w-[22rem] lg:max-w-[24rem]">
            <Image
              src={certification.image}
              alt={certification.headline}
              fill
              className="object-contain drop-shadow-[0_30px_60px_rgba(0,0,0,0.55)]"
              sizes="(max-width: 768px) 20rem, 24rem"
              priority={false}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
