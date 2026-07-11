import { Section } from "@/components/ui/Section";
import { landingContent } from "@/content/landing";

export function CertificationSection() {
  const { certification } = landingContent;

  return (
    <Section variant="default">
      <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 rounded-3xl border border-border/50 bg-primary/[0.03] p-10 text-center md:p-14">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/30 text-primary">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.5"
            aria-hidden
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342"
            />
          </svg>
        </div>
        <h2 className="text-brand-subheading text-primary">
          {certification.headline}
        </h2>
        <p className="max-w-2xl text-brand-body text-muted">
          {certification.body}
        </p>
      </div>
    </Section>
  );
}
