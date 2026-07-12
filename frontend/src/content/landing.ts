export const landingContent = {
  hero: {
    eyebrow: "HOUSE OF LIFE SCIENCES",
    headline: "Run peptides in your clinic with confidence.",
    subhead:
      "Get your whole team trained, keep the dosing right, and hand patients clean, branded materials without becoming the peptide expert yourself.",
    primaryCta: { label: "Get Started", href: "/contact" },
    secondaryCta: { label: "Book a Demo", href: "/contact#demo" },
  },
  trustStrip: [
    "Trusted by clinics",
    "Reviewed by experts",
    "Sources on everything",
  ],
  hook: {
    headline:
      "Demand for peptides is growing fast, and getting it right shouldn’t be left to guesswork.",
    problem:
      "Today the answers are scattered across forums, group chats, and unverified PDFs, and that uncertainty becomes your clinic’s risk.",
    resolution:
      "We bring everything your clinic needs into one place: the training, the dosing, and the patient paperwork, so your team can move quickly and get it right.",
    beforeLabel: "Scattered information",
    afterLabel: "One trusted system",
    problemImage: "/assets/images/hols-tote-bag-lifestyle.png",
    solutionImage: "/assets/images/hols-welcome-sign-lobby.png",
  },
  whatYouGet: {
    headline: "One place to train your team and run peptides properly.",
    cards: [
      {
        id: "courses",
        image: "/assets/images/hols-education-books-mockup.png",
        title: "Expert-Led Courses",
        description:
          "Training that actually teaches. Onboard your team quickly and ensure everyone operates at the highest clinical standard.",
      },
      {
        id: "dosing",
        image: "/assets/images/hols-brand-cards-trio.png",
        title: "Dosing Tools That Do the Math",
        description:
          "Eliminate human error. Get precise, instant calculations tailored to your patient protocols without the guesswork.",
      },
      {
        id: "documents",
        image: "/assets/images/hols-business-cards-mockup.png",
        title: "Ready-to-Use Patient Documents",
        description:
          "Fully compliant paperwork customized with your clinic’s branding. Ready to print or sign digitally from day one.",
      },
    ],
  },
  pillars: {
    headline: "Everything inside",
    items: [
      {
        id: "training",
        image: "/assets/images/hols-education-books-mockup.png",
        title: "Training that sticks",
        description:
          "Short, structured courses that take your staff from “new to peptides” to confident, with a certificate at the end.",
      },
      {
        id: "reference",
        image: "/assets/images/hols-notebook-bookmarks.png",
        title: "A peptide reference you can trust",
        description:
          "Every peptide, explained the same clear way: what it does, how to dose it, what to watch for, and the sources behind it.",
      },
      {
        id: "dosing",
        image: "/assets/images/hols-brand-cards-trio.png",
        title: "Dosing tools that do the math",
        description:
          "Reconstitution, titration, and full protocols worked out for you, no more manual calculations.",
      },
      {
        id: "paperwork",
        image: "/assets/images/hols-business-cards-mockup.png",
        title: "Patient paperwork, done for you",
        description:
          "Handouts, consent forms, and dosing sheets with your clinic’s logo, ready to print and hand over.",
      },
      {
        id: "community",
        image: "/assets/images/hols-welcome-sign-lobby.png",
        title: "A community that understands your work",
        description:
          "A private forum, monthly live Q&As, and updates so you’re never figuring it out alone.",
      },
      {
        id: "assistant",
        image: "/assets/images/hols-subway-poster-mockup.png",
        title: "An assistant you can trust",
        description:
          "Ask anything about peptides and get a clear answer, drawn only from our vetted content, with the source attached.",
      },
    ],
  },
  whoItsFor: {
    headline: "Built for your whole practice.",
    audiences: [
      {
        id: "owners",
        image: "/assets/images/hols-awning-storefront.png",
        title: "Clinic owners",
        description:
          "Train everyone to the same standard, lower your risk, and present your practice professionally.",
      },
      {
        id: "providers",
        image: "/assets/images/hols-subway-poster-mockup.png",
        title: "Your providers",
        description:
          "Dosing and protocols they can rely on, plus a credential worth showing.",
      },
      {
        id: "learners",
        image: "/assets/images/hols-notebook-bookmarks.png",
        title: "Anyone serious about learning",
        description: "Clear, evidence based peptide education.",
      },
    ],
  },
  certification: {
    headline: "Give your team a credential that means something.",
    body: "Finish the courses, pass the check, and earn a House of Life Sciences certification — proof your staff know what they’re doing, renewed as things change.",
  },
  pricingTeaser: {
    eyebrow: "Pricing",
    headline: "Plans for a single provider or a whole clinic.",
    body: "Start with one seat or set your whole team up together.",
    plans: [
      {
        title: "Single provider",
        description: "One seat with full platform access.",
      },
      {
        title: "Whole clinic",
        description: "Set your whole team up together.",
      },
    ],
    cta: { label: "See Plans", href: "/contact" },
  },
  finalCta: {
    eyebrow: "Ready when you are",
    headline: "Get your clinic running peptides the right way.",
    primaryCta: { label: "Get Started", href: "/contact" },
    secondaryCta: { label: "Book a Demo", href: "/contact#demo" },
  },
} as const;
