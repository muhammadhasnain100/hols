"use client";

import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";

function CloudSvg({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 400 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <ellipse cx="120" cy="70" rx="90" ry="42" fill="currentColor" />
      <ellipse cx="210" cy="62" rx="110" ry="48" fill="currentColor" />
      <ellipse cx="300" cy="72" rx="85" ry="38" fill="currentColor" />
      <ellipse cx="170" cy="48" rx="70" ry="32" fill="currentColor" opacity="0.85" />
    </svg>
  );
}

export function HeroCloudBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !rootRef.current) return;

      const layers = rootRef.current.querySelectorAll("[data-cloud-layer]");

      layers.forEach((layer, index) => {
        const direction = index % 2 === 0 ? 1 : -1;
        const distance = 80 + index * 30;

        gsap.to(layer, {
          x: direction * distance,
          duration: 18 + index * 4,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });

        gsap.to(layer, {
          y: index % 2 === 0 ? -12 : 12,
          duration: 10 + index * 2,
          repeat: -1,
          yoyo: true,
          ease: "sine.inOut",
        });
      });

      gsap.to(rootRef.current.querySelector("[data-sky-glow]"), {
        scale: 1.08,
        opacity: 0.9,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    },
    { scope: rootRef },
  );

  return (
    <div
      ref={rootRef}
      className="pointer-events-none absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#8DC3E1_0%,#B8D9EE_38%,#D9EBF7_68%,#FFFFFF_100%)]"
      aria-hidden
    >
      <div
        data-sky-glow
        className="absolute left-1/2 top-[-10%] h-[55%] w-[80%] -translate-x-1/2 rounded-full bg-white/35 blur-3xl"
      />

      <div
        data-cloud-layer
        className="absolute -left-16 bottom-[18%] w-[120%] text-white/75"
      >
        <CloudSvg className="h-28 w-full md:h-36" />
      </div>

      <div
        data-cloud-layer
        className="absolute -right-24 bottom-[10%] w-[110%] text-white/55"
      >
        <CloudSvg className="h-24 w-full md:h-32" />
      </div>

      <div
        data-cloud-layer
        className="absolute -left-32 bottom-[2%] w-[130%] text-white/90"
      >
        <CloudSvg className="h-32 w-full md:h-44" />
      </div>

      <div
        data-cloud-layer
        className="absolute right-[-8%] bottom-[24%] w-[70%] text-white/40"
      >
        <CloudSvg className="h-20 w-full md:h-28" />
      </div>

      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent" />
    </div>
  );
}
