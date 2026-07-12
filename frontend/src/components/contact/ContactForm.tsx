"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { contactContent } from "@/content/contact";
import { cn } from "@/lib/utils";

const inputClassName =
  "w-full rounded-xl border border-border/50 bg-white/90 px-4 py-3.5 text-sm text-primary outline-none transition placeholder:text-muted/70 focus:border-primary-light focus:ring-2 focus:ring-primary-light/15";

type ContactFormProps = {
  className?: string;
};

export function ContactForm({ className }: ContactFormProps) {
  const [submitted, setSubmitted] = useState(false);
  const [role, setRole] = useState("");

  if (submitted) {
    return (
      <div
        className={cn(
          "glass-panel flex flex-col items-center justify-center rounded-3xl px-8 py-16 text-center",
          className,
        )}
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/35 text-primary">
          <svg
            className="h-7 w-7"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="1.75"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
          </svg>
        </span>
        <p className="mt-6 font-sans text-xl font-semibold text-primary">Message sent</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted">
          Thanks for reaching out. We&apos;ll get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      id="contact-form"
      className={cn("glass-panel rounded-3xl p-6 md:p-8 lg:p-10", className)}
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="border-b border-border/40 pb-6">
        <h2 className="font-sans text-xl font-semibold text-primary md:text-2xl">
          {contactContent.form.title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted md:text-base">
          Fill in your details and we&apos;ll follow up with the right next step.
        </p>
      </div>

      <div className="mt-8 grid gap-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-primary">
              Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              autoComplete="name"
              placeholder="Your full name"
              className={inputClassName}
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-primary">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="you@clinic.com"
              className={inputClassName}
            />
          </div>
        </div>

        <div>
          <label htmlFor="organization" className="mb-2 block text-sm font-medium text-primary">
            Clinic / organization{" "}
            <span className="font-normal text-muted">(optional)</span>
          </label>
          <input
            id="organization"
            name="organization"
            type="text"
            autoComplete="organization"
            placeholder="Your clinic or practice name"
            className={inputClassName}
          />
        </div>

        <fieldset>
          <legend className="mb-3 block text-sm font-medium text-primary">
            {contactContent.form.roleLabel}
          </legend>
          <p className="mb-4 text-xs text-muted">{contactContent.form.roleHint}</p>
          <div className="flex flex-wrap gap-2.5">
            {contactContent.form.roles.map((option) => {
              const selected = role === option;

              return (
                <label
                  key={option}
                  className={cn(
                    "cursor-pointer rounded-full border px-4 py-2.5 text-sm font-medium transition",
                    selected
                      ? "border-primary bg-primary text-white shadow-sm"
                      : "border-border/60 bg-white/80 text-primary hover:border-primary-light/60 hover:bg-white",
                  )}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option}
                    required
                    checked={selected}
                    onChange={() => setRole(option)}
                    className="sr-only"
                  />
                  {option}
                </label>
              );
            })}
          </div>
        </fieldset>

        <div>
          <label htmlFor="message" className="mb-2 block text-sm font-medium text-primary">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={6}
            required
            placeholder="Tell us about your clinic, goals, or questions..."
            className={cn(inputClassName, "resize-y min-h-[9rem]")}
          />
        </div>
      </div>

      <div className="mt-8 border-t border-border/40 pt-6">
        <Button type="submit" variant="primary" size="lg" className="w-full sm:w-auto">
          {contactContent.form.submitLabel}
        </Button>
      </div>
    </form>
  );
}
