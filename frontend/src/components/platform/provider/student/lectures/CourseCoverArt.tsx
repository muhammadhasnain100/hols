"use client";

import { type CSSProperties } from "react";
import { CourseCoverVial } from "@/components/platform/provider/student/lectures/CourseCoverVial";
import {
  courseCoverCssVars,
  getCourseCoverSpec,
  getCoverVialLayout,
  tidyCoverTitle,
} from "@/components/platform/provider/student/lectures/courseCover";
import { cn } from "@/lib/utils";

type CourseCoverArtProps = {
  courseId: string;
  title?: string;
  /** `card` = compact thumbnail; `panel` = expanded Front Cover background */
  variant?: "card" | "panel";
  className?: string;
};

const LOGO_WORDMARK_LIGHT = "/assets/logo/hols-logo-light.png";
const LOGO_WORDMARK_DARK = "/assets/logo/hols-logo.png";
const LOGO_MARK_LIGHT = "/assets/logo/hols-logo-mark-light.png";
const LOGO_MARK_DARK = "/assets/logo/hols-logo-mark.png";

/** Deterministic particle positions from course id hash. */
function coverParticles(seed: number): Array<{ x: number; y: number; size: number; opacity: number }> {
  const particles: Array<{ x: number; y: number; size: number; opacity: number }> = [];
  let s = seed;
  for (let i = 0; i < 8; i += 1) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    particles.push({
      x: 8 + (s % 840) / 10,
      y: 6 + ((s >> 8) % 880) / 10,
      size: 1.5 + (s % 3),
      opacity: 0.12 + (s % 18) / 100,
    });
  }
  return particles;
}

/**
 * HOLS-branded lecture cover — premium close product-shot vial hero.
 * Uniqueness comes from palette, glow placement, and oversized vial stage per course_id.
 */
export function CourseCoverArt({
  courseId,
  title = "Lecture",
  variant = "card",
  className,
}: CourseCoverArtProps) {
  const spec = getCourseCoverSpec(courseId);
  const vars = courseCoverCssVars(spec) as CSSProperties;
  const shortTitle = tidyCoverTitle(title);
  const glowX = 18 + (spec.pattern % 5) * 14;
  const glowY = 12 + (spec.pattern % 4) * 10;
  const vialLayout = getCoverVialLayout(courseId, variant);
  const particles = coverParticles(spec.pattern * 7919 + courseId.length * 31);

  const vialGlowOpacity = vialLayout.glowIntensity * (variant === "panel" ? 0.85 : 1);
  const glowUsesSky = spec.pattern % 3 === 0;

  return (
    <div
      className={cn(
        "lecture-cover-art pointer-events-none absolute inset-0 overflow-hidden",
        variant === "panel" && "lecture-cover-art-panel",
        className,
      )}
      style={
        {
          ...vars,
          "--cover-glow-x": `${glowX}%`,
          "--cover-glow-y": `${glowY}%`,
          "--cover-text-scrim-strength": String(vialLayout.textScrimStrength),
        } as CSSProperties
      }
      data-cover-pattern={spec.pattern}
      data-cover-vial="true"
      data-cover-recipe={vialLayout.recipeId}
      role="img"
      aria-label={`${shortTitle} cover`}
    >
      {/* Zoomable scene — media + accent only (keeps text/noise crisp on hover) */}
      <div className="lecture-cover-art-scene absolute inset-0" aria-hidden>
        <div className="lecture-cover-art-media absolute inset-0">
          {/* Studio sheen on background only — never overlays the vial */}
          <div className="lecture-cover-diagonal-shine absolute inset-0" aria-hidden />
        </div>

        {/* Close-up stage — oversized contain + scale; soft studio-edge bleed OK */}
        <div
          className="lecture-cover-accent lecture-cover-accent-vial pointer-events-none absolute z-[1]"
          style={{
            top: vialLayout.top,
            right: vialLayout.right,
            bottom: vialLayout.bottom,
            left: vialLayout.left,
            width: vialLayout.width,
            height: vialLayout.height,
            opacity: vialLayout.opacity,
            transform: vialLayout.transform,
            transformOrigin: vialLayout.transformOrigin,
            display: variant === "panel" ? "none" : undefined,
          }}
        >
          {/* Motion layer — hover lift without overriding recipe rotate/scale */}
          <div className="lecture-cover-accent-motion absolute inset-0">
            <div
              className="lecture-cover-vial-glow pointer-events-none absolute inset-0"
              style={
                {
                  opacity: vialGlowOpacity,
                  "--cover-vial-glow-color": glowUsesSky
                    ? "rgba(141, 195, 225, 0.42)"
                    : "rgba(221, 228, 102, 0.38)",
                } as CSSProperties
              }
              aria-hidden
            />
            <CourseCoverVial
              objectPosition={vialLayout.objectPosition}
              objectFit={vialLayout.objectFit}
              opacity={1}
            />
          </div>
        </div>
      </div>

      {/* Noise texture */}
      <div className="lecture-cover-noise absolute inset-0 z-[1]" aria-hidden />

      {/* Floating bokeh particles */}
      <div className="lecture-cover-particles absolute inset-0 z-[1]" aria-hidden>
        {particles.map((p, i) => (
          <span
            key={i}
            className="lecture-cover-particle absolute rounded-full bg-white"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
            }}
          />
        ))}
      </div>

      {variant === "panel" ? (
        /* Panel = background chrome only — no text, no vial (Front Cover uses its own layout). */
        null
      ) : (
        <>
          <div className="lecture-cover-art-card-fade absolute inset-0 z-[2]" aria-hidden />
          <div className="lecture-cover-art-vignette absolute inset-0 z-[2]" aria-hidden />
          <div className="lecture-cover-art-card-text-scrim absolute inset-0 z-[2]" aria-hidden />

          <div className="absolute inset-0 z-[3] flex flex-col px-5 pb-3 pt-5 sm:px-6 sm:pb-3.5 sm:pt-6">
            <div className="lecture-cover-brand flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO_MARK_DARK}
                alt=""
                className="lecture-cover-mark lecture-cover-logo--theme-light h-4 w-4 object-contain opacity-80 sm:h-[1.1rem] sm:w-[1.1rem]"
                draggable={false}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO_MARK_LIGHT}
                alt=""
                className="lecture-cover-mark lecture-cover-logo--theme-dark h-4 w-4 object-contain opacity-85 sm:h-[1.1rem] sm:w-[1.1rem]"
                draggable={false}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO_WORDMARK_DARK}
                alt=""
                className="lecture-cover-logo lecture-cover-logo--theme-light h-[0.85rem] w-auto object-contain object-left opacity-85 sm:h-[0.95rem]"
                draggable={false}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={LOGO_WORDMARK_LIGHT}
                alt=""
                className="lecture-cover-logo lecture-cover-logo--theme-dark h-[0.85rem] w-auto object-contain object-left opacity-90 sm:h-[0.95rem]"
                draggable={false}
              />
            </div>

            <div className="lecture-cover-art-card-text mt-auto min-w-0 max-w-[14.5rem] sm:max-w-[15.25rem]">
              <p className="lecture-cover-art-eyebrow lecture-cover-art-category">
                HOLS Library
              </p>
              <p className="lecture-cover-art-title font-sans mt-1.5 line-clamp-3 break-words [overflow-wrap:break-word] sm:mt-2">
                {shortTitle}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
