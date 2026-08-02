/**
 * Deterministic cover styling for lecture/course cards.
 * CourseSummary has no image field — palette / glow placement derive from course_id.
 */

/** Clinical product photo — light-gray studio background. */
export const VIAL_PHOTO_LIGHT = "/assets/lectures/vial-hols-light.png";

/** Clinical product photo — deep Prussian studio background. */
export const VIAL_PHOTO_DARK = "/assets/lectures/vial-hols-dark.png";

/** @deprecated Use VIAL_PHOTO_LIGHT or VIAL_PHOTO_DARK */
export const VIAL_PHOTO_SRC = VIAL_PHOTO_LIGHT;

export type CourseCoverPalette = {
  navy: string;
  mid: string;
  lime: string;
  sky: string;
  ink: string;
  glow: string;
};

export type CourseCoverSpec = {
  /** Stable index for soft brand glow placement */
  pattern: number;
  palette: CourseCoverPalette;
};

/**
 * Premium close product-shot framing — oversized contain stage + scale so the vial
 * dominates the media. Soft studio-edge bleed via overflow is intentional; avoid
 * mid-glyph chops by keeping the product silhouette mostly intact.
 */
export type VialCompositionRecipe = {
  id: string;
  name: string;
  /** Stage width as % of media box (often 85–110% for close framing) */
  width: string;
  /** Stage height as % of media box (often 95–120%) */
  height: string;
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
  objectPosition: string;
  /** Contain keeps silhouette coherent; closeness comes from stage size + scale */
  objectFit: "contain";
  /** Extra spin on top of the baked-in product tilt (−6…+6) */
  rotate: number;
  /** Aggressive close-up scale (≈1.35…1.75) — editorial bleed OK */
  scale: number;
  opacity: number;
  /** 0–1 — separate aura layer intensity behind vial (not img blur) */
  glowIntensity: number;
  transformOrigin: string;
  /** 0–1 — stronger left scrim when vial sits closer to center */
  textScrimStrength: number;
};

export type CoverAccentLayout = VialCompositionRecipe & {
  transform: string;
  recipeId: string;
  recipeName: string;
};

/** @deprecated Use CoverAccentLayout */
export type CoverVialLayout = CoverAccentLayout;

/** HOLS brand-forward palettes (Prussian / Dusk / Lemon Lime / Baby Blue). */
const PALETTES: CourseCoverPalette[] = [
  {
    navy: "#142644",
    mid: "#1a2f55",
    lime: "#DDE466",
    sky: "#8DC3E1",
    ink: "#F4F7FB",
    glow: "rgba(221, 228, 102, 0.28)",
  },
  {
    navy: "#101b30",
    mid: "#3853A4",
    lime: "#DDE466",
    sky: "#8DC3E1",
    ink: "#EEF3FA",
    glow: "rgba(141, 195, 225, 0.32)",
  },
  {
    navy: "#0d1626",
    mid: "#152744",
    lime: "#E2EB6E",
    sky: "#A8D4EC",
    ink: "#F7FAFC",
    glow: "rgba(221, 228, 102, 0.22)",
  },
  {
    navy: "#142644",
    mid: "#243d66",
    lime: "#D4DE58",
    sky: "#79B8D8",
    ink: "#F0F4F9",
    glow: "rgba(56, 83, 164, 0.45)",
  },
  {
    navy: "#0e1830",
    mid: "#1c3558",
    lime: "#DDE466",
    sky: "#95C8E4",
    ink: "#F5F8FC",
    glow: "rgba(141, 195, 225, 0.26)",
  },
  {
    navy: "#0b1528",
    mid: "#1f3a60",
    lime: "#CFDC4C",
    sky: "#8DC3E1",
    ink: "#EEF2F8",
    glow: "rgba(221, 228, 102, 0.3)",
  },
];

/**
 * 10 close product-shot stages — oversized contain + aggressive scale.
 * Vial dominates the media (~editorial close-up); soft studio edges may bleed
 * past the card crop. Left title zone kept readable via scrim strength.
 */
