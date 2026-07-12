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
                <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-sans text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                  Certification
                </span>
                <h2 className="mt-5 font-serif text-3xl font-semibold leading-tight text-primary md:text-4xl lg:text-[2.6rem]">
                  {certification.headline}
                </h2>
                <p className="mt-5 max-w-lg text-base leading-relaxed text-primary/75 md:text-lg">
                  {certification.body}
                </p>
              </div>

              {/* Right: floating image */}
              <div className="relative mt-4 md:mt-0 md:min-h-[16rem]">
                <div className="relative mx-auto aspect-[4/5] w-64 overflow-hidden rounded-3xl border border-white/50 shadow-[0_30px_70px_rgba(15,33,64,0.35)] sm:w-72 md:absolute md:right-0 md:top-1/2 md:aspect-[4/5] md:w-80 md:-translate-y-1/2 md:-mt-0 lg:w-[22rem] lg:h-[28rem]">
                  <Image
                    src="/assets/images/hols-education-books-mockup.png"
                    alt={certification.headline}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 18rem, 22rem"
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
