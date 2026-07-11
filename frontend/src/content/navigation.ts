export const mainNav = [
  { label: "Features", href: "/features" },
  { label: "FAQs", href: "/faqs" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNav = {
  main: mainNav,
  legal: [
    { label: "Terms", href: "/legal/terms" },
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Medical Disclaimer", href: "/legal/medical-disclaimer" },
  ],
  social: [
    { label: "LinkedIn", href: "https://linkedin.com" },
    { label: "X", href: "https://x.com" },
  ],
} as const;
