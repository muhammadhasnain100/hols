import { Section } from "@/components/ui/Section";
import { landingContent } from "@/content/landing";

export function WhoItsForSection() {
  const { whoItsFor } = landingContent;

  return (
    <Section variant="gradient">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-brand-subheading text-primary">
          {whoItsFor.headline}
        </h2>
      </div>

      <div className="mt-12 grid gap-8 md:grid-cols-3">
        {whoItsFor.audiences.map((audience) => (
          <div
            key={audience.title}
            className="rounded-2xl border border-white/60 bg-white/80 p-8 backdrop-blur-sm"
          >
            <h3 className="font-sans text-xl font-semibold text-primary">
              {audience.title}
            </h3>
            <p className="mt-4 text-sm leading-relaxed text-muted">
              {audience.description}
            </p>
          </div>
        ))}
      </div>
    </Section>
  );
}