export const VIAL_COMPOSITION_RECIPES: VialCompositionRecipe[] = [
  {
    id: "hero-right",
    name: "Hero right",
    top: "-4%",
    right: "-6%",
    width: "96%",
    height: "112%",
    objectPosition: "54% 50%",
    objectFit: "contain",
    rotate: -2,
    scale: 1.55,
    opacity: 1,
    glowIntensity: 0.34,
    transformOrigin: "58% 50%",
    textScrimStrength: 0.52,
  },
  {
    id: "soft-offset",
    name: "Soft offset",
    top: "-2%",
    right: "-2%",
    width: "90%",
    height: "108%",
    objectPosition: "52% 48%",
    objectFit: "contain",
    rotate: 0,
    scale: 1.48,
    opacity: 1,
    glowIntensity: 0.3,
    transformOrigin: "55% 50%",
    textScrimStrength: 0.5,
  },
  {
    id: "high-right",
    name: "High right",
    top: "-10%",
    right: "-8%",
    width: "98%",
    height: "118%",
    objectPosition: "56% 44%",
    objectFit: "contain",
    rotate: 3,
    scale: 1.62,
    opacity: 1,
    glowIntensity: 0.36,
    transformOrigin: "60% 40%",
    textScrimStrength: 0.54,
  },
  {
    id: "low-settle",
    name: "Low settle",
    bottom: "-8%",
    right: "-4%",
    width: "94%",
    height: "114%",
    objectPosition: "53% 56%",
    objectFit: "contain",
    rotate: -4,
    scale: 1.58,
    opacity: 1,
    glowIntensity: 0.32,
    transformOrigin: "56% 62%",
    textScrimStrength: 0.55,
  },
  {
    id: "far-right",
    name: "Far right",
    top: "-3%",
    right: "-12%",
    width: "88%",
    height: "110%",
    objectPosition: "58% 50%",
    objectFit: "contain",
    rotate: 2,
    scale: 1.42,
    opacity: 1,
    glowIntensity: 0.32,
    transformOrigin: "62% 50%",
    textScrimStrength: 0.48,
  },
  {
    id: "center-bias",
    name: "Center bias",
    top: "-2%",
    right: "0%",
    width: "102%",
    height: "112%",
    objectPosition: "48% 50%",
    objectFit: "contain",
    rotate: -1,
    scale: 1.52,
    opacity: 1,
    glowIntensity: 0.35,
    transformOrigin: "50% 50%",
    textScrimStrength: 0.6,
  },
  {
    id: "gentle-tilt",
    name: "Gentle tilt",
    top: "-6%",
    right: "-5%",
    width: "94%",
    height: "116%",
    objectPosition: "54% 50%",
    objectFit: "contain",
    rotate: 5,
    scale: 1.5,
    opacity: 1,
    glowIntensity: 0.33,
    transformOrigin: "56% 50%",
    textScrimStrength: 0.53,
  },
  {
    id: "counter-tilt",
    name: "Counter tilt",
    top: "-5%",
    right: "-4%",
    width: "92%",
    height: "114%",
    objectPosition: "53% 50%",
    objectFit: "contain",
    rotate: -5,
    scale: 1.54,
    opacity: 1,
    glowIntensity: 0.34,
    transformOrigin: "55% 50%",
    textScrimStrength: 0.54,
  },
  {
    id: "generous",
    name: "Generous",
    top: "-8%",
    right: "-8%",
    width: "108%",
    height: "120%",
    objectPosition: "52% 50%",
    objectFit: "contain",
    rotate: 0,
    scale: 1.68,
    opacity: 1,
    glowIntensity: 0.31,
    transformOrigin: "55% 50%",
    textScrimStrength: 0.56,
  },
  {
    id: "intimate",
    name: "Intimate",
    top: "-6%",
    right: "-2%",
    width: "100%",
    height: "118%",
    objectPosition: "50% 46%",
    objectFit: "contain",
    rotate: 4,
    scale: 1.72,
    opacity: 1,
    glowIntensity: 0.38,
    transformOrigin: "52% 46%",
    textScrimStrength: 0.58,
  },
];

const PANEL_SCALE = 0.85;

