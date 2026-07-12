export const contactContent = {
  hero: {
    headline: "Let’s talk.",
    subhead:
      "Setting up a clinic or just getting started — tell us where you are and we’ll take it from there.",
  },
  form: {
    title: "Contact Form",
    roleLabel: "I am a…",
    roleHint: "Clinic owner · Provider · Learner · Other",
    roles: ["Clinic owner", "Provider", "Learner", "Other"] as const,
    submitLabel: "Send message",
  },
  getStarted: {
    title: "Get Started",
    headline: "Ready to set up your clinic?",
    body: "Tell us a bit about your practice and we’ll get you on the right plan.",
    cta: { label: "Get Started", href: "#contact-form" },
  },
  demo: {
    title: "Book a Demo",
    headline: "Want to see it first?",
    body: "We’ll walk you through the whole platform — no pressure.",
    cta: { label: "Book a Demo", href: "#contact-form" },
  },
  direct: {
    title: "Direct Contact",
    body: "Prefer email? Reach us at",
    email: "hello@houseoflifesciences.com",
    responseNote: "We usually reply within a day.",
  },
} as const;
