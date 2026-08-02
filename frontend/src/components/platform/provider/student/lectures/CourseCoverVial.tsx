import {
  VIAL_PHOTO_DARK,
  VIAL_PHOTO_LIGHT,
} from "@/components/platform/provider/student/lectures/courseCover";
import { cn } from "@/lib/utils";

type CourseCoverVialProps = {
  objectPosition?: string;
  /** Always contain in practice — keeps the full vial silhouette visible. */
  objectFit?: "cover" | "contain";
  opacity?: number;
  className?: string;
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
}: CourseCoverVialProps) {
  const style = { objectPosition, opacity };

  return (
    <div className={cn("lecture-cover-vial relative h-full w-full", className)}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={VIAL_PHOTO_LIGHT}
        alt=""
        draggable={false}
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
        src={VIAL_PHOTO_DARK}
        alt=""
        draggable={false}
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
