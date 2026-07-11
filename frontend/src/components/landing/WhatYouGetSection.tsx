import { Section } from "@/components/ui/Section";
import { landingContent } from "@/content/landing";

export function WhatYouGetSection() {
  const { whatYouGet } = landingContent;

  return (
    <Section variant="muted">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-brand-subheading text-primary">
          {whatYouGet.headline}
        </h2>
        <p className="mt-6 text-brand-body text-muted">{whatYouGet.body}</p>
      </div>
    </Section>
  );
}
