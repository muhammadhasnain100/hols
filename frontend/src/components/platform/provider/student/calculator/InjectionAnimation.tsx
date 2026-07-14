"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap, registerGsap } from "@/lib/gsap";
import { prefersReducedMotion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SYRINGE_SRC = "/assets/calculator/syringe-clear.png";
const VIAL_SRC = "/assets/calculator/vial-clear.png";

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
  const syringeRef = useRef<HTMLDivElement>(null);
  const syringeLiquidRef = useRef<HTMLDivElement>(null);
  const waterLiquidRef = useRef<HTMLDivElement>(null);
  const medLiquidRef = useRef<HTMLDivElement>(null);
  const waterGlowRef = useRef<HTMLDivElement>(null);
  const medGlowRef = useRef<HTMLDivElement>(null);
  const dropletRef = useRef<HTMLDivElement>(null);
  const completed = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setStatus("Preparing dose calculation…");
      const timer = window.setTimeout(() => {
        if (!completed.current) {
          completed.current = true;
          onComplete();
        }
      }, 320);
      return () => window.clearTimeout(timer);
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
        xPercent: -50,
        left: "22%",
        top: "2%",
        rotate: -4,
        scale: 1,
        opacity: 1,
      });
      gsap.set(syringeLiquid, { height: "8%" });
      gsap.set(waterLiquid, { height: "72%" });
      gsap.set(medLiquid, { height: "10%" });
      gsap.set(waterGlow, { opacity: 0 });
      gsap.set(medGlow, { opacity: 0 });
      gsap.set(droplet, { opacity: 0, y: 0, scale: 0.4 });

      tl.to(waterGlow, { opacity: 1, duration: 0.45 }, 0)
        .to(syringe, { top: "13%", rotate: -2, duration: 0.95, ease: "power3.out" }, 0.15)
        .to(syringeLiquid, { height: "78%", duration: 1.4, ease: "power1.inOut" }, 1.1)
        .to(waterLiquid, { height: "40%", duration: 1.4, ease: "power1.inOut" }, 1.1)
        .to(syringe, { y: 5, duration: 0.18, yoyo: true, repeat: 1 }, 1.25)
        .to(syringe, { top: "0%", y: 0, rotate: 0, duration: 0.55 }, 2.6)
        .to(waterGlow, { opacity: 0, duration: 0.35 }, 2.6)
        .to(syringe, { left: "78%", rotate: 4, duration: 1.05 }, 3.1)
        .to(medGlow, { opacity: 1, duration: 0.4 }, 3.75)
        .to(syringe, { top: "13%", rotate: 2, duration: 0.55 }, 4.15)
        .to(droplet, { opacity: 1, scale: 1, duration: 0.18 }, 4.65)
        .to(droplet, { y: 30, opacity: 0, scale: 0.45, duration: 0.5 }, 4.8)
        .to(syringeLiquid, { height: "10%", duration: 1.3, ease: "power1.inOut" }, 4.7)
        .to(medLiquid, { height: "68%", duration: 1.3, ease: "power1.inOut" }, 4.7)
        .to(syringe, { top: "1%", rotate: 0, duration: 0.55 }, 6.1)
        .to(medGlow, { scale: 1.12, duration: 0.3, yoyo: true, repeat: 3 }, 6.1)
        .to(syringe, { scale: 0.97, duration: 0.35 }, 7.2);

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
        className="relative mx-auto h-[340px] w-full overflow-hidden rounded-[1.75rem] border border-[#9ED6D4]/35 bg-[radial-gradient(ellipse_at_50%_0%,#F4FBFA_0%,#FFFFFF_52%,#EAF6F5_100%)] sm:h-[400px]"
      >
        <div
          className="pointer-events-none absolute inset-x-[12%] bottom-6 h-8 rounded-[100%] bg-[#5BA8A6]/10 blur-xl"
          aria-hidden
        />

        <VialSlot
          label="Water"
          glowRef={waterGlowRef}
          liquidRef={waterLiquidRef}
          liquidClass="from-[#7DD3FC]/75 to-[#0EA5E9]/90"
          filterClass="hue-rotate-[14deg] saturate-[1.08]"
          side="left"
          initialFill="72%"
        />

        <VialSlot
          label="Peptide"
          glowRef={medGlowRef}
          liquidRef={medLiquidRef}
          liquidClass="from-[#A7F3D0]/70 to-[#14B8A6]/90"
          filterClass="hue-rotate-[-4deg] saturate-[1.06]"
          side="right"
          initialFill="10%"
        />

        <div
          ref={dropletRef}
          className="pointer-events-none absolute left-[78%] top-[40%] z-20 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-[#F472B6] opacity-0 shadow-[0_0_10px_rgba(244,114,182,0.55)]"
          aria-hidden
        />

        <div
          ref={syringeRef}
          className="absolute z-30 w-[4.75rem] sm:w-[5.5rem]"
          style={{ left: "22%", top: "2%" }}
        >
          <div className="relative mx-auto aspect-[124/546] w-full">
            <Image
              src={SYRINGE_SRC}
              alt="Syringe"
              fill
              priority
              sizes="88px"
              className="object-contain drop-shadow-[0_16px_24px_rgba(91,168,166,0.28)]"
            />
            {/* Barrel liquid zone (needle at top of asset) */}
            <div
              className="pointer-events-none absolute left-1/2 top-[17%] h-[36%] w-[44%] -translate-x-1/2 overflow-hidden rounded-[3px]"
              aria-hidden
            >
              <div
                ref={syringeLiquidRef}
                className="relative w-full overflow-hidden bg-gradient-to-b from-[#FDA4D4] via-[#F472B6] to-[#DB2777]"
                style={{ height: "8%" }}
              >
                <span className="absolute left-[22%] top-[18%] h-1 w-1 rounded-full bg-white/85" />
                <span className="absolute left-[58%] top-[42%] h-1.5 w-1.5 rounded-full bg-white/75" />
                <span className="absolute left-[35%] top-[68%] h-1 w-1 rounded-full bg-white/80" />
              </div>
            </div>
          </div>
        </div>

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

