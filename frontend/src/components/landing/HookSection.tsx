import Image from "next/image";
import Link from "next/link";
import { landingContent } from "@/content/landing";

type HookCta = {
  title: string;
  subtitle: string;
  href: string;
  thumb: string;
};

function HookMark() {
  return (
    <div className="mb-5 md:mb-6" aria-hidden>
      <Image
        src="/assets/logo/hols-logo-mark.png"
        alt=""
        width={36}
        height={36}
        className="h-9 w-9 object-contain"
      />
    </div>
  );
}

function HookCtaCard({ title, subtitle, href, thumb }: HookCta) {
  return (
    <Link
      href={href}
      className="group flex w-full items-stretch overflow-hidden rounded-md bg-[#DCE3EA] transition-colors duration-300 hover:bg-[#D0D9E3] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <span className="relative w-20 shrink-0 self-stretch overflow-hidden bg-primary/10 sm:w-24">
        <Image
          src={thumb}
          alt=""
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          sizes="96px"
        />
      </span>
      <span className="flex min-w-0 flex-1 flex-col justify-center px-3.5 py-3 text-left sm:px-4">
        <span className="block font-sans text-sm font-semibold leading-snug text-primary sm:text-base">
          {title}
        </span>
        <span className="mt-0.5 block font-body text-xs leading-snug text-muted sm:text-sm">
          {subtitle}
        </span>
      </span>
    </Link>
  );
}

export function HookSection() {
  const { hook } = landingContent;

  const cards: HookCta[] = [
    {
      title: hook.beforeLabel,
      subtitle: hook.problemCta.subtitle,
      href: hook.problemCta.href,
      thumb: hook.problemImage,
    },
    {
      title: hook.afterLabel,
      subtitle: hook.solutionCta.subtitle,
      href: hook.solutionCta.href,
      thumb: hook.solutionImage,
    },
  ];

  return (
    <section
      id="problem"
      className="flex bg-[#F6F7F9] lg:h-svh lg:max-h-svh lg:overflow-hidden"
    >
      <div className="grid w-full flex-1 items-center gap-8 px-5 py-12 sm:px-6 md:px-8 lg:h-full lg:grid-cols-2 lg:items-center lg:gap-10 lg:px-8 lg:py-10 xl:gap-14 xl:px-10">
        {/* Left — image */}
        <div className="relative aspect-square w-full overflow-hidden bg-primary/5 shadow-[0_18px_50px_rgba(21,39,68,0.08)] lg:aspect-auto lg:h-[78%] lg:max-h-[78vh] lg:min-h-0 lg:self-center">
          <Image
            src={hook.featureImage}
            alt="One trusted system for clinical peptide practice"
            fill
            className="object-cover object-center"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>

        {/* Right — text flush to the right side */}
        <div className="flex w-full items-center lg:h-full lg:min-h-0 lg:justify-end">
          <div className="w-full max-w-[30rem] text-left lg:ml-auto xl:max-w-[32rem]">
            <HookMark />
            <p className="font-sans text-[0.7rem] font-medium uppercase tracking-[0.3em] text-primary/50 md:text-xs">
              Clinical peptide practice
            </p>
            <h2 className="mt-4 font-sans text-[1.5rem] font-bold leading-[1.18] tracking-[-0.015em] text-primary sm:text-[1.85rem] lg:text-[2rem] lg:leading-[1.15]">
              {hook.headline}
            </h2>
            <p className="font-body mt-4 text-sm leading-[1.6] text-muted md:text-[0.95rem] md:leading-[1.65]">
              {hook.problem} HOLS brings training, dosing, and patient paperwork
              into one place — so your team can move quickly and get it right.
            </p>

            <div className="mt-7 flex w-full flex-col gap-2.5">
              {cards.map((card) => (
                <HookCtaCard key={card.title} {...card} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
