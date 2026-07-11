export const blogCategories = [
  "Guides",
  "Research",
  "Peptide Spotlights",
  "Product Updates",
] as const;

export type BlogCategory = (typeof blogCategories)[number];

export const blogContent = {
  hero: {
    headline: "Peptides, made simple.",
    subhead:
      "Clear guides, the latest research, and practical insights for clinics — written and reviewed by our team.",
  },
  featured: {
    slug: "getting-started-with-peptides",
    title: "Getting started with peptides in your clinic",
    teaser:
      "A practical guide to building a peptide program — from team training to patient paperwork.",
    date: "June 12, 2026",
    category: "Guides" as BlogCategory,
    lastReviewed: "June 10, 2026",
  },
  posts: [
    {
      slug: "reconstitution-basics",
      title: "Reconstitution basics every provider should know",
      teaser: "The math, the steps, and the common mistakes — explained clearly.",
      date: "June 5, 2026",
      category: "Guides" as BlogCategory,
      lastReviewed: "June 3, 2026",
    },
    {
      slug: "bpc-157-spotlight",
      title: "Peptide spotlight: BPC-157",
      teaser: "What the evidence says, how clinics use it, and what to watch for.",
      date: "May 28, 2026",
      category: "Peptide Spotlights" as BlogCategory,
      lastReviewed: "May 26, 2026",
    },
    {
      slug: "recent-research-roundup",
      title: "Recent research roundup: Q2 2026",
      teaser: "The studies worth knowing about — reviewed and summarized for busy clinicians.",
      date: "May 20, 2026",
      category: "Research" as BlogCategory,
      lastReviewed: "May 18, 2026",
    },
    {
      slug: "platform-update-june",
      title: "What’s new: dosing tools and branded documents",
      teaser: "New features to help your clinic run peptides faster and more consistently.",
      date: "May 12, 2026",
      category: "Product Updates" as BlogCategory,
    },
    {
      slug: "patient-consent-best-practices",
      title: "Patient consent best practices for peptide therapies",
      teaser: "How to communicate clearly and protect your practice.",
      date: "May 4, 2026",
      category: "Guides" as BlogCategory,
      lastReviewed: "May 2, 2026",
    },
    {
      slug: "tb500-clinical-overview",
      title: "Peptide spotlight: TB-500",
      teaser: "A balanced overview of use cases, dosing considerations, and evidence gaps.",
      date: "April 22, 2026",
      category: "Peptide Spotlights" as BlogCategory,
      lastReviewed: "April 20, 2026",
    },
  ],
  newsletter: {
    headline: "Practical insights, straight to your inbox.",
    body: "New guides, research, and updates — no spam, just what’s useful for your clinic.",
    cta: "Subscribe",
  },
} as const;
