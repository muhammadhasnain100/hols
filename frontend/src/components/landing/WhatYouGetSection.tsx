import { Section } from "@/components/ui/Section";
import { ScrollReveal, StaggerChildren } from "@/components/animations/ScrollReveal";
import {
  CoursesMockup,
  DosingMockup,
  DocumentsMockup,
} from "@/components/illustrations/WhatYouGetMockups";
import { landingContent } from "@/content/landing";
import { cn } from "@/lib/utils";

const mockups = {
  courses: CoursesMockup,
  dosing: DosingMockup,
  documents: DocumentsMockup,
} as const;

function TrustBanner({ text }: { text: string }) {
  return (
    <div className="inline-flex items-start gap-3 rounded-2xl border border-border/50 bg-white/80 px-5 py-4 text-left shadow-sm backdrop-blur-sm md:items-center">
      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/5 text-primary-light">
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"
          />
        </svg>
      </span>
      <p className="text-sm leading-relaxed text-primary md:text-base">{text}</p>
    </div>
  );
}

function BentoCard({
  id,
  title,
  description,
  className,
}: {
  id: keyof typeof mockups;
  title: string;
  description: string;
  className?: string;
}) {
  const Mockup = mockups[id];

  return (
    <article
      data-stagger-item
      className={cn(
        "group flex flex-col overflow-hidden rounded-3xl border border-border/50 bg-white shadow-[0_8px_30px_rgba(21,39,68,0.06)] transition-shadow hover:shadow-[0_16px_40px_rgba(21,39,68,0.10)]",
        className,
      )}
    >
      <div className="overflow-hidden border-b border-border/40 bg-primary/[0.02] p-4 md:p-5">
        <Mockup className="h-auto w-full transition-transform duration-300 group-hover:scale-[1.02]" />
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <h3 className="font-sans text-xl font-semibold text-primary">{title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-muted md:text-base">{description}</p>
      </div>
    </article>
  );
}

export function WhatYouGetSection() {
  const { whatYouGet } = landingContent;
  const [courses, dosing, documents] = whatYouGet.cards;

  return (
    <Section id="what-you-get" variant="muted" className="relative z-10 overflow-hidden py-20 md:py-28">
      <ScrollReveal className="mx-auto max-w-3xl text-center">
        <p className="mb-4 font-sans text-xs font-semibold uppercase tracking-[0.28em] text-primary-light">
          {whatYouGet.eyebrow}
        </p>
        <h2 className="text-brand-subheading text-primary">{whatYouGet.headline}</h2>
      </ScrollReveal>

      <ScrollReveal className="mt-8 flex justify-center md:mt-10" delay={0.08} y={24}>
        <TrustBanner text={whatYouGet.trustBar} />
      </ScrollReveal>

      <StaggerChildren
        className="mt-12 grid grid-cols-1 gap-5 md:mt-14 md:grid-cols-2 md:gap-6"
        stagger={0.1}
      >
        <BentoCard
          id="courses"
          title={courses.title}
          description={courses.description}
        />
        <BentoCard
          id="dosing"
          title={dosing.title}
          description={dosing.description}
        />
        <BentoCard
          id="documents"
          title={documents.title}
          description={documents.description}
          className="md:col-span-2"
        />

        <div
          data-stagger-item
          className="flex flex-col items-center justify-center rounded-3xl border border-primary/10 bg-gradient-deep-intelligence px-6 py-8 text-center md:col-span-2 md:flex-row md:justify-between md:px-10 md:text-left"
        >
          <div>
            <p className="font-sans text-xs font-semibold uppercase tracking-[0.22em] text-accent">
              {whatYouGet.badge.title}
            </p>
            <p className="mt-2 text-sm text-white/80 md:text-base">{whatYouGet.badge.description}</p>
          </div>
          <div className="mt-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-accent md:mt-0">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
            </svg>
          </div>
        </div>
      </StaggerChildren>
    </Section>
  );
}
