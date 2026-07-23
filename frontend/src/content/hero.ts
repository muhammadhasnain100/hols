export const heroContent = {
  eyebrow: "HOUSE OF LIFE SCIENCES",
  headline: "Run peptides in your clinic with confidence.",
  headlineLines: ["Run peptides in your", "clinic with confidence."] as const,
  subheading:
    "Advancing peptide science through structured learning, clinical insight, and professional community.",
  body:
    "Get your whole team trained, keep the dosing right, and give patients clean, branded materials — without becoming the peptide expert yourself.",
  primaryCta: { label: "Get Started", href: "/register" },
  secondaryCta: {
    label: "Book a Demo",
    href: "mailto:hello@houseoflifesciences.com",
  },
  navCtas: {
    login: { label: "Log in", href: "/login" },
    getStarted: { label: "Get Started", href: "/register" },
  },
  trustStrip: [
    "Trusted by clinics",
    "Reviewed by experts",
    "Sources on everything",
  ],
} as const;
