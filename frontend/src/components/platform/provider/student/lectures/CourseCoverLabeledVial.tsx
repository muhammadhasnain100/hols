"use client";

import { coverPeptideName } from "@/components/platform/provider/student/lectures/courseCover";
import { cn } from "@/lib/utils";

const TEMPLATE_LIGHT = "/assets/lectures/vial-cover-template-light.png";
const TEMPLATE_DARK = "/assets/lectures/vial-cover-template-dark.png";

type CourseCoverLabeledVialProps = {
  title: string;
  className?: string;
};

/** Premium HOLS vial template — peptide name rendered dynamically (no dose/measurement). */
export function CourseCoverLabeledVial({ title, className }: CourseCoverLabeledVialProps) {
  const peptideName = coverPeptideName(title);
  const compact = peptideName.length > 18;
  const tiny = peptideName.length > 26;

  return (
    <div
      className={cn("lecture-cover-labeled-vial relative h-full w-full overflow-hidden", className)}
      data-peptide-name={peptideName}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={TEMPLATE_LIGHT}
        alt=""
        draggable={false}
        decoding="async"
        className="lecture-cover-labeled-vial-photo lecture-cover-labeled-vial-photo--light absolute inset-0 h-full w-full object-cover object-[center_42%]"
        aria-hidden
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={TEMPLATE_DARK}
        alt=""
        draggable={false}
        decoding="async"
        className="lecture-cover-labeled-vial-photo lecture-cover-labeled-vial-photo--dark absolute inset-0 h-full w-full object-cover object-[center_42%]"
        aria-hidden
      />

      {/* Masks baked template name + dose; renders live peptide title */}
      <div
        className={cn(
          "lecture-cover-labeled-vial-name pointer-events-none absolute z-[2] font-sans font-semibold leading-none tracking-[-0.02em] text-white",
          compact && "lecture-cover-labeled-vial-name--compact",
          tiny && "lecture-cover-labeled-vial-name--tiny",
        )}
        aria-hidden
      >
        <span className="lecture-cover-labeled-vial-name-mask" aria-hidden />
        <span className="lecture-cover-labeled-vial-name-text">{peptideName}</span>
      </div>
    </div>
  );
}
