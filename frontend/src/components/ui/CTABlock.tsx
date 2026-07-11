import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";

type CTABlockProps = {
  headline: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  variant?: "default" | "muted" | "primary" | "gradient";
};

export function CTABlock({
  headline,
  primaryCta,
  secondaryCta,
  variant = "primary",
}: CTABlockProps) {
  const isDark = variant === "primary";

  return (
    <Section variant={variant}>
      <div className="mx-auto max-w-3xl text-center">
        <h2
          className={
            isDark
              ? "text-brand-subheading text-white"
              : "text-brand-subheading text-primary"
          }
        >
          {headline}
        </h2>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            href={primaryCta.href}
            variant={isDark ? "accent" : "primary"}
          >
            {primaryCta.label}
          </Button>
          {secondaryCta && (
            <Button
              href={secondaryCta.href}
              variant="secondary"
              className={
                isDark
                  ? "border-white/30 text-white hover:bg-white/10"
                  : undefined
              }
            >
              {secondaryCta.label}
            </Button>
          )}
        </div>
      </div>
    </Section>
  );
}
