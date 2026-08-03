"use client";

import { type CSSProperties } from "react";
import { CourseCoverLabeledVial } from "@/components/platform/provider/student/lectures/CourseCoverLabeledVial";
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
 * HOLS-branded lecture cover — book/manual art or labeled vial template with dynamic peptide name.
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
    isCustom: customCover,
    coverId,
    objectPosition: coverObjectPosition = "center center",
    layout: coverLayout,
  } = resolveCourseCover(courseId, title);

  const isBookCover = customCover && coverLayout === "book";
  const isCustomVialCover = customCover && coverLayout !== "book";
  const useLabeledVial = !isBookCover && !isCustomVialCover;
  const useFullBleedPhoto = !useLabeledVial;
  const photoObjectPosition =
    variant === "panel" && isCustomVialCover
      ? shiftCoverObjectPositionForPanel(coverObjectPosition)
      : coverObjectPosition;

  return (
    <div
      className={cn(
        "lecture-cover-art pointer-events-none absolute inset-0 overflow-hidden",
        useFullBleedPhoto && "lecture-cover-art--full-bleed",
        (isBookCover || isCustomVialCover) && "lecture-cover-art--custom-photo",
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
          {isBookCover || isCustomVialCover ? (
            <CourseCoverVial
              photos={coverPhotos}
              objectFit="cover"
              objectPosition={photoObjectPosition}
              className="lecture-cover-custom-photo"
            />
          ) : (
            <CourseCoverLabeledVial title={title} className="lecture-cover-custom-photo" />
          )}
        </div>
      </div>

      {variant === "panel" ? null : (
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

            <div
              className={cn(
                "lecture-cover-art-card-text mt-auto min-w-0",
                isCustomVialCover
                  ? "lecture-cover-art-card-text--custom-vial"
                  : "max-w-[14.5rem] sm:max-w-[15.25rem]",
              )}
            >
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
