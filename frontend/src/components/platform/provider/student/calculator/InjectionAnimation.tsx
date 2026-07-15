"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

type InjectionAnimationProps = {
  onComplete: () => void;
};

const STATUS = [
  { label: "Positioning over bacteriostatic water…", at: 0 },
  { label: "Drawing sterile water into syringe…", at: 1100 },
  { label: "Transferring to medication vial…", at: 2800 },
  { label: "Injecting and mixing peptide…", at: 4200 },
  { label: "Reconstitution complete", at: 6000 },
];

export function InjectionAnimation({ onComplete }: InjectionAnimationProps) {
  const [status, setStatus] = useState(STATUS[0].label);
  const [done, setDone] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const syringeRef = useRef<SVGGElement>(null);
  const syringeLiquidRef = useRef<SVGRectElement>(null);
  const plungerRef = useRef<SVGGElement>(null);
  const waterLiquidRef = useRef<SVGRectElement>(null);
  const medLiquidRef = useRef<SVGRectElement>(null);
  const waterGlowRef = useRef<HTMLDivElement>(null);
  const medGlowRef = useRef<HTMLDivElement>(null);
  const dropletRef = useRef<HTMLDivElement>(null);
  const completed = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      const statusTimer = window.setTimeout(() => setStatus("Preparing dose calculation…"), 0);
      const timer = window.setTimeout(() => {
        if (!completed.current) {
          completed.current = true;
          onComplete();
        }
      }, 320);
      return () => {
        window.clearTimeout(statusTimer);
        window.clearTimeout(timer);
      };
    }

    const timers = STATUS.map((item) =>
      window.setTimeout(() => setStatus(item.label), item.at),
    );
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [onComplete]);

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !syringeRef.current) return;

      const syringe = syringeRef.current;
      const syringeLiquid = syringeLiquidRef.current;
      const plunger = plungerRef.current;
      const waterLiquid = waterLiquidRef.current;
      const medLiquid = medLiquidRef.current;
      const waterGlow = waterGlowRef.current;
      const medGlow = medGlowRef.current;
      const droplet = dropletRef.current;

      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        onComplete: () => {
          setDone(true);
          window.setTimeout(() => {
            if (!completed.current) {
              completed.current = true;
              onComplete();
            }
          }, 750);
        },
      });

      gsap.set(syringe, {
        x: -125,
        y: -24,
        rotate: -1,
        transformOrigin: "50% 50%",
        opacity: 1,
      });
      gsap.set(syringeLiquid, { attr: { y: 134, height: 8 } });
      gsap.set(plunger, { y: 0 });
      gsap.set(waterLiquid, { attr: { y: 274, height: 44 } });
      gsap.set(medLiquid, { attr: { y: 312, height: 6 } });
      gsap.set(waterGlow, { opacity: 0 });
      gsap.set(medGlow, { opacity: 0 });
      gsap.set(droplet, { opacity: 0, y: 0, scale: 0.4 });

      tl.to(waterGlow, { opacity: 1, duration: 0.45 }, 0)
        .to(syringe, { y: 14, rotate: 0, duration: 0.9, ease: "power3.out" }, 0.15)
        .to(syringeLiquid, { attr: { y: 82, height: 60 }, duration: 1.35, ease: "power1.inOut" }, 1.08)
        .to(plunger, { y: -26, duration: 1.35, ease: "power1.inOut" }, 1.08)
        .to(waterLiquid, { attr: { y: 296, height: 22 }, duration: 1.35, ease: "power1.inOut" }, 1.08)
        .to(syringe, { y: 18, duration: 0.18, yoyo: true, repeat: 1 }, 1.28)
        .to(syringe, { y: -28, rotate: -1, duration: 0.55 }, 2.55)
        .to(waterGlow, { opacity: 0, duration: 0.35 }, 2.6)
        .to(syringe, { x: 125, rotate: 1, duration: 1.05 }, 3.1)
        .to(medGlow, { opacity: 1, duration: 0.4 }, 3.75)
        .to(syringe, { y: 12, rotate: 0, duration: 0.55 }, 4.15)
        .to(droplet, { opacity: 1, scale: 1, duration: 0.18 }, 4.65)
        .to(droplet, { y: 28, opacity: 0, scale: 0.5, duration: 0.5 }, 4.8)
        .to(syringeLiquid, { attr: { y: 132, height: 10 }, duration: 1.25, ease: "power1.inOut" }, 4.7)
        .to(plunger, { y: 0, duration: 1.25, ease: "power1.inOut" }, 4.7)
        .to(medLiquid, { attr: { y: 280, height: 38 }, duration: 1.25, ease: "power1.inOut" }, 4.7)
        .to(syringe, { y: -30, rotate: -1, duration: 0.55 }, 6.1)
        .to(medGlow, { scale: 1.12, duration: 0.3, yoyo: true, repeat: 3 }, 6.1)
        .to(syringe, { opacity: 0.92, duration: 0.35 }, 7.2);

      return () => {
        tl.kill();
      };
    },
    { scope: stageRef, dependencies: [onComplete] },
  );

  return (
    <div className="mx-auto mt-2 w-full max-w-2xl">
      <p className="mb-4 text-center text-[13px] font-medium text-primary" aria-live="polite">
        {status}
      </p>

      <div
        ref={stageRef}
        className="relative mx-auto h-[340px] w-full overflow-hidden rounded-[1.75rem] border border-[#D9ECEA] bg-[#F7FCFC] sm:h-[400px]"
      >
        <div
          className="pointer-events-none absolute inset-x-[12%] bottom-8 h-8 rounded-[100%] bg-[#153238]/8 blur-xl"
          aria-hidden
        />

        <div
          ref={dropletRef}
          className="pointer-events-none absolute left-[71%] top-[48%] z-20 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#88D8E8] opacity-0 shadow-[0_0_10px_rgba(136,216,232,0.55)]"
          aria-hidden
        />

        <svg viewBox="0 0 600 360" className="absolute inset-0 h-full w-full" role="img" aria-label="Syringe drawing liquid from vial and injecting medication vial">
          <defs>
            <linearGradient id="calcLiquid" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#EFFFFA" />
              <stop offset="100%" stopColor="#88D8E8" />
            </linearGradient>
            <linearGradient id="calcGlass" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
              <stop offset="54%" stopColor="#E9F7F8" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#C8EBEE" stopOpacity="0.75" />
            </linearGradient>
            <clipPath id="waterVialClip">
              <path d="M104 224 Q104 236 96 244 L96 317 Q96 330 109 330 H183 Q196 330 196 317 V244 Q188 236 188 224 Z" />
            </clipPath>
            <clipPath id="medVialClip">
              <path d="M404 224 Q404 236 396 244 L396 317 Q396 330 409 330 H483 Q496 330 496 317 V244 Q488 236 488 224 Z" />
            </clipPath>
            <clipPath id="syringeClip">
              <rect x="282" y="72" width="36" height="74" rx="7" />
            </clipPath>
          </defs>

          <VialSvg
            x={86}
            label="Bacteriostatic water"
            clipId="waterVialClip"
            glowRef={waterGlowRef}
            liquidRef={waterLiquidRef}
          />
          <VialSvg
            x={386}
            label="Medication vial"
            clipId="medVialClip"
            glowRef={medGlowRef}
            liquidRef={medLiquidRef}
          />

          <g ref={syringeRef} className="drop-shadow-[0_18px_20px_rgba(21,50,56,0.12)]">
            <g ref={plungerRef}>
              <line x1="300" y1="20" x2="300" y2="54" stroke="#153238" strokeWidth="4" strokeLinecap="round" />
              <line x1="282" y1="20" x2="318" y2="20" stroke="#153238" strokeWidth="4" strokeLinecap="round" />
            </g>
            <rect x="278" y="54" width="44" height="11" rx="4" fill="#F7FCFC" stroke="#153238" strokeWidth="4" />
            <rect x="282" y="65" width="36" height="86" rx="9" fill="url(#calcGlass)" stroke="#153238" strokeWidth="4" />
            <g clipPath="url(#syringeClip)">
              <rect ref={syringeLiquidRef} x="283" y="134" width="34" height="8" fill="url(#calcLiquid)" />
              <circle cx="295" cy="103" r="2" fill="#2E6670" opacity="0.75" />
              <circle cx="309" cy="118" r="1.8" fill="#2E6670" opacity="0.7" />
            </g>
            <line x1="286" y1="76" x2="296" y2="76" stroke="#153238" strokeWidth="1.5" />
            <line x1="286" y1="86" x2="292" y2="86" stroke="#153238" strokeWidth="1.5" />
            <line x1="286" y1="96" x2="296" y2="96" stroke="#153238" strokeWidth="1.5" />
            <line x1="286" y1="106" x2="292" y2="106" stroke="#153238" strokeWidth="1.5" />
            <line x1="286" y1="116" x2="296" y2="116" stroke="#153238" strokeWidth="1.5" />
            <line x1="286" y1="126" x2="292" y2="126" stroke="#153238" strokeWidth="1.5" />
            <line x1="300" y1="151" x2="300" y2="168" stroke="#153238" strokeWidth="4" strokeLinecap="round" />
            <line x1="300" y1="168" x2="300" y2="205" stroke="#153238" strokeWidth="2" strokeLinecap="round" />
          </g>
        </svg>

        {done ? (
          <div className="absolute inset-x-0 bottom-3 flex justify-center">
            <span className="rounded-full bg-[#5BA8A6]/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#3D8A87]">
              Ready
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function VialSvg({
  x,
  label,
  clipId,
  glowRef,
  liquidRef,
}: {
  x: number;
  label: string;
  clipId: string;
  glowRef: RefObject<HTMLDivElement | null>;
  liquidRef: RefObject<SVGRectElement | null>;
}) {
  return (
    <g transform={`translate(${x} 0)`}>
      <foreignObject x="-8" y="210" width="132" height="132">
        <div
          ref={glowRef}
          className={cn("h-full w-full rounded-full bg-[#9ED6D4]/35 opacity-0 blur-2xl")}
        />
      </foreignObject>
      <rect x="16" y="216" width="88" height="14" rx="5" fill="#F7FCFC" stroke="#153238" strokeWidth="4" />
      <path
        d="M32 230 Q32 240 24 248 L24 317 Q24 330 37 330 H111 Q124 330 124 317 V248 Q116 240 116 230 Z"
        fill="url(#calcGlass)"
        stroke="#153238"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <g clipPath={`url(#${clipId})`}>
        <rect ref={liquidRef} x="25" y="274" width="98" height="44" fill="url(#calcLiquid)" />
        <path d="M25 274 Q74 266 123 274" fill="none" stroke="#EFFFFA" strokeWidth="5" opacity="0.9" />
      </g>
      <rect x="32" y="264" width="84" height="34" fill="#FFF1B8" opacity="0.78" />
      <text x="39" y="279" fill="#153238" fontSize="7" fontWeight="700">
        {label === "Medication vial" ? "MEDICATION" : "BACTERIOSTATIC"}
      </text>
      <text x="39" y="288" fill="#153238" fontSize="7" fontWeight="700">
        {label === "Medication vial" ? "VIAL" : "WATER"}
      </text>
      <text x="60" y="350" textAnchor="middle" fill="#153238" opacity="0.5" fontSize="11" fontWeight="700">
        {label === "Medication vial" ? "Peptide" : "Water"}
      </text>
    </g>
  );
}
