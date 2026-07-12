export const blogCategories = [
  "Guides",
  "Research",
  "Peptide Spotlights",
  "Product Updates",
] as const;

export type BlogCategory = (typeof blogCategories)[number];

export type BlogSource = {
  label: string;
  url?: string;
};

export type BlogRelatedLink = {
  label: string;
  href: string;
  type: "lesson" | "reference";
};

export type BlogBodyBlock =
  | { type: "p"; content: string }
  | { type: "h2"; content: string };

export type BlogPost = {
  slug: string;
  title: string;
  teaser: string;
  date: string;
  category: BlogCategory;
  author: string;
  reviewedBy: string;
  lastReviewed?: string;
  updated?: string;
  featured?: boolean;
  body: BlogBodyBlock[];
  sources: BlogSource[];
  related: BlogRelatedLink[];
};

export const blogPosts: BlogPost[] = [
  {
    slug: "getting-started-with-peptides",
    title: "Getting started with peptides in your clinic",
    teaser:
      "A practical guide to building a peptide program — from team training to patient paperwork.",
    date: "June 12, 2026",
    category: "Guides",
    author: "HOLS Editorial Team",
    reviewedBy: "Dr. Sarah Chen, Medical Director",
    lastReviewed: "June 10, 2026",
    featured: true,
    body: [
      {
        type: "p",
        content:
          "Adding peptides to your clinic doesn’t have to mean months of research and guesswork. The clinics that do it well start with three things: a trained team, a trusted reference, and paperwork patients actually understand.",
      },
      {
        type: "h2",
        content: "Start with your team",
      },
      {
        type: "p",
        content:
          "Before you write a single protocol, make sure the people administering and discussing peptides can speak confidently. That means structured training — not a one-off lunch-and-learn. Your front desk, nurses, and providers should all know the basics: what peptides are, how they’re reconstituted, and how to answer the questions patients ask first.",
      },
      {
        type: "h2",
        content: "Build your reference library",
      },
      {
        type: "p",
        content:
          "Every peptide entry in your system should be vetted, sourced, and dated. When a patient asks “where does this information come from?” you should have an answer ready. Keep dosing calculators, reconstitution guides, and contraindication notes in one place — not scattered across PDFs and group chats.",
      },
      {
        type: "h2",
        content: "Get your paperwork right",
      },
      {
        type: "p",
        content:
          "Consent forms, patient handouts, and dosing sheets should carry your clinic’s branding and use language patients can follow. Generic templates create generic experiences. Branded, reviewed documents signal professionalism and protect your practice.",
      },
    ],
    sources: [
      { label: "FDA — Compounded Drug Products", url: "https://www.fda.gov" },
      { label: "NIH — Peptide Therapeutics Overview", url: "https://www.nih.gov" },
      { label: "HOLS Internal Clinical Review, June 2026" },
    ],
    related: [
      { label: "Peptide Foundations Course", href: "/features", type: "lesson" },
      { label: "BPC-157 Reference Entry", href: "/features", type: "reference" },
      { label: "Reconstitution Calculator", href: "/features", type: "reference" },
    ],
  },
  {
    slug: "reconstitution-basics",
    title: "Reconstitution basics every provider should know",
    teaser: "The math, the steps, and the common mistakes — explained clearly.",
    date: "June 5, 2026",
    category: "Guides",
    author: "HOLS Editorial Team",
    reviewedBy: "Dr. Sarah Chen, Medical Director",
    lastReviewed: "June 3, 2026",
    body: [
      {
        type: "p",
        content:
          "Reconstitution errors are one of the most common — and most preventable — mistakes in peptide clinics. Get the math right, follow a consistent process, and document every step.",
      },
      {
        type: "h2",
        content: "The basic math",
      },
      {
        type: "p",
        content:
          "Start with your vial concentration and desired dose. Work backwards from the patient’s prescribed amount to the volume you’ll draw. Our dosing calculator handles this automatically, but every provider should understand the logic behind the numbers.",
      },
      {
        type: "h2",
        content: "Common mistakes",
      },
      {
        type: "p",
        content:
          "Using the wrong diluent, skipping the swirl-and-wait step, or drawing from a vial that’s been sitting unrefrigerated — these are the errors we see most. Build a checklist and stick to it every time.",
      },
    ],
    sources: [
      { label: "USP <797> Pharmaceutical Compounding Standards" },
      { label: "HOLS Reconstitution Protocol Guide, May 2026" },
    ],
    related: [
      { label: "Reconstitution Calculator", href: "/features", type: "reference" },
      { label: "Dosing Fundamentals Lesson", href: "/features", type: "lesson" },
    ],
  },
  {
    slug: "bpc-157-spotlight",
    title: "Peptide spotlight: BPC-157",
    teaser: "What the evidence says, how clinics use it, and what to watch for.",
    date: "May 28, 2026",
    category: "Peptide Spotlights",
    author: "HOLS Editorial Team",
    reviewedBy: "Dr. James Okonkwo, Clinical Advisor",
    lastReviewed: "May 26, 2026",
    body: [
      {
        type: "p",
        content:
          "BPC-157 remains one of the most requested peptides in clinical settings. This spotlight covers what the current evidence supports, how clinics are using it in practice, and what conversations to have with patients before starting.",
      },
      {
        type: "h2",
        content: "What the research shows",
      },
      {
        type: "p",
        content:
          "Most published data comes from animal models studying tissue repair and gut integrity. Human clinical trials are limited. Be transparent with patients about evidence levels and avoid overstating outcomes.",
      },
      {
        type: "h2",
        content: "Clinical considerations",
      },
      {
        type: "p",
        content:
          "Route of administration, dosing frequency, and patient selection all matter. Document informed consent carefully and set realistic expectations from the first visit.",
      },
    ],
    sources: [
      { label: "PubMed — BPC-157 systematic review, 2024", url: "https://pubmed.ncbi.nlm.nih.gov" },
      { label: "HOLS BPC-157 Reference Entry, May 2026" },
    ],
    related: [
      { label: "BPC-157 Reference Entry", href: "/features", type: "reference" },
      { label: "Patient Consent Templates", href: "/features", type: "lesson" },
    ],
  },
  {
    slug: "recent-research-roundup",
    title: "Recent research roundup: Q2 2026",
    teaser:
      "The studies worth knowing about — reviewed and summarized for busy clinicians.",
    date: "May 20, 2026",
    category: "Research",
    author: "HOLS Research Desk",
    reviewedBy: "Dr. Sarah Chen, Medical Director",
    lastReviewed: "May 18, 2026",
    body: [
      {
        type: "p",
        content:
          "Q2 brought a handful of studies worth your attention — from updated safety data to new dosing considerations. Here’s what our team flagged as clinically relevant.",
      },
      {
        type: "h2",
        content: "Highlights",
      },
      {
        type: "p",
        content:
          "We reviewed twelve new publications this quarter. Three met our threshold for clinical relevance based on study design, sample size, and applicability to outpatient peptide practice.",
      },
    ],
    sources: [
      { label: "PubMed Central — Q2 2026 peptide literature scan" },
      { label: "HOLS Research Review Board, May 2026" },
    ],
    related: [
      { label: "Research Library", href: "/features", type: "reference" },
    ],
  },
  {
    slug: "platform-update-june",
    title: "What’s new: dosing tools and branded documents",
    teaser: "New features to help your clinic run peptides faster and more consistently.",
    date: "May 12, 2026",
    category: "Product Updates",
    author: "HOLS Product Team",
    reviewedBy: "HOLS Clinical Team",
    updated: "May 14, 2026",
    body: [
      {
        type: "p",
        content:
          "This month we shipped two features clinics have been asking for: an upgraded dosing calculator and one-click branded document downloads.",
      },
      {
        type: "h2",
        content: "Dosing calculator v2",
      },
      {
        type: "p",
        content:
          "Faster inputs, clearer output, and built-in unit conversion. Your team can go from prescription to draw volume in seconds.",
      },
      {
        type: "h2",
        content: "Branded documents",
      },
      {
        type: "p",
        content:
          "Upload your logo once. Every handout, consent form, and dosing sheet downloads with your clinic branding applied automatically.",
      },
    ],
    sources: [{ label: "HOLS Release Notes, May 2026" }],
    related: [
      { label: "Document Templates", href: "/features", type: "reference" },
      { label: "Platform Overview", href: "/features", type: "lesson" },
    ],
  },
  {
    slug: "patient-consent-best-practices",
    title: "Patient consent best practices for peptide therapies",
    teaser: "How to communicate clearly and protect your practice.",
    date: "May 4, 2026",
    category: "Guides",
    author: "HOLS Editorial Team",
    reviewedBy: "Dr. James Okonkwo, Clinical Advisor",
    lastReviewed: "May 2, 2026",
    body: [
      {
        type: "p",
        content:
          "Good consent isn’t a formality — it’s the foundation of trust. Patients who understand what they’re agreeing to ask better questions and have more realistic expectations.",
      },
      {
        type: "h2",
        content: "What to include",
      },
      {
        type: "p",
        content:
          "Every consent should cover the therapy being offered, known risks, off-label status where applicable, alternative options, and the patient’s right to stop at any time. Use plain language, not legalese.",
      },
    ],
    sources: [
      { label: "AMA Informed Consent Guidelines" },
      { label: "HOLS Consent Template Library, April 2026" },
    ],
    related: [
      { label: "Consent Form Templates", href: "/features", type: "reference" },
      { label: "Patient Communication Course", href: "/features", type: "lesson" },
    ],
  },
  {
    slug: "tb500-clinical-overview",
    title: "Peptide spotlight: TB-500",
    teaser:
      "A balanced overview of use cases, dosing considerations, and evidence gaps.",
    date: "April 22, 2026",
    category: "Peptide Spotlights",
    author: "HOLS Editorial Team",
    reviewedBy: "Dr. James Okonkwo, Clinical Advisor",
    lastReviewed: "April 20, 2026",
    body: [
      {
        type: "p",
        content:
          "TB-500 (Thymosin Beta-4) is frequently discussed alongside tissue repair protocols. This overview separates what’s supported by data from what’s still speculative.",
      },
      {
        type: "h2",
        content: "Evidence landscape",
      },
      {
        type: "p",
        content:
          "Preclinical data is more robust than human trials. Clinics using TB-500 should document patient selection criteria carefully and avoid claims that exceed the evidence base.",
      },
    ],
    sources: [
      { label: "PubMed — Thymosin Beta-4 review, 2023", url: "https://pubmed.ncbi.nlm.nih.gov" },
      { label: "HOLS TB-500 Reference Entry, April 2026" },
    ],
    related: [
      { label: "TB-500 Reference Entry", href: "/features", type: "reference" },
    ],
  },
];

export const blogContent = {
  hero: {
    headline: "Peptides, made simple.",
    subhead:
      "Clear guides, the latest research, and practical insights for clinics — written and reviewed by our team.",
  },
  index: {
    initialVisible: 2,
    loadMoreCount: 2,
  },
  articleCta: {
    headline: "Want your clinic set up?",
    primaryCta: { label: "Get Started", href: "/contact" },
  },
  newsletter: {
    headline: "Practical insights, straight to your inbox.",
    body: "New guides, research, and updates — no spam, just what’s useful for your clinic.",
    cta: "Subscribe",
  },
} as const;
