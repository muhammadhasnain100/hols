/**
 * HOLS Brand Configuration
 * ─────────────────────────
 * Edit this file to update branding across the entire frontend.
 * Colors, typography, gradients, voice, and metadata all flow from here.
 */

export const brand = {
  /** ── Identity ─────────────────────────────────────────────── */
  name: "House of Life Sciences",
  shortName: "HOLS",
  tagline: "Science that supports life, not just treats it.",
  description:
    "Advancing peptide science through structured learning, clinical insight, and professional community.",
  motto: "Built on precision.",

  /** ── Colours (hex) ────────────────────────────────────────── */
  colors: {
    primary: {
      prussianBlue: "#152744",
      duskBlue: "#3853A4",
    },
    accent: {
      lemonLime: "#DDE466",
      babyBlue: "#8DC3E1",
    },
    neutral: {
      charcoal: "#383838",
      white: "#FFFFFF",
      black: "#000000",
    },
    /** Semantic aliases — map UI roles to palette colours */
    semantic: {
      background: "#FFFFFF",
      foreground: "#152744",
      muted: "#383838",
      border: "#8DC3E1",
      ring: "#3853A4",
    },
  },

  /** Opacity steps used for tints, tones & shades (brand guideline) */
  opacitySteps: [80, 60, 30] as const,

  /** ── Gradients ────────────────────────────────────────────── */
  gradients: {
    lifeGlow: {
      name: "Life Glow",
      description: "Growth, wellness, and vitality.",
      stops: ["#DDE466", "#8DC3E1"],
      angle: "135deg",
    },
    scienceHaze: {
      name: "Science Haze",
      description: "Research, precision, and clarity.",
      stops: ["#8DC3E1", "#3853A4"],
      angle: "160deg",
    },
    deepIntelligence: {
      name: "Deep Intelligence",
      description: "Trust, knowledge, and advanced innovation.",
      stops: ["#152744", "#3853A4"],
      angle: "180deg",
    },
    humanTouch: {
      name: "Human Touch",
      description: "Warmth, emotion, and softness.",
      stops: ["#DDE466", "#8DC3E1", "#FFFFFF"],
      angle: "120deg",
    },
    bioCalm: {
      name: "Bio Calm",
      description: "Care, nature, and clean science.",
      stops: ["#8DC3E1", "#DDE466"],
      angle: "145deg",
    },
    futurePulse: {
      name: "Future Pulse",
      description: "Movement, progress, and transformation.",
      stops: ["#3853A4", "#152744", "#DDE466"],
      angle: "90deg",
    },
  },

  /** ── Typography ───────────────────────────────────────────── */
  fonts: {
    /**
     * Brand: Google Sans (primary) + Gilroy (secondary).
     * Load real files from /public/fonts (see README there).
     * Until then, DM Sans / Outfit stand in via next/font.
     */
    primary: {
      family: '"Google Sans", var(--font-primary)',
      fallback: '"DM Sans", system-ui, sans-serif',
      name: "Google Sans",
      weights: {
        regular: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
      },
    },
    secondary: {
      family: '"Gilroy", var(--font-secondary)',
      fallback: '"Outfit", system-ui, sans-serif',
      name: "Gilroy",
      weights: {
        light: 300,
        extraBold: 800,
      },
    },
  },

  typography: {
    /** Google Sans Bold · 60px · leading 100–110% */
    heading: {
      font: "primary",
      size: "3.75rem", // 60px
      weight: 700,
      lineHeight: "1.05",
      letterSpacing: "0.01em",
    },
    /** Google Sans Regular · 34px */
    subheading: {
      font: "primary",
      size: "2.125rem", // 34px
      weight: 400,
      lineHeight: "1.1",
      letterSpacing: "0.005em",
    },
    /** Gilroy Light · 18px · leading 110–120% · tracking up to +20 */
    body: {
      font: "secondary",
      size: "1.125rem", // 18px
      weight: 300,
      lineHeight: "1.15",
      letterSpacing: "0.02em",
    },
    /** Google Sans Regular · 14px */
    caption: {
      font: "primary",
      size: "0.875rem", // 14px
      weight: 400,
      lineHeight: "1.2",
      letterSpacing: "0.01em",
    },
  },

  /** ── Logo ─────────────────────────────────────────────────── */
  logo: {
    /** Minimum clear space = 1× height of the "S" in logotype */
    safeSpaceRatio: 1,
    coBrandClearSpaceRatio: 1,
  },

  /** ── Voice & personality ──────────────────────────────────── */
  voice: {
    personality: ["Intelligent", "Disciplined", "Precise", "Confident", "Institutional"],
    principles: [
      "Prioritize clarity over creativity",
      "State facts, don't oversell outcomes",
      "Let structure and accuracy build trust",
      "Speak as an institution, not a brand",
    ],
  },

  pillars: [
    "Scientific Authority",
    "Practical Application",
    "Professional Development",
    "Institutional Community",
  ],

  values: [
    "Evidence First",
    "Clinical Integrity",
    "Precision in Practice",
    "Continuous Progression",
    "Community Accountability",
  ],
} as const;

export type Brand = typeof brand;
export type BrandColor = keyof typeof brand.colors.primary | keyof typeof brand.colors.accent;
