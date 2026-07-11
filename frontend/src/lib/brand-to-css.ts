import { brand } from "@/config/brand";

function gradientToCss(stops: readonly string[], angle: string): string {
  return `linear-gradient(${angle}, ${stops.join(", ")})`;
}

function withOpacity(hex: string, opacity: number): string {
  const value = hex.replace("#", "");
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity / 100})`;
}

/** Converts brand.ts tokens into CSS custom properties for :root */
export function brandToCssVariables(): string {
  const { colors, gradients, opacitySteps, typography, fonts } = brand;

  const lines: string[] = [
    `--brand-name: "${brand.name}";`,
    `--brand-short-name: "${brand.shortName}";`,

    /* Primary */
    `--brand-prussian-blue: ${colors.primary.prussianBlue};`,
    `--brand-dusk-blue: ${colors.primary.duskBlue};`,

    /* Accent */
    `--brand-lemon-lime: ${colors.accent.lemonLime};`,
    `--brand-baby-blue: ${colors.accent.babyBlue};`,

    /* Neutral */
    `--brand-charcoal: ${colors.neutral.charcoal};`,
    `--brand-white: ${colors.neutral.white};`,
    `--brand-black: ${colors.neutral.black};`,

    /* Semantic */
    `--brand-background: ${colors.semantic.background};`,
    `--brand-foreground: ${colors.semantic.foreground};`,
    `--brand-muted: ${colors.semantic.muted};`,
    `--brand-border: ${colors.semantic.border};`,
    `--brand-ring: ${colors.semantic.ring};`,

    /* Fonts */
    `--font-primary-stack: ${fonts.primary.family}, ${fonts.primary.fallback};`,
    `--font-secondary-stack: ${fonts.secondary.family}, ${fonts.secondary.fallback};`,

    /* Typography scale */
    `--brand-text-heading: ${typography.heading.size};`,
    `--brand-text-subheading: ${typography.subheading.size};`,
    `--brand-text-body: ${typography.body.size};`,
    `--brand-text-caption: ${typography.caption.size};`,

    `--brand-leading-heading: ${typography.heading.lineHeight};`,
    `--brand-leading-subheading: ${typography.subheading.lineHeight};`,
    `--brand-leading-body: ${typography.body.lineHeight};`,
    `--brand-leading-caption: ${typography.caption.lineHeight};`,

    `--brand-tracking-heading: ${typography.heading.letterSpacing};`,
    `--brand-tracking-subheading: ${typography.subheading.letterSpacing};`,
    `--brand-tracking-body: ${typography.body.letterSpacing};`,
    `--brand-tracking-caption: ${typography.caption.letterSpacing};`,
  ];

  /* Tints / tones / shades */
  const paletteColors = [
    ["prussian-blue", colors.primary.prussianBlue],
    ["dusk-blue", colors.primary.duskBlue],
    ["lemon-lime", colors.accent.lemonLime],
    ["baby-blue", colors.accent.babyBlue],
    ["charcoal", colors.neutral.charcoal],
    ["white", colors.neutral.white],
    ["black", colors.neutral.black],
  ] as const;

  for (const [name, hex] of paletteColors) {
    for (const step of opacitySteps) {
      lines.push(`--brand-${name}-${step}: ${withOpacity(hex, step)};`);
    }
  }

  /* Gradients */
  for (const [key, gradient] of Object.entries(gradients)) {
    const cssValue = gradientToCss(gradient.stops, gradient.angle);
    lines.push(`--brand-gradient-${key}: ${cssValue};`);
  }

  return `:root {\n  ${lines.join("\n  ")}\n}`;
}
