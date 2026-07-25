"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { landingContent } from "@/content/landing";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type HookHolsBallProps = {
  innerRef?: (node: HTMLDivElement | null) => void;
  className?: string;
};

/** Static HOLS ball hub for the Hook section diagram. */
export function HookHolsBall({ innerRef, className }: HookHolsBallProps) {
  const { hook } = landingContent;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  const setShellRef = useCallback(
    (node: HTMLDivElement | null) => {
      innerRef?.(node);
    },
    [innerRef],
  );

  return (
    <div data-hook-hub className={cn("relative flex flex-col items-center", className)}>
      <div
        ref={setShellRef}
        data-hook-ball
        className="relative z-10 flex aspect-square w-[150px] select-none items-center justify-center sm:w-[180px] md:w-[210px]"
      >
        <div
          className={cn(
            "relative z-10 h-full w-full",
            !reduceMotion && "hook-hols-ball-float",
          )}
        >
          <Image
            src="/assets/ball/ball.png"
            alt=""
            width={480}
            height={480}
            draggable={false}
            className="relative z-10 h-full w-full object-contain"
            sizes="(min-width: 768px) 210px, (min-width: 640px) 180px, 150px"
            priority
          />
        </div>
      </div>

      <div className="pointer-events-none absolute top-full left-1/2 mt-3 w-max -translate-x-1/2 text-center">
        <p className="font-sans text-lg font-bold tracking-[0.04em] text-primary">{hook.hubLabel}</p>
      </div>
    </div>
  );
}
