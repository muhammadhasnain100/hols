"use client";

import { type CSSProperties } from "react";
import { CourseCoverLabeledVial } from "@/components/platform/provider/student/lectures/CourseCoverLabeledVial";
import { CourseCoverProductVial } from "@/components/platform/provider/student/lectures/CourseCoverProductVial";
import { CourseCoverVial } from "@/components/platform/provider/student/lectures/CourseCoverVial";
import {
  courseCoverCssVars,
  getCourseCoverSpec,
  getCoverVialLayout,
  resolveCourseCover,
  shiftCoverObjectPositionForPanel,
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

/**
 * HOLS-branded lecture cover —
 * books use theme light/dark art; products use mode bg + transparent vial.
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
  const vialLayout = getCoverVialLayout(courseId, variant);
  const {
    photos: coverPhotos,
    vialSrc,
    isCustom: customCover,
    coverId,
    objectPosition: coverObjectPosition = "center center",
    layout: coverLayout,
  } = resolveCourseCover(courseId, title);

  const isBookCover = customCover && coverLayout === "book";
  const isProductVialCover = Boolean(vialSrc) && coverLayout === "product";
  const useLabeledVial = !isBookCover && !isProductVialCover;
  const useFullBleedPhoto = isBookCover || isProductVialCover;
  const photoObjectPosition =
    variant === "panel" && isProductVialCover
      ? shiftCoverObjectPositionForPanel(coverObjectPosition)
      : coverObjectPosition;

  return (
    <div
      className={cn(
        "lecture-cover-art pointer-events-none absolute inset-0 overflow-hidden",
        useFullBleedPhoto && "lecture-cover-art--full-bleed",
        (isBookCover || isProductVialCover) && "lecture-cover-art--custom-photo",
        isProductVialCover && "lecture-cover-art--product-vial",
        useLabeledVial && "lecture-cover-art--labeled-vial",
        variant === "panel" && "lecture-cover-art-panel",
        className,
      )}
      data-custom-cover={customCover ? "true" : undefined}
      data-custom-cover-id={customCover ? coverId : undefined}
      data-cover-layout={customCover ? coverLayout : undefined}
      style={
        {
          ...vars,
          "--cover-photo-position": coverObjectPosition,
          "--cover-text-scrim-strength": String(vialLayout.textScrimStrength),
        } as CSSProperties
      }
      data-cover-pattern={spec.pattern}
      data-cover-vial="true"
      role="img"
      aria-label={`${shortTitle} cover`}
    >
      <div className="lecture-cover-art-scene absolute inset-0" aria-hidden>
        <div className="lecture-cover-art-media absolute inset-0">
          {isBookCover ? (
            <CourseCoverVial
              photos={coverPhotos}
              objectFit="cover"
              objectPosition={photoObjectPosition}
              className="lecture-cover-custom-photo"
            />
          ) : isProductVialCover && vialSrc ? (
            <CourseCoverProductVial
              vialSrc={vialSrc}
              // ~80° from horizontal ≈ 10° clockwise lean (was reading closer to ~70°/20°)
              rotate={10}
              scale={variant === "panel" ? 1.1 : 1.16}
              objectPosition={variant === "panel" ? "72% 54%" : "62% 56%"}
              className="lecture-cover-custom-photo"
            />
          ) : (
            <CourseCoverLabeledVial title={title} className="lecture-cover-custom-photo" />
          )}
        </div>
        {/* Soft overlays only for non-product covers — product vials stay sharp */}
        {variant !== "panel" && !isProductVialCover ? (
          <>
            <div className="lecture-cover-art-atmosphere absolute inset-0 z-[2]" aria-hidden />
            <div className="lecture-cover-art-glow absolute inset-0 z-[3]" aria-hidden />
            <div className="lecture-cover-art-vignette-soft absolute inset-0 z-[2]" aria-hidden />
            <div className="lecture-cover-art-grain absolute inset-0 z-[4]" aria-hidden />
          </>
        ) : null}
      </div>

      {variant === "panel" ? null : (
        <div className="absolute inset-0 z-[5] flex flex-col px-5 pb-3 pt-5 sm:px-6 sm:pb-3.5 sm:pt-6">
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
        </div>
      )}
    </div>
  );
}
