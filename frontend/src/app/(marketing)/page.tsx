import {
  HeroSection,
  HookSection,
  WhatYouGetSection,
  PillarsSection,
  WhoItsForSection,
  // CertificationSection,
  FAQsSection,
  FinalCTASection,
} from "@/components/landing";

export const metadata = {
  title: "House of Life Sciences | Run peptides in your clinic with confidence",
  description:
    "Get your whole team trained, keep the dosing right, and give patients clean, branded materials — without becoming the peptide expert yourself.",
};

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HookSection />
      <WhatYouGetSection />
      <PillarsSection />
      <WhoItsForSection />
      <FAQsSection />
      {/* Temporarily hidden — re-enable when ready */}
      {/* <CertificationSection /> */}
      <FinalCTASection />
    </>
  );
}
