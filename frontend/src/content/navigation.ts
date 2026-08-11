export const mainNav = [
  { label: "Features", href: "/#everything-inside" },
  { label: "FAQs", href: "/#faqs" },
  { label: "Who it's for", href: "/#who-its-for" },
] as const;

export const footerNav = {
  main: mainNav,
  community: [
    { label: "Features", href: "/#everything-inside" },
    { label: "FAQs", href: "/#faqs" },
    { label: "Who it's for", href: "/#who-its-for" },
    { label: "Get Started", href: "/register" },
    { label: "Log in", href: "/login" },
  ],
  legal: [
    { label: "Terms", href: "/legal/terms" },
    { label: "Privacy", href: "/legal/privacy" },
  ],
  address: ["House of Life Sciences", "Clinical Education Platform"],
  contact: {
    email: "hello@houseoflifesciences.com",
    phone: "",
    href: "mailto:hello@houseoflifesciences.com",
  },
  disclaimer:
    "House of Life Sciences provides educational resources for healthcare professionals. Content is for training purposes and does not replace clinical judgment.",
} as const;