function VialSlot({
  label,
  glowRef,
  liquidRef,
  liquidClass,
  filterClass,
  side,
  initialFill,
}: {
  label: string;
  glowRef: RefObject<HTMLDivElement | null>;
  liquidRef: RefObject<HTMLDivElement | null>;
  liquidClass: string;
  filterClass: string;
  side: "left" | "right";
  initialFill: string;
}) {
  return (
    <div
      className={cn(
        "absolute bottom-10 w-[28%] max-w-[7.25rem] sm:bottom-12 sm:max-w-[8.5rem]",
        side === "left" ? "left-[8%] sm:left-[10%]" : "right-[8%] sm:right-[10%]",
      )}
    >
      <div className="relative mx-auto aspect-[180/438] w-full">
        <div
          ref={glowRef}
          className="pointer-events-none absolute -inset-3 rounded-full bg-[#9ED6D4]/35 opacity-0 blur-2xl"
          aria-hidden
        />
        <Image
          src={VIAL_SRC}
          alt={label}
          fill
          sizes="136px"
          className={cn(
            "object-contain drop-shadow-[0_14px_22px_rgba(107,154,147,0.22)]",
            filterClass,
          )}
        />
        <div
          className="pointer-events-none absolute bottom-[11%] left-1/2 h-[55%] w-[50%] -translate-x-1/2 overflow-hidden rounded-b-[1.2rem]"
          aria-hidden
        >
          <div
            ref={liquidRef}
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-gradient-to-b mix-blend-multiply",
              liquidClass,
            )}
            style={{ height: initialFill }}
          />
        </div>
      </div>
      <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-[0.14em] text-primary/45">
        {label}
      </p>
    </div>
  );
}
