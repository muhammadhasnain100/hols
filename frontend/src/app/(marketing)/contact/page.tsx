import { Section } from "@/components/ui/Section";
import { PageHero } from "@/components/ui/PageHero";
import { Button } from "@/components/ui/Button";
import { ContactForm } from "@/components/contact/ContactForm";
import { contactContent } from "@/content/contact";

export default function ContactPage() {
  return (
    <>
      <Section variant="gradient" className="pt-20 pb-16 md:pt-28">
        <PageHero
          headline={contactContent.hero.headline}
          subhead={contactContent.hero.subhead}
        />
      </Section>

      <Section variant="default">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[1.2fr_1fr]">
          <ContactForm />

          <aside className="space-y-8">
            <div
              id="get-started"
              className="rounded-2xl border border-border/50 bg-primary/[0.03] p-6"
            >
              <h2 className="font-sans text-lg font-semibold text-primary">
                {contactContent.getStarted.headline}
              </h2>
              <p className="mt-3 text-sm text-muted">
                {contactContent.getStarted.body}
              </p>
              <div className="mt-5">
                <Button href={contactContent.getStarted.cta.href} variant="primary">
                  {contactContent.getStarted.cta.label}
                </Button>
              </div>
            </div>

            <div
              id="demo"
              className="rounded-2xl border border-border/50 bg-white p-6"
            >
              <h2 className="font-sans text-lg font-semibold text-primary">
                {contactContent.demo.headline}
              </h2>
              <p className="mt-3 text-sm text-muted">{contactContent.demo.body}</p>
              <div className="mt-5">
                <Button href={contactContent.demo.cta.href} variant="secondary">
                  {contactContent.demo.cta.label}
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-white p-6">
              <h2 className="font-sans text-lg font-semibold text-primary">
                Direct contact
              </h2>
              <p className="mt-3 text-sm text-muted">
                Prefer email? Reach us at{" "}
                <a
                  href={`mailto:${contactContent.direct.email}`}
                  className="font-medium text-primary-light hover:text-primary"
                >
                  {contactContent.direct.email}
                </a>
                .
              </p>
              <p className="mt-2 text-xs text-muted">
                {contactContent.direct.responseNote}
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
