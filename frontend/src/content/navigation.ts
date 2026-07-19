export const mainNav = [
  { label: "Features", href: "/features" },
  { label: "FAQs", href: "/faqs" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/contact" },
] as const;

export const footerNav = {
  main: mainNav,
  community: [
    { label: "Features", href: "/features" },
    { label: "Blog", href: "/blog" },
    { label: "FAQs", href: "/faqs" },
    { label: "Get Started", href: "/register" },
    { label: "Book a Demo", href: "/contact#demo" },
    { label: "Log in", href: "/login" },
  ],
  legal: [
    { label: "Terms", href: "/legal/terms" },
    { label: "Privacy", href: "/legal/privacy" },
    { label: "Medical Disclaimer", href: "/legal/medical-disclaimer" },
  ],
  social: [
    { label: "LinkedIn", href: "https://linkedin.com" },
    { label: "Instagram", href: "https://instagram.com" },
    { label: "Facebook", href: "https://facebook.com" },
    { label: "YouTube", href: "https://youtube.com" },
    { label: "TikTok", href: "https://tiktok.com" },
    { label: "X", href: "https://x.com" },
  ],
  address: ["House of Life Sciences", "Clinical Education Platform"],
  contact: {
    email: "hello@houseoflifesciences.com",
    phone: "",
    href: "/contact",
  },
  disclaimer:
    "House of Life Sciences provides educational resources for healthcare professionals. Content is for training purposes and does not replace clinical judgment.",
} as const;
