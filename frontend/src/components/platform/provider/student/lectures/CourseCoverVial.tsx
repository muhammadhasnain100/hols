"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type CourseCoverPhotos,
  getCourseCoverPhotos,
  VIAL_PHOTO_DARK,
  VIAL_PHOTO_LIGHT,
} from "@/components/platform/provider/student/lectures/courseCover";
import { cn } from "@/lib/utils";

const DEFAULT_VIAL_PHOTOS: CourseCoverPhotos = {
  light: VIAL_PHOTO_LIGHT,
  dark: VIAL_PHOTO_DARK,
};

type CourseCoverVialProps = {
  objectPosition?: string;
  /** Always contain in practice — keeps the full vial silhouette visible. */
  objectFit?: "cover" | "contain";
  opacity?: number;
  className?: string;
  /** Override default HOLS vial photos (e.g. per-lecture Magnific art). */
  photos?: CourseCoverPhotos;
};

/**
 * HOLS-branded product photo vial — theme-specific studio PNGs.
 * Sized by the parent stage; contain keeps silhouette coherent while stage/scale zoom in.
 */
export function CourseCoverVial({
  objectPosition = "50% 50%",
  objectFit = "contain",
  opacity = 1,
  className,
  photos,
}: CourseCoverVialProps) {
  const requestedPhotos = photos ?? getCourseCoverPhotos();
  const isCustom = Boolean(
    photos &&
      (photos.light !== DEFAULT_VIAL_PHOTOS.light || photos.dark !== DEFAULT_VIAL_PHOTOS.dark),
  );
  const [activePhotos, setActivePhotos] = useState(requestedPhotos);

  useEffect(() => {
    setActivePhotos(requestedPhotos);
  }, [requestedPhotos.dark, requestedPhotos.light]);

  const handlePhotoError = useCallback(() => {
    if (isCustom) {
      setActivePhotos(DEFAULT_VIAL_PHOTOS);
    }
  }, [isCustom]);

  const { light, dark } = activePhotos;
  const style = { objectPosition, opacity };

  return (
    <div className={cn("lecture-cover-vial relative h-full w-full", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={light}
        alt=""
        draggable={false}
        decoding="async"
        onError={handlePhotoError}
        className={cn(
          "lecture-cover-vial-photo lecture-cover-vial-photo--light absolute inset-0 h-full w-full",
          objectFit === "contain"
            ? "lecture-cover-vial-photo-contain"
            : "lecture-cover-vial-photo-cover",
        )}
        style={style}
        aria-hidden
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={dark}
        alt=""
        draggable={false}
        decoding="async"
        onError={handlePhotoError}
        className={cn(
          "lecture-cover-vial-photo lecture-cover-vial-photo--dark absolute inset-0 h-full w-full",
          objectFit === "contain"
            ? "lecture-cover-vial-photo-contain"
            : "lecture-cover-vial-photo-cover",
        )}
        style={style}
        aria-hidden
      />
    </div>
  );
}
