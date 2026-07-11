import { CTABlock } from "@/components/ui/CTABlock";
import { landingContent } from "@/content/landing";

export function FinalCTASection() {
  const { finalCta } = landingContent;

  return (
    <CTABlock
      headline={finalCta.headline}
      primaryCta={finalCta.primaryCta}
      secondaryCta={finalCta.secondaryCta}
      variant="primary"
    />
  );
}
