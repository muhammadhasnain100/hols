import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { HeroNavbar } from "@/components/hero/HeroNavbar";
import { legalDocuments, type LegalSection } from "@/content/legal";
import { heroLayout } from "@/lib/hero-styles";
import { cn } from "@/lib/utils";

const SLUG_META: Record<string, { title: string }> = {
  terms: { title: "Terms & Conditions" },
  privacy: { title: "Privacy Policy" },
  "medical-disclaimer": { title: "Medical Disclaimer" },
};

export function generateStaticParams() {
  return Object.keys(legalDocuments).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = legalDocuments[slug];
  const fallback = SLUG_META[slug]?.title ?? "Legal";
  return {
    title: `${doc?.title ?? fallback} | House of Life Sciences`,
    description: doc
      ? `${doc.title} for House of Life Sciences. Effective ${doc.effectiveDate}.`
      : undefined,
  };
}

function linkifyPrivacyMentions(text: string): ReactNode {
  const marker = "Privacy Policy";
  const index = text.indexOf(marker);
  if (index === -1) return text;
  return (
    <>
      {text.slice(0, index)}
      <Link
        href="/legal/privacy"
        className="font-medium text-primary underline-offset-2 hover:underline"
      >
        {marker}
      </Link>
      {text.slice(index + marker.length)}
    </>
  );
}

function LegalSectionBlock({
  section,
  linkPrivacy,
}: {
  section: LegalSection;
  linkPrivacy?: boolean;
}) {
  const renderText = (text: string) =>
    linkPrivacy ? linkifyPrivacyMentions(text) : text;

  return (
    <section className="space-y-2.5">
      <h2 className="font-sans text-base font-semibold tracking-tight text-primary">
        {section.heading}
      </h2>
      {section.paragraphs?.map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="text-[15px] leading-relaxed text-primary/70">
          {renderText(paragraph)}
        </p>
      ))}
      {section.list && section.list.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-primary/70">
          {section.list.map((item) => (
            <li key={item}>{renderText(item)}</li>
          ))}
        </ul>
      ) : null}
      {section.paragraphsAfter?.map((paragraph) => (
        <p key={paragraph.slice(0, 48)} className="text-[15px] leading-relaxed text-primary/70">
          {renderText(paragraph)}
        </p>
      ))}
      {section.listAfter && section.listAfter.length > 0 ? (
        <ul className="list-disc space-y-1 pl-5 text-[15px] leading-relaxed text-primary/70">
          {section.listAfter.map((item) => (
            <li key={item}>{renderText(item)}</li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

function LegalShell({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh bg-[#F7F9FC]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-gradient-science-haze opacity-70"
      />
      <HeroNavbar variant="page" />
      <main
        className={cn(
          "relative mx-auto w-full max-w-2xl pb-16 pt-24 sm:pb-20 sm:pt-28",
          heroLayout.gutterX,
        )}
      >
        {children}
      </main>
    </div>
  );
}

export default async function LegalPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = legalDocuments[slug];

  if (!doc) {
    if (SLUG_META[slug]) {
      return (
        <LegalShell>
          <header className="border-b border-primary/10 pb-5">
            <h1 className="font-sans text-2xl font-semibold tracking-tight text-primary sm:text-[1.75rem]">
              {SLUG_META[slug].title}
            </h1>
            <p className="mt-2 text-sm text-primary/55">This page is coming soon.</p>
          </header>
        </LegalShell>
      );
    }
    notFound();
  }

  return (
    <LegalShell>
      <article>
        <header className="border-b border-primary/10 pb-5">
          <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/45">
            Legal
          </p>
          <h1 className="mt-2 font-sans text-2xl font-semibold tracking-tight text-primary sm:text-[1.75rem]">
            {doc.title}
          </h1>
          <p className="mt-1.5 text-sm text-primary/55">
            Effective Date: {doc.effectiveDate}
          </p>
        </header>

        <div className="mt-6 space-y-7">
          <p className="text-[15px] leading-relaxed text-pretty text-primary/75">
            {doc.intro}
          </p>

          {doc.sections.map((section) => (
            <LegalSectionBlock
              key={section.heading}
              section={section}
              linkPrivacy={slug === "terms"}
            />
          ))}
        </div>

        <p className="mt-10 border-t border-primary/10 pt-5 text-sm text-primary/45">
          Related:{" "}
          {slug === "privacy" ? (
            <Link
              href="/legal/terms"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Terms &amp; Conditions
            </Link>
          ) : (
            <Link
              href="/legal/privacy"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              Privacy Policy
            </Link>
          )}
        </p>
      </article>
    </LegalShell>
  );
}
