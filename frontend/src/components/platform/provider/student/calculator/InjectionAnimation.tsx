"use client";

import { useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { CalculatorReconScene } from "@/components/platform/provider/student/calculator/CalculatorReconScene";
import {
  measureDrawTargets,
  syringePositionForStopper,
} from "@/components/platform/provider/student/calculator/calculatorGeometry";
import { gsap, registerGsap } from "@/lib/gsap";
import type { MassUnit, SyringeSizeMl } from "@/lib/integrate/provider/student/calculator";
import { prefersReducedMotion } from "@/lib/motion";

type InjectionAnimationProps = {
  onComplete: () => void;
  syringeMl?: SyringeSizeMl;
  peptideUnit?: MassUnit;
};

const STATUS = [
  { label: "Positioning syringe over bacteriostatic water…", at: 0 },
  { label: "Drawing sterile water into the syringe…", at: 800 },
  { label: "Moving to the medication vial…", at: 3100 },
  { label: "Injecting water and reconstituting…", at: 4400 },
  { label: "Swirling gently to dissolve…", at: 6200 },
  { label: "Reconstitution complete", at: 7200 },
];

type SceneState = {
  waterFill: number;
  waterEmpty: boolean;
  medFill: number;
  medPowder: boolean;
  syringeFill: number;
  waterActive: boolean;
  medActive: boolean;
};

const INITIAL_SCENE: SceneState = {
  waterFill: 0.6,
  waterEmpty: false,
  medFill: 0.14,
  medPowder: true,
  syringeFill: 0,
  waterActive: true,
  medActive: false,
};

export function InjectionAnimation({
  onComplete,
  syringeMl = 1,
  peptideUnit = "mg",
}: InjectionAnimationProps) {
  const [status, setStatus] = useState(STATUS[0].label);
  const [done, setDone] = useState(false);
  const [scene, setScene] = useState<SceneState>(INITIAL_SCENE);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const syringeWrapRef = useRef<HTMLDivElement>(null);
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
      if (prefersReducedMotion() || !syringeWrapRef.current || !sceneRef.current) return;

      let tl: gsap.core.Timeline | null = null;
      let cancelled = false;

      const startTimeline = () => {
        if (cancelled || !syringeWrapRef.current || !sceneRef.current) return;

        const targets = measureDrawTargets(sceneRef.current, syringeWrapRef.current);
        if (!targets) return;

        const { water, med, needleOffset } = targets;

        const proxy = {
          stopperX: water.x,
          stopperY: water.y,
          insert: 0,
          waterFill: INITIAL_SCENE.waterFill,
          medFill: INITIAL_SCENE.medFill,
          syringeFill: INITIAL_SCENE.syringeFill,
        };

        let waterActive = true;
        let medActive = false;
        let medPowder = true;
        let waterEmpty = false;

        const syncScene = () => {
          setScene({
            waterFill: proxy.waterFill,
            waterEmpty,
            medFill: proxy.medFill,
            medPowder,
            syringeFill: proxy.syringeFill,
            waterActive,
            medActive,
          });
        };

        const moveSyringe = () => {
          const pos = syringePositionForStopper(
            { x: proxy.stopperX, y: proxy.stopperY },
            needleOffset,
            proxy.insert,
          );
          gsap.set(syringeWrapRef.current, {
            x: pos.x,
            y: pos.y,
            force3D: true,
          });
          syncScene();
        };

        tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          onComplete: () => {
            setDone(true);
            window.setTimeout(() => {
              if (!completed.current) {
                completed.current = true;
                onComplete();
              }
            }, 700);
          },
        });

        moveSyringe();

        tl
          // Lower needle through the water-vial stopper.
          .to(proxy, { insert: 30, duration: 0.7, ease: "power3.out", onUpdate: moveSyringe }, 0.2)
          // Draw sterile water: barrel fills as the vial empties.
          .to(
            proxy,
            {
              waterFill: 0.28,
              syringeFill: 0.62,
              insert: 22,
              duration: 1.7,
              ease: "power1.inOut",
              onUpdate: moveSyringe,
            },
            0.9,
          )
          // Tiny settle before withdrawing.
          .to(proxy, { insert: 26, duration: 0.14, yoyo: true, repeat: 1, ease: "sine.inOut", onUpdate: moveSyringe }, 2.6)
          // Withdraw the needle from the water vial.
          .to(proxy, { insert: 4, duration: 0.5, ease: "power2.in", onUpdate: moveSyringe }, 2.85)
          // Travel across to the medication vial.
          .to(
            proxy,
            {
              stopperX: med.x,
              stopperY: med.y,
              duration: 1.1,
              ease: "power2.inOut",
              onStart: () => {
                waterActive = false;
                waterEmpty = true;
              },
              onUpdate: moveSyringe,
            },
            3.35,
          )
          .call(
            () => {
              medActive = true;
              syncScene();
            },
            undefined,
            4.3,
          )
          // Lower needle into the medication vial.
          .to(proxy, { insert: 32, duration: 0.55, ease: "power3.out", onUpdate: moveSyringe }, 4.45)
          // Inject water: barrel empties, powder dissolves into solution.
          .to(
            proxy,
            {
              syringeFill: 0,
              medFill: 0.74,
              insert: 24,
              duration: 1.6,
              ease: "power1.inOut",
              onStart: () => {
                medPowder = false;
              },
              onUpdate: moveSyringe,
            },
            4.85,
          )
          // Swirl / mix wiggle.
          .to(proxy, { insert: 30, duration: 0.16, yoyo: true, repeat: 3, ease: "sine.inOut", onUpdate: moveSyringe }, 6.5)
          // Withdraw the needle, finished.
          .to(proxy, { insert: -6, duration: 0.6, ease: "power2.in", onUpdate: moveSyringe }, 7.0);
      };

      const frame = window.requestAnimationFrame(() => {
        window.requestAnimationFrame(startTimeline);
      });

      return () => {
        cancelled = true;
        window.cancelAnimationFrame(frame);
        tl?.kill();
      };
    },
    { scope: stageRef, dependencies: [onComplete, syringeMl, peptideUnit] },
  );

  return (
    <div className="mx-auto mt-2 w-full min-w-0 max-w-sm sm:max-w-md md:max-w-lg">
      <p
        className="mb-3 px-1 text-center text-xs font-medium text-[color:var(--dash-muted)] sm:mb-4 sm:text-[13px]"
        aria-live="polite"
      >
        {status}
      </p>

      <div
        ref={stageRef}
        className="dashboard-glass-card relative mx-auto w-full overflow-visible rounded-2xl px-2 py-3 sm:px-6 sm:py-5 md:px-8 md:py-6"
      >
        <CalculatorReconScene
          layout="draw"
          drawSyringeLarge
          sceneRef={sceneRef}
          syringeMl={syringeMl}
          syringeFill={scene.syringeFill}
          waterFill={scene.waterFill}
          waterEmpty={scene.waterEmpty}
          medFill={scene.medFill}
          medPowder={scene.medPowder}
          peptideUnit={peptideUnit}
          waterActive={scene.waterActive}
          medActive={scene.medActive}
          showSyringeFill
          syringeWrapRef={syringeWrapRef}
          instantFill
        />

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
