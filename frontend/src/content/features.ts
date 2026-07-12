import type { PillarMockupId } from "@/components/illustrations/PillarsMockups";

export const featuresContent = {
  hero: {
    headline: "Everything your clinic needs to run peptides — in one place.",
    subhead:
      "Six things that make peptides straightforward: training, a trusted reference, dosing tools, patient paperwork, a community, and an assistant you can rely on.",
  },
  sections: [
    {
      id: "training",
      mockup: "training" as PillarMockupId,
      title: "Training That Sticks",
      headline: "Get your team up to speed — fast.",
      body: "No more sending staff through endless forums and videos. Our courses take anyone from “new to peptides” to confident, one clear step at a time. Every course is short, easy to follow, and ends with a quick assessment and a certificate. It’s all kept current, so your team is never learning something out of date.",
    },
    {
      id: "reference",
      mockup: "reference" as PillarMockupId,
      title: "A Peptide Reference You Can Trust",
      headline: "Every peptide, explained the same clear way.",
      body: "What it does, how to dose it, what to watch for, and the sources behind it — all in one vetted library. Nothing goes up without expert review, and every entry shows when it was last checked. Your team gets one place to look, not ten tabs of conflicting advice.",
    },
    {
      id: "dosing",
      mockup: "dosing" as PillarMockupId,
      title: "Dosing Tools That Do The Math",
      headline: "The right dose, worked out for you.",
      body: "Enter the vial strength and the diluent, and it tells you exactly what goes in the syringe. Build ramp-up schedules, plan full protocols, and print a clean weekly plan in seconds. Save it, reuse it, adjust it next time. The math is handled — you just get the plan.",
    },
    {
      id: "paperwork",
      mockup: "paperwork" as PillarMockupId,
      title: "Patient Paperwork, Done For You",
      headline: "Hand patients something that looks professional — with your name on it.",
      body: "Handouts, consent forms, mixing sheets, dosing schedules — all written in plain language and ready to go. Add your clinic’s logo and details once, and every document you download carries your branding. Your practice looks polished and professional, without you designing a thing.",
    },
    {
      id: "community",
      mockup: "community" as PillarMockupId,
      title: "A Community That Understands Your Work",
      headline: "You don’t have to figure this out alone.",
      body: "Get answers from other clinics and our experts in a private forum, join monthly live Q&As, and stay current as the field moves. Miss a session? It’s recorded and waiting for you.",
    },
    {
      id: "assistant",
      mockup: "assistant" as PillarMockupId,
      title: "An Assistant You Can Trust",
      headline: "Ask anything. Get a clear, sourced answer.",
      body: "Our assistant answers your peptide questions in plain English — drawing only from our vetted content, never the open web. Every answer comes with its source, so you can trust it and check it. It’s here to support your decisions, never to replace your judgment.",
    },
  ],
  closingCta: {
    headline: "See it all in action.",
    primaryCta: { label: "Get Started", href: "/contact" },
    secondaryCta: { label: "Book a Demo", href: "/contact#demo" },
  },
} as const;
