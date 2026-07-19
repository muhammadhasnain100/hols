import Image from "next/image";
import Link from "next/link";
import { landingContent } from "@/content/landing";

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

      <div className="relative grid w-full items-center gap-12 px-5 py-16 md:gap-16 md:px-8 md:py-20 lg:grid-cols-2 lg:gap-14 lg:px-10 lg:py-24">
        {/* Left — text */}
        <div className="order-1 w-full max-w-xl lg:max-w-none">
          <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.3em] text-accent-light md:text-xs">
            {certification.label}
          </p>

          <h2 className="mt-5 font-sans text-[2rem] font-bold leading-[1.12] tracking-[-0.02em] text-white sm:text-4xl md:text-[2.75rem] md:leading-[1.1]">
            {headlineParts.map((part, index) =>
              part.toLowerCase() === accent?.toLowerCase() ? (
                <em key={`${part}-${index}`} className="italic text-accent">
                  {part}
                </em>
              ) : (
                <span key={`${part}-${index}`}>{part}</span>
              ),
            )}
          </h2>

          <p className="font-body mt-6 max-w-lg text-base leading-relaxed text-white/70 md:text-lg md:leading-[1.55]">
            {certification.body}
          </p>

          <Link
            href={certification.cta.href}
            className="group mt-10 inline-flex items-center gap-3 font-sans text-sm font-semibold text-accent transition-colors duration-300 hover:text-white"
          >
            {certification.cta.label}
            <span
              aria-hidden
              className="inline-block h-px w-10 bg-current transition-all duration-300 group-hover:w-14"
            />
            <span aria-hidden className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* Right — image */}
        <div className="relative order-2 flex min-h-[22rem] w-full items-center justify-center lg:min-h-[28rem] lg:justify-end">
          <div
            className="pointer-events-none absolute h-[65%] w-[65%] rounded-full bg-accent-light/15 blur-3xl"
            aria-hidden
          />
          <div className="relative aspect-[4/5] w-full max-w-[18rem] rotate-[-8deg] transition-transform duration-700 hover:rotate-[-4deg] sm:max-w-[20rem] md:max-w-[22rem] lg:mr-4 lg:max-w-[24rem] xl:mr-8">
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
