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
  { label: "Drawing sterile water into syringe…", at: 900 },
  { label: "Moving to medication vial…", at: 2900 },
  { label: "Injecting water and mixing medication…", at: 4300 },
  { label: "Reconstitution complete", at: 6300 },
];

type SceneState = {
  waterFill: number;
  waterEmpty: boolean;
  medFill: number;
  medPowder: boolean;
  waterActive: boolean;
  medActive: boolean;
};

const INITIAL_SCENE: SceneState = {
  waterFill: 0.58,
  waterEmpty: false,
  medFill: 0.14,
  medPowder: true,
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
            }, 800);
          },
        });

        moveSyringe();

        tl.to(
          proxy,
          {
            insert: 32,
            duration: 0.75,
            ease: "power3.out",
            onUpdate: moveSyringe,
          },
          0.15,
        )
          .to(
            proxy,
            {
              waterFill: 0.34,
              insert: 20,
              duration: 1.6,
              ease: "power1.inOut",
              onUpdate: moveSyringe,
            },
            0.95,
          )
          .to(
            proxy,
            {
              insert: 26,
              duration: 0.14,
              yoyo: true,
              repeat: 1,
              ease: "sine.inOut",
              onUpdate: moveSyringe,
            },
            1.15,
          )
          .to(
            proxy,
            {
              stopperX: med.x,
              stopperY: med.y,
              insert: 16,
              waterFill: 0,
              duration: 1.2,
              ease: "power2.inOut",
              onStart: () => {
                waterActive = false;
                waterEmpty = true;
              },
              onUpdate: moveSyringe,
            },
            2.6,
          )
          .call(() => {
            medActive = true;
            syncScene();
          }, undefined, 3.65)
          .to(
            proxy,
            {
              insert: 34,
              duration: 0.55,
              ease: "power2.out",
              onUpdate: moveSyringe,
            },
            3.95,
          )
          .to(
            proxy,
            {
              medFill: 0.76,
              insert: 22,
              duration: 1.6,
              ease: "power1.inOut",
              onStart: () => {
                medPowder = false;
              },
              onUpdate: moveSyringe,
            },
            4.2,
          )
          .to(
            proxy,
            {
              insert: 30,
              duration: 0.16,
              yoyo: true,
              repeat: 2,
              ease: "sine.inOut",
              onUpdate: moveSyringe,
            },
            4.4,
          )
          .to(
            proxy,
            {
              insert: 10,
              duration: 0.55,
              ease: "power2.out",
              onUpdate: moveSyringe,
            },
            6,
          );
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
    <div className="mx-auto mt-2 w-full max-w-md sm:max-w-lg">
      <p className="mb-4 text-center text-[13px] font-medium text-primary" aria-live="polite">
        {status}
      </p>

      <div
        ref={stageRef}
        className="relative mx-auto w-full overflow-visible rounded-2xl border border-primary/[0.06] bg-[#EEF2F4]/60 px-3 py-4 sm:px-8 sm:py-6"
      >
        <CalculatorReconScene
          layout="draw"
          drawSyringeLarge
          sceneRef={sceneRef}
          syringeMl={syringeMl}
          waterFill={scene.waterFill}
          waterEmpty={scene.waterEmpty}
          medFill={scene.medFill}
          medPowder={scene.medPowder}
          peptideUnit={peptideUnit}
          waterActive={scene.waterActive}
          medActive={scene.medActive}
          showSyringeFill={false}
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
