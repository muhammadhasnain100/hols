import { HeroShell } from "@/components/layout/HeroShell";
import { PageHero } from "@/components/ui/PageHero";
import { ContactSection } from "@/components/contact/ContactSection";
import { contactContent } from "@/content/contact";

export default function ContactPage() {
  return (
    <>
      <HeroShell variant="landing">
        <PageHero
          variant="landing"
          headline={contactContent.hero.headline}
          subhead={contactContent.hero.subhead}
        />
      </HeroShell>

      <ContactSection />
    </>
  );
}
