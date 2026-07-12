import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { ScrollReveal } from "@/components/animations/ScrollReveal";

type CTABlockProps = {
  headline: string;
  primaryCta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
  variant?: "default" | "muted" | "primary" | "gradient";
  className?: string;
};

export function CTABlock({
  headline,
  primaryCta,
  secondaryCta,
  variant = "primary",
  className,
}: CTABlockProps) {
  const isDark = variant === "primary";

  return (
    <Section variant={variant} className={className}>
      <ScrollReveal className="mx-auto max-w-3xl text-center">
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
          <Button href={primaryCta.href} variant="primary">
            {primaryCta.label}
          </Button>
          {secondaryCta && (
            <Button
              href={secondaryCta.href}
              variant="secondary"
              className={
                isDark
                  ? "border-white/30 bg-white/10 text-white hover:bg-accent hover:text-primary hover:border-accent"
                  : undefined
              }
            >
              {secondaryCta.label}
            </Button>
          )}
        </div>
      </ScrollReveal>
    </Section>
  );
}
