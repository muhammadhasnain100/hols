"use client";

import { type CSSProperties } from "react";
import { cn } from "@/lib/utils";

const MODE_LIGHT = "/assets/lectures/mode/light.png";
const MODE_DARK = "/assets/lectures/mode/dark.png";

type CourseCoverProductVialProps = {
  /** Transparent product vial PNG (same art for light + dark). */
  vialSrc: string;
  /** Degrees of editorial tilt (positive = clockwise / lean right). */
  rotate?: number;
  /** Extra product scale for close framing. */
  scale?: number;
  /** CSS object-position for the vial within its stage. */
  objectPosition?: string;
  className?: string;
};

/**
 * Theme mode background (light/dark) + full-quality transparent vial overlay.
 * Vial is staged with a gentle rightward product tilt for an editorial look.
 */
export function CourseCoverProductVial({
  vialSrc,
  rotate = 10,
  scale = 1.16,
  objectPosition = "62% 56%",
  className,
}: CourseCoverProductVialProps) {
  const vialStyle = {
    "--product-vial-rotate": `${rotate}deg`,
    "--product-vial-scale": String(scale),
    "--product-vial-x": "11%",
    "--product-vial-y": "6%",
    objectPosition,
  } as CSSProperties;

  return (
    <div
      className={cn("lecture-cover-product-vial relative h-full w-full overflow-hidden", className)}
      data-vial-src={vialSrc}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MODE_LIGHT}
        alt=""
        draggable={false}
        decoding="async"
        className="lecture-cover-product-mode lecture-cover-product-mode--light absolute inset-0 h-full w-full object-cover object-center"
        aria-hidden
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={MODE_DARK}
        alt=""
        draggable={false}
        decoding="async"
        className="lecture-cover-product-mode lecture-cover-product-mode--dark absolute inset-0 h-full w-full object-cover object-center"
        aria-hidden
      />

      <div className="lecture-cover-product-vial-stage absolute inset-0 z-[1]" aria-hidden>
        {/* Soft ground shadow under the tilted vial (not a blur on the PNG) */}
        <span className="lecture-cover-product-vial-shadow" aria-hidden />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={vialSrc}
          alt=""
          draggable={false}
          decoding="async"
          className="lecture-cover-product-vial-img"
          style={vialStyle}
          aria-hidden
        />
      </div>
    </div>
  );
}
