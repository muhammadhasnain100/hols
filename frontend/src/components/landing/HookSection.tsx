import { Section } from "@/components/ui/Section";
import { landingContent } from "@/content/landing";

export function HookSection() {
  const { hook } = landingContent;

  return (
    <Section variant="default">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="text-brand-subheading text-primary">{hook.headline}</h2>
        <p className="mt-6 text-brand-body text-muted">{hook.body}</p>
      </div>
    </Section>
  );
}
