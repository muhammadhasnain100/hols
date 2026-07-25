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
          aria-hidden
          className="pointer-events-none absolute inset-[-34%] rounded-full bg-[radial-gradient(circle_at_30%_25%,rgba(141,195,225,0.55)_0%,transparent_55%),radial-gradient(circle_at_75%_70%,rgba(221,228,102,0.32)_0%,transparent_52%)] opacity-80 blur-2xl"
        />

        <div
          aria-hidden
          className="pointer-events-none absolute inset-[-6%] rounded-full border border-[#8DC3E1]/35 shadow-[0_0_40px_rgba(141,195,225,0.25)]"
        />

        <div
          className={cn(
            "relative z-10 h-full w-full",
            !reduceMotion && "hook-hols-ball-float",
          )}
        >
          <div className="relative h-full w-full">
            <div
              aria-hidden
              className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(56,83,164,0.35),transparent_70%)]"
            />

            <Image
              src="/assets/ball/ball.png"
              alt=""
              width={480}
              height={480}
              draggable={false}
              className="relative z-10 h-full w-full object-contain drop-shadow-[0_22px_40px_rgba(11,31,58,0.35)]"
              sizes="(min-width: 768px) 210px, (min-width: 640px) 180px, 150px"
              priority
            />

            <div
              aria-hidden
              className="pointer-events-none absolute inset-[10%] rounded-full mix-blend-soft-light"
              style={{
                opacity: 0.4,
                background:
                  "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.12) 30%, transparent 58%)",
              }}
            />

            <div
              aria-hidden
              className="pointer-events-none absolute right-[14%] top-[18%] h-6 w-6 rounded-full bg-[#DDE466]/45 opacity-55 blur-md sm:h-7 sm:w-7"
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute top-full left-1/2 mt-3 w-max -translate-x-1/2 text-center">
        <p className="font-sans text-lg font-bold tracking-[0.04em] text-primary">{hook.hubLabel}</p>
      </div>
    </div>
  );
}
