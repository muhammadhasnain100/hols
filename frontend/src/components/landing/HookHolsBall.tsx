"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { landingContent } from "@/content/landing";
import { prefersReducedMotion } from "@/lib/motion";
import { useSmoothScroll } from "@/providers/SmoothScrollProvider";
import { cn } from "@/lib/utils";

type HookHolsBallProps = {
  innerRef?: (node: HTMLDivElement | null) => void;
  className?: string;
};

/**
 * Free 3D orbit of the HOLS ball via cursor drag.
 * Cursor stays the default arrow (static). Rotation persists after release.
 */
export function HookHolsBall({ innerRef, className }: HookHolsBallProps) {
  const { hook } = landingContent;
  const { setPaused } = useSmoothScroll();
  const tiltRef = useRef<HTMLDivElement>(null);
  const shellRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const rotationRef = useRef({ x: -8, y: 18 });
  const velocityRef = useRef({ x: 0, y: 0 });
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const draggingRef = useRef(false);
  const [dragging, setDragging] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    setReduceMotion(prefersReducedMotion());
  }, []);

  const applyRotation = useCallback(() => {
    const node = tiltRef.current;
    if (!node) return;
    const { x, y } = rotationRef.current;
    node.style.transform = `rotateX(${x}deg) rotateY(${y}deg)`;
  }, []);

  const tickInertia = useCallback(() => {
    if (draggingRef.current || reduceMotion) {
      rafRef.current = null;
      return;
    }

    const velocity = velocityRef.current;
    velocity.x *= 0.92;
    velocity.y *= 0.92;

    if (Math.abs(velocity.x) < 0.02 && Math.abs(velocity.y) < 0.02) {
      velocity.x = 0;
      velocity.y = 0;
      rafRef.current = null;
      return;
    }

    rotationRef.current.y += velocity.x;
    rotationRef.current.x = Math.max(-85, Math.min(85, rotationRef.current.x + velocity.y));
    applyRotation();
    rafRef.current = window.requestAnimationFrame(tickInertia);
  }, [applyRotation, reduceMotion]);

  useEffect(() => {
    applyRotation();
    return () => {
      if (rafRef.current != null) window.cancelAnimationFrame(rafRef.current);
    };
  }, [applyRotation]);

  const setShellRef = useCallback(
    (node: HTMLDivElement | null) => {
      shellRef.current = node;
      innerRef?.(node);
    },
    [innerRef],
  );

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion) return;
    event.preventDefault();
    event.stopPropagation();
    draggingRef.current = true;
    setDragging(true);
    setPaused(true);
    velocityRef.current = { x: 0, y: 0 };
    lastPointerRef.current = { x: event.clientX, y: event.clientY };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (rafRef.current != null) {
      window.cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current || !lastPointerRef.current) return;
    event.preventDefault();
    event.stopPropagation();

    const dx = event.clientX - lastPointerRef.current.x;
    const dy = event.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: event.clientX, y: event.clientY };

    // Horizontal drag spins around Y; vertical around X (inspect the sphere).
    rotationRef.current.y += dx * 0.55;
    rotationRef.current.x = Math.max(-85, Math.min(85, rotationRef.current.x - dy * 0.45));
    velocityRef.current = { x: dx * 0.35, y: -dy * 0.28 };
    applyRotation();
  }

  function onPointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    setPaused(false);
    lastPointerRef.current = null;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      // already released
    }
    if (!reduceMotion) {
      rafRef.current = window.requestAnimationFrame(tickInertia);
    }
  }

  return (
    <div data-hook-hub className={cn("relative flex flex-col items-center", className)}>
      <div
        ref={setShellRef}
        data-hook-ball
        className="pointer-events-auto relative z-10 flex aspect-square w-[120px] touch-none select-none items-center justify-center sm:w-[140px] md:w-[160px]"
        style={{
          perspective: reduceMotion ? undefined : "1100px",
          cursor: "default",
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-[-34%] rounded-full blur-2xl transition duration-500",
            "bg-[radial-gradient(circle_at_30%_25%,rgba(141,195,225,0.55)_0%,transparent_55%),radial-gradient(circle_at_75%_70%,rgba(221,228,102,0.32)_0%,transparent_52%)]",
            dragging ? "scale-110 opacity-100" : "scale-100 opacity-80",
          )}
        />

        <div
          aria-hidden
          className={cn(
            "pointer-events-none absolute inset-[-6%] rounded-full border transition duration-500",
            dragging
              ? "border-[#DDE466]/55 shadow-[0_0_48px_rgba(221,228,102,0.35)]"
              : "border-[#8DC3E1]/35 shadow-[0_0_40px_rgba(141,195,225,0.25)]",
          )}
        />

        <div
          className={cn(
            "relative z-10 h-full w-full",
            !reduceMotion && !dragging && "hook-hols-ball-float",
          )}
        >
          <div
            ref={tiltRef}
            className="relative h-full w-full will-change-transform"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Fake depth: back halo sits behind the PNG */}
            <div
              aria-hidden
              className="absolute inset-[12%] rounded-full bg-[radial-gradient(circle_at_50%_45%,rgba(56,83,164,0.35),transparent_70%)]"
              style={{ transform: "translateZ(-28px)" }}
            />

            <Image
              src="/assets/ball/ball.png"
              alt=""
              width={480}
              height={480}
              draggable={false}
              className={cn(
                "relative z-10 h-full w-full object-contain drop-shadow-[0_22px_40px_rgba(11,31,58,0.35)] transition-[filter] duration-300",
                dragging && "brightness-110 saturate-125",
              )}
              sizes="160px"
              priority
            />

            {/* Fixed highlight (does not chase the cursor) */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-[10%] rounded-full mix-blend-soft-light"
              style={{
                opacity: 0.4,
                background:
                  "radial-gradient(circle at 32% 28%, rgba(255,255,255,0.65) 0%, rgba(255,255,255,0.12) 30%, transparent 58%)",
                transform: "translateZ(18px)",
              }}
            />

            <div
              aria-hidden
              className="pointer-events-none absolute right-[14%] top-[18%] h-6 w-6 rounded-full bg-[#DDE466]/45 blur-md sm:h-7 sm:w-7"
              style={{ transform: "translateZ(24px)", opacity: dragging ? 0.95 : 0.55 }}
            />
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute top-full left-1/2 mt-3 w-max -translate-x-1/2 text-center">
        <p className="font-sans text-lg font-bold tracking-[0.04em] text-primary">{hook.hubLabel}</p>
        <p className="mt-1 font-sans text-[10px] font-medium tracking-[0.04em] text-primary/45">
          Drag to rotate
        </p>
      </div>
    </div>
  );
}
