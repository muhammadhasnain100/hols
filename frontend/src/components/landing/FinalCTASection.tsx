import Link from "next/link";
import { landingContent } from "@/content/landing";

export function FinalCTASection() {
  const { finalCta } = landingContent;

  const accent = finalCta.headlineAccent;
  const parts = accent
    ? finalCta.headline.split(new RegExp(`(${accent})`, "i"))
    : [finalCta.headline];

  return (
    <section className="bg-[#F4F5F7]">
      {/* Full-bleed black block */}
      <div className="flex w-full min-h-[32rem] flex-col items-center justify-center bg-black px-5 py-28 text-center md:min-h-[36rem] md:px-8 md:py-36 lg:min-h-[40rem] lg:px-10 lg:py-44">
        <p className="font-sans text-lg italic tracking-[0.02em] text-white/90 md:text-xl">
          {finalCta.eyebrow}
        </p>

        <h2 className="mt-10 w-full max-w-6xl font-sans text-[2rem] font-medium leading-[1.15] tracking-[-0.01em] text-white sm:text-4xl md:text-5xl md:leading-[1.12] lg:text-[3.25rem]">
          {parts.map((part, index) =>
            part.toLowerCase() === accent?.toLowerCase() ? (
              <span key={`${part}-${index}`} className="text-accent">
                {part}
              </span>
            ) : (
              <span key={`${part}-${index}`}>{part}</span>
            ),
          )}
        </h2>

        <Link
          href={finalCta.primaryCta.href}
          className="mt-14 inline-flex min-h-14 items-center justify-center rounded-full border border-white/85 px-10 font-sans text-xs font-semibold uppercase tracking-[0.22em] text-white transition-colors duration-300 hover:border-accent hover:bg-accent hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          {finalCta.primaryCta.label}
        </Link>
      </div>
    </section>
  );
}
