import { Container } from "@/components/ui/Container";
import { landingContent } from "@/content/landing";

export function TrustStripSection() {
  return (
    <section className="border-y border-border/40 bg-white py-5">
      <Container>
        <ul className="flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-10">
          {landingContent.trustStrip.map((item) => (
            <li
              key={item}
              className="flex items-center gap-2 text-brand-caption text-muted"
            >
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
              {item}
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
