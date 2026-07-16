import Image from "next/image";
import { Container } from "@/components/ui/Container";
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { landingContent } from "@/content/landing";

export function CertificationSection() {
  const { certification } = landingContent;

  return (
    <section className="relative overflow-hidden bg-white py-20 md:py-28">
      <Container>
        <ScrollReveal>
          <div className="relative mx-auto max-w-6xl overflow-visible rounded-[2rem] bg-[#8DC3E1] px-8 py-12 md:px-14 md:py-16">
            <div className="grid items-center gap-10 md:grid-cols-2">
              {/* Left: text */}
              <div className="relative z-10 max-w-xl">
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-brand-caption uppercase tracking-[0.18em] text-primary">
                  Certification
                </span>
                <h2 className="font-sans text-brand-subheading mt-5 text-primary">
                  {certification.headline}
                </h2>
                <p className="font-body text-brand-body mt-5 max-w-lg text-primary/75">
                  {certification.body}
                </p>
              </div>

              {/* Right: transparent Photoroom image */}
              <div className="relative mt-4 flex justify-center md:mt-0 md:min-h-[18rem] md:justify-end">
                <div className="relative h-72 w-64 sm:h-80 sm:w-72 md:absolute md:right-0 md:top-1/2 md:h-[22rem] md:w-80 md:-translate-y-1/2 lg:h-[28rem] lg:w-[22rem]">
                  <Image
                    src="/assets/creatives/Give%20your%20team%20a%20credential%20that%20means%20something_-Photoroom.png"
                    alt={certification.headline}
                    fill
                    className="object-contain drop-shadow-[0_24px_48px_rgba(15,33,64,0.28)]"
                    sizes="(max-width: 768px) 18rem, 22rem"
                    priority={false}
                  />
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>
      </Container>
    </section>
  );
}
