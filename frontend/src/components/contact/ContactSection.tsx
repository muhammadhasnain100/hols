"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { Calendar, Icon, Mail, Rocket } from "@/components/icons";
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
        "h-full rounded-2xl border p-6 md:p-7",
        variant === "featured"
          ? "border-primary/15 bg-primary text-white"
          : "border-border/50 bg-white/90",
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
            icon={<Icon icon={Rocket} size={20} strokeWidth={1.5} className="h-5 w-5" />}
          />

          <PathwayCard
            id="demo"
            title={contactContent.demo.title}
            headline={contactContent.demo.headline}
            body={contactContent.demo.body}
            cta={contactContent.demo.cta}
            icon={<Icon icon={Calendar} size={20} strokeWidth={1.5} className="h-5 w-5" />}
          />

          <PathwayCard
            title={contactContent.direct.title}
            email={contactContent.direct.email}
            responseNote={contactContent.direct.responseNote}
            icon={<Icon icon={Mail} size={20} strokeWidth={1.5} className="h-5 w-5" />}
          />
        </div>
      </Container>
    </section>
  );
}
