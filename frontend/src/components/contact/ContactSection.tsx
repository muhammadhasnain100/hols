"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { ContactForm } from "@/components/contact/ContactForm";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { contactContent } from "@/content/contact";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type PathwayCardProps = {
  id?: string;
  icon: React.ReactNode;
  title: string;
  headline?: string;
  body?: string;
  cta?: { label: string; href: string };
  email?: string;
  responseNote?: string;
  variant?: "featured" | "default";
};

function PathwayCard({
  id,
  icon,
  title,
  headline,
  body,
  cta,
  email,
  responseNote,
  variant = "default",
}: PathwayCardProps) {
  return (
    <article
      id={id}
      data-contact-card
      className={cn(
        "h-full rounded-2xl border p-6 transition-shadow md:p-7",
        variant === "featured"
          ? "border-primary/15 bg-primary text-white shadow-[0_12px_40px_rgba(21,39,68,0.14)]"
          : "border-border/50 bg-white/90 shadow-[0_8px_30px_rgba(21,39,68,0.05)] hover:shadow-[0_14px_36px_rgba(21,39,68,0.08)]",
      )}
    >
      <div className="flex h-full flex-col">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            variant === "featured"
              ? "bg-white/15 text-accent"
              : "bg-primary/5 text-primary-light",
          )}
        >
          {icon}
        </span>

        <p
          className={cn(
            "mt-5 text-xs font-semibold uppercase tracking-[0.22em]",
            variant === "featured" ? "text-accent-light/90" : "text-primary-light",
          )}
        >
          {title}
        </p>

        {headline && (
          <h3
            className={cn(
              "mt-2 font-sans text-lg font-semibold leading-snug",
              variant === "featured" ? "text-white" : "text-primary",
            )}
          >
            {headline}
          </h3>
        )}

        {body && (
          <p
            className={cn(
              "mt-3 flex-1 text-sm leading-relaxed",
              variant === "featured" ? "text-white/80" : "text-muted",
            )}
          >
            {body}
          </p>
        )}

        {cta && (
          <div className="mt-6">
            <Button
              href={cta.href}
              variant={variant === "featured" ? "secondary" : "primary"}
              size="md"
            >
              {cta.label}
            </Button>
          </div>
        )}

        {email && (
          <div className="mt-5 flex-1">
            <p
              className={cn(
                "text-sm",
                variant === "featured" ? "text-white/80" : "text-muted",
              )}
            >
              {contactContent.direct.body}
            </p>
            <a
              href={`mailto:${email}`}
              className={cn(
                "mt-2 inline-block break-all font-sans text-sm font-semibold transition",
                variant === "featured"
                  ? "text-accent hover:text-white"
                  : "text-primary-light hover:text-primary",
              )}
            >
              {email}
            </a>
            {responseNote && (
              <p
                className={cn(
                  "mt-3 text-xs",
                  variant === "featured" ? "text-white/65" : "text-muted",
                )}
              >
                {responseNote}
              </p>
            )}
          </div>
        )}
      </div>
    </article>
  );
}

export function ContactSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const pathwaysRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !pathwaysRef.current) return;

      const cards = pathwaysRef.current.querySelectorAll("[data-contact-card]");

      gsap.fromTo(
        cards,
        { autoAlpha: 0, y: 48 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 0.75,
          ease: "power3.out",
          stagger: 0.14,
          scrollTrigger: {
            trigger: pathwaysRef.current,
            start: "top 82%",
            toggleActions: "play none none reverse",
          },
        },
      );
    },
    { scope: sectionRef },
  );

  return (
    <section ref={sectionRef} className="bg-primary/[0.03] py-12 md:py-16">
      <Container>
        <div className="mx-auto max-w-3xl">
          <ContactForm />
        </div>

        <div ref={pathwaysRef} className="mt-16 grid gap-5 md:mt-20 md:grid-cols-3 md:gap-6 lg:mt-24">
          <PathwayCard
            id="get-started"
            variant="featured"
            title={contactContent.getStarted.title}
            headline={contactContent.getStarted.headline}
            body={contactContent.getStarted.body}
            cta={contactContent.getStarted.cta}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z"
                />
              </svg>
            }
          />

          <PathwayCard
            id="demo"
            title={contactContent.demo.title}
            headline={contactContent.demo.headline}
            body={contactContent.demo.body}
            cta={contactContent.demo.cta}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
            }
          />

          <PathwayCard
            title={contactContent.direct.title}
            email={contactContent.direct.email}
            responseNote={contactContent.direct.responseNote}
            icon={
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75"
                />
              </svg>
            }
          />
        </div>
      </Container>
    </section>
  );
}
