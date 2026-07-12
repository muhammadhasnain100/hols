import {
  HeroSection,
  HookSection,
  WhatYouGetSection,
  PillarsSection,
  WhoItsForSection,
  CertificationSection,
  PricingTeaserSection,
  FinalCTASection,
} from "@/components/landing";

export const metadata = {
  title: "House of Life Sciences | Run peptides in your clinic with confidence",
  description:
    "Train your team, keep dosing right, and hand patients branded materials — without becoming the peptide expert yourself.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HookSection />
      <WhatYouGetSection />
      <PillarsSection />
      <WhoItsForSection />
      <CertificationSection />
      <PricingTeaserSection />
      <FinalCTASection />
    </>
  );
}