function scalePercent(value: string | undefined, factor: number): string | undefined {
  if (value === undefined) return undefined;
  const match = /^(-?\d+(?:\.\d+)?)%$/.exec(value);
  if (!match) return value;
  const scaled = Math.round(parseFloat(match[1]!) * factor * 10) / 10;
  return `${scaled}%`;
}

function toPanelRecipe(recipe: VialCompositionRecipe): VialCompositionRecipe {
  return {
    ...recipe,
    width: scalePercent(recipe.width, PANEL_SCALE) ?? recipe.width,
    height: scalePercent(recipe.height, PANEL_SCALE) ?? recipe.height,
    top: scalePercent(recipe.top, PANEL_SCALE),
    right: scalePercent(recipe.right, PANEL_SCALE),
    bottom: scalePercent(recipe.bottom, PANEL_SCALE),
    left: scalePercent(recipe.left, PANEL_SCALE),
    scale: Math.round(recipe.scale * 0.96 * 100) / 100,
  };
}

/** FNV-1a style hash — stable across sessions. */
export function hashCourseId(courseId: string): number {
  let h = 2166136261;
  for (let i = 0; i < courseId.length; i += 1) {
    h ^= courseId.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function getCourseCoverSpec(courseId: string): CourseCoverSpec {
  const hash = hashCourseId(courseId);
  return {
    pattern: hash % 8,
    palette: PALETTES[(hash >>> 12) % PALETTES.length]!,
  };
}

export function tidyCoverTitle(title: string): string {
  return title.replace(/^Peptide University:\s*/i, "").trim() || title;
}

/** Display title for book-cover typography (lecture heading above vial). */
export function getCoverDisplayTitle(title: string): string {
  return tidyCoverTitle(title);
}

/** All lecture covers use the HOLS vial photo. Kept for API compatibility. */
export function courseNeedsVial(_title?: string): boolean {
  return true;
}

/** Resolve the raw recipe for a course (before panel scaling). */
export function getVialCompositionRecipe(courseId: string): VialCompositionRecipe {
  const hash = hashCourseId(courseId);
  const slot = (hash >>> 3) % VIAL_COMPOSITION_RECIPES.length;
  return VIAL_COMPOSITION_RECIPES[slot]!;
}

function recipeToLayout(recipe: VialCompositionRecipe): CoverAccentLayout {
  return {
    ...recipe,
    recipeId: recipe.id,
    recipeName: recipe.name,
    transform: `rotate(${recipe.rotate}deg) scale(${recipe.scale})`,
  };
}

/**
 * Position + scale for cover vial — close product hero, unique per course_id.
 * 10 named recipes hashed deterministically from course_id.
 */
export function getCoverVialLayout(
  courseId: string,
  variant: "card" | "panel",
): CoverAccentLayout {
  const base = getVialCompositionRecipe(courseId);
  const recipe = variant === "panel" ? toPanelRecipe(base) : base;
  return recipeToLayout(recipe);
}

/** @deprecated Covers always use vial — retained for decor component if reused elsewhere. */
export function getCoverDecorLayout(
  spec: CourseCoverSpec,
  variant: "card" | "panel",
): CoverAccentLayout {
  return getCoverVialLayout(String(spec.pattern), variant);
}

export function courseCoverCssVars(spec: CourseCoverSpec): Record<string, string> {
  return {
    "--cover-art-navy": spec.palette.navy,
    "--cover-art-mid": spec.palette.mid,
    "--cover-art-lime": spec.palette.lime,
    "--cover-art-sky": spec.palette.sky,
    "--cover-art-ink": spec.palette.ink,
    "--cover-art-glow": spec.palette.glow,
  };
}

/** Deterministic particle positions for cover atmosphere layers. */
export function coverAtmosphereParticles(
  seed: number,
): Array<{ x: number; y: number; size: number; opacity: number }> {
  const particles: Array<{ x: number; y: number; size: number; opacity: number }> = [];
  let s = seed;
  for (let i = 0; i < 10; i += 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    particles.push({
      x: 6 + (s % 880) / 10,
      y: 4 + ((s >> 8) % 320) / 10,
      size: 1.5 + (s % 3),
      opacity: 0.1 + (s % 16) / 100,
    });
  }
  return particles;
}
