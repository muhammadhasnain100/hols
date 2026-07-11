"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { contactContent } from "@/content/contact";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="rounded-2xl border border-border/50 bg-white p-8 text-center">
        <p className="font-sans text-lg font-semibold text-primary">
          Message sent
        </p>
        <p className="mt-2 text-sm text-muted">
          We&apos;ll get back to you shortly.
        </p>
      </div>
    );
  }

  return (
    <form
      className="rounded-2xl border border-border/50 bg-white p-6 md:p-8"
      onSubmit={(e) => {
        e.preventDefault();
        setSubmitted(true);
      }}
    >
      <div className="grid gap-5">
        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-primary">
            Name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            className="w-full rounded-xl border border-border/60 px-4 py-3 text-sm outline-none focus:border-primary-light"
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
            className="w-full rounded-xl border border-border/60 px-4 py-3 text-sm outline-none focus:border-primary-light"
          />
        </div>

        <div>
          <label htmlFor="organization" className="mb-2 block text-sm font-medium text-primary">
            Clinic / organization <span className="text-muted">(optional)</span>
          </label>
          <input
            id="organization"
            name="organization"
            type="text"
            className="w-full rounded-xl border border-border/60 px-4 py-3 text-sm outline-none focus:border-primary-light"
          />
        </div>

        <div>
          <label htmlFor="role" className="mb-2 block text-sm font-medium text-primary">
            I am a…
          </label>
          <select
            id="role"
            name="role"
            required
            className="w-full rounded-xl border border-border/60 px-4 py-3 text-sm outline-none focus:border-primary-light"
          >
            <option value="">Select one</option>
            {contactContent.form.roles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="message" className="mb-2 block text-sm font-medium text-primary">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows={5}
            required
            className="w-full resize-y rounded-xl border border-border/60 px-4 py-3 text-sm outline-none focus:border-primary-light"
          />
        </div>
      </div>

      <div className="mt-6">
        <Button type="submit" variant="primary">
          {contactContent.form.submitLabel}
        </Button>
      </div>
    </form>
  );
}
