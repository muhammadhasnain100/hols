"use client";

import { memo, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { CalculatorReconScene } from "@/components/platform/provider/student/calculator/CalculatorReconScene";
import {
  medFillAfterReconstitution,
  medPowderFillFromAmount,
  reconstitutionDrawVolumeMl,
  syringeFillFromDrawVolume,
  waterFillAfterDraw,
  waterFillFromVolume,
} from "@/components/platform/provider/student/calculator/calculatorFillLevels";
import {
  measureStaticDrawTargets,
  svgAttrSetter,
  svgLayerTranslateYSetter,
  syringeFillOffsetY,
  syringeLiquidLayout,
  vialLiquidOffsetY,
} from "@/components/platform/provider/student/calculator/calculatorGeometry";
import { HEXARELIN_SRC } from "@/components/platform/provider/student/calculator/HexarelinVialArt";
import { gsap, registerGsap } from "@/lib/gsap";
import type { MassUnit, SyringeSizeMl } from "@/lib/integrate/provider/student/calculator";
import { prefersReducedMotion } from "@/lib/motion";
import type { RefObject } from "react";

type InjectionAnimationProps = {
  onComplete: () => void;
  syringeMl?: SyringeSizeMl;
  peptideUnit?: MassUnit;
  waterMl?: number;
  peptideAmount?: number;
};

/** Stage captions synced to the ~4.75s cinematic timeline. */
const STATUS = [
  { label: "Positioning syringe over bacteriostatic water…", at: 0 },
  { label: "Drawing bacteriostatic water into the syringe…", at: 900 },
  { label: "Moving to the medication vial…", at: 2570 },
  { label: "Injecting water and reconstituting…", at: 3450 },
  { label: "Swirling gently to dissolve…", at: 4650 },
  { label: "Reconstitution complete", at: 5350 },
];

/** Timeline stage durations (seconds) — ~4.85s total. */
const STAGE = {
  approachWater: 0.9,
  drawWater: 1.2,
  drawPause: 0.25,
  withdrawWater: 0.22,
  travelMed: 0.88,
  inject: 1.2,
  settle: 0.3,
  withdrawFinal: 0.4,
} as const;

const HOVER_LIFT = -10;
const CAP_INSERT_PX = 6;
const APPROACH_ARC = 14;
const TRAVEL_ARC = 22;

type NormPoint = { x: number; y: number };

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Quadratic arc — peaks at t=0.5. */
function arcPoint(from: NormPoint, to: NormPoint, t: number, arcHeight: number): NormPoint {
  const x = lerp(from.x, to.x, t);
  const y = lerp(from.y, to.y, t) - arcHeight * Math.sin(Math.PI * t);
  return { x, y };
}

type AnimationDom = {
  waterRoot: Element;
  medRoot: Element;
  waterColumn: HTMLElement | null;
  medColumn: HTMLElement | null;
  waterLiquidLayer: HTMLElement | null;
  medLiquidLayer: HTMLElement | null;
  medPowderLayer: HTMLElement | null;
  waterSurfaceMarker: HTMLElement | null;
  medSurfaceMarker: HTMLElement | null;
  syringeLiquidLayer: HTMLElement | null;
  syringeLiquidFill: SVGRectElement | null;
  syringePlungerLayer: HTMLElement | null;
  syringeRotator: HTMLElement | null;
  contactShadow: HTMLElement | null;
  medGlow: HTMLElement | null;
  setWaterLiquidY: ((value: number) => void) | null;
  setWaterSurfaceY: ((value: number) => void) | null;
  setMedLiquidY: ((value: number) => void) | null;
  setMedSurfaceY: ((value: number) => void) | null;
  setSyringeLiquidY: ((value: number) => void) | null;
  setSyringeLiquidHeight: ((value: number) => void) | null;
  setSyringePlungerY: ((value: number) => void) | null;
  setSyringeX: (value: number) => void;
  setSyringeY: (value: number) => void;
};

function queryAnimationDom(scene: HTMLElement, syringeWrap: HTMLElement): AnimationDom | null {
  const waterRoot = scene.querySelector('[data-vial-root="water"]');
  const medRoot = scene.querySelector('[data-vial-root="med"]');
  if (!waterRoot || !medRoot) return null;

  const waterLiquidLayer = waterRoot.querySelector<HTMLElement>("[data-vial-liquid-layer]");
  const medLiquidLayer = medRoot.querySelector<HTMLElement>("[data-vial-liquid-layer]");
  const medPowderLayer = medRoot.querySelector<HTMLElement>("[data-vial-powder-layer]");
  const waterSurfaceMarker = waterRoot.querySelector<HTMLElement>("[data-vial-liquid-surface]");
  const medSurfaceMarker = medRoot.querySelector<HTMLElement>("[data-vial-liquid-surface]");
  const syringeLiquidLayer = syringeWrap.querySelector<HTMLElement>("[data-syringe-liquid-layer]");
  const syringeLiquidFill = syringeWrap.querySelector<SVGRectElement>("[data-syringe-liquid-fill]");
  const syringePlungerLayer = syringeWrap.querySelector<HTMLElement>("[data-syringe-plunger-layer]");
  const syringeRotator = syringeWrap.querySelector<HTMLElement>("[data-syringe-rotator]");
  const contactShadow = scene.querySelector<HTMLElement>("[data-syringe-contact-shadow]");
  const waterColumn = scene.querySelector<HTMLElement>('[data-vial-column="water"]');
  const medColumn = scene.querySelector<HTMLElement>('[data-vial-column="med"]');

  const setSyringeX = gsap.quickSetter(syringeWrap, "x", "px") as (value: number) => void;
  const setSyringeY = gsap.quickSetter(syringeWrap, "y", "px") as (value: number) => void;

  let medGlow = medRoot.querySelector<HTMLElement>("[data-vial-recon-glow]");
  if (!medGlow && medRoot instanceof HTMLElement) {
    medGlow = document.createElement("div");
    medGlow.setAttribute("data-vial-recon-glow", "");
    medGlow.className = "pointer-events-none absolute inset-0 rounded-full opacity-0";
    medGlow.style.background =
      "radial-gradient(circle at 50% 62%, rgba(141,195,225,0.38) 0%, rgba(56,83,164,0.12) 45%, transparent 68%)";
    medGlow.style.transform = "scale(1.15)";
    const artHost = medRoot.querySelector(".relative");
    if (artHost instanceof HTMLElement) {
      artHost.style.position = "relative";
      artHost.appendChild(medGlow);
    }
  }

  return {
    waterRoot,
    medRoot,
    waterColumn,
    medColumn,
    waterLiquidLayer,
    medLiquidLayer,
    medPowderLayer,
    waterSurfaceMarker,
    medSurfaceMarker,
    syringeLiquidLayer,
    syringeLiquidFill,
    syringePlungerLayer,
    syringeRotator,
    contactShadow,
    medGlow,
    setWaterLiquidY: svgLayerTranslateYSetter(waterLiquidLayer),
    setWaterSurfaceY: svgLayerTranslateYSetter(waterSurfaceMarker),
    setMedLiquidY: svgLayerTranslateYSetter(medLiquidLayer),
    setMedSurfaceY: svgLayerTranslateYSetter(medSurfaceMarker),
    setSyringeLiquidY: svgAttrSetter(syringeLiquidFill, "y"),
    setSyringeLiquidHeight: svgAttrSetter(syringeLiquidFill, "height"),
    setSyringePlungerY: svgLayerTranslateYSetter(syringePlungerLayer),
    setSyringeX,
    setSyringeY,
  };
}

type DrawSceneProps = {
  sceneRef: RefObject<HTMLDivElement | null>;
  syringeWrapRef: RefObject<HTMLDivElement | null>;
  syringeMl: SyringeSizeMl;
  peptideUnit: MassUnit;
  waterFill: number;
  medFill: number;
  waterActive: boolean;
  medActive: boolean;
};

/** Frozen scene props — memoized so status text updates do not re-render the SVG layers. */
const DrawScene = memo(function DrawScene({
  sceneRef,
  syringeWrapRef,
  syringeMl,
  peptideUnit,
  waterFill,
  medFill,
  waterActive,
  medActive,
}: DrawSceneProps) {
  return (
    <CalculatorReconScene
      layout="draw"
      drawSyringeLarge
      sceneRef={sceneRef}
      syringeWrapRef={syringeWrapRef}
      syringeMl={syringeMl}
      peptideUnit={peptideUnit}
      gsapDriven
      instantFill
      showSyringeFill
      syringeFill={0}
      waterFill={waterFill}
      waterEmpty={false}
      medFill={medFill}
      medPowder
      waterActive={waterActive}
      medActive={medActive}
    />
  );
});

export function InjectionAnimation({
  onComplete,
  syringeMl = 1,
  peptideUnit = "mg",
  waterMl = 1,
  peptideAmount = 10,
}: InjectionAnimationProps) {
  const [status, setStatus] = useState(STATUS[0].label);
  const [done, setDone] = useState(false);
  const [waterActive, setWaterActive] = useState(true);
  const [medActive, setMedActive] = useState(false);
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
      if (
        prefersReducedMotion() ||
        !syringeWrapRef.current ||
        !sceneRef.current
      ) {
        return;
      }

      let tl: gsap.core.Timeline | null = null;
      let cancelled = false;

      const startTimeline = () => {
        if (
          cancelled ||
          !syringeWrapRef.current ||
          !sceneRef.current
        ) {
          return;
        }

        const sceneEl = sceneRef.current;
        const syringeWrapEl = syringeWrapRef.current;
        const dom = queryAnimationDom(sceneEl, syringeWrapEl);
        if (!dom) return;

        gsap.set(syringeWrapEl, { x: 0, y: 0, force3D: true });
        if (dom.syringeRotator) {
          gsap.set(dom.syringeRotator, { rotation: -18, transformOrigin: "50% 35%" });
        }
        if (dom.contactShadow) {
          gsap.set(dom.contactShadow, { opacity: 0, scale: 0.85 });
        }

        const staticTargets = measureStaticDrawTargets(sceneEl, syringeWrapEl);
        if (!staticTargets) return;

        const drawVolumeMl = reconstitutionDrawVolumeMl(waterMl, syringeMl);
        const startWaterFill = waterFillFromVolume(waterMl);
        const startMedFill = medPowderFillFromAmount(peptideAmount, peptideUnit);
        const endWaterFill = waterFillAfterDraw(startWaterFill, drawVolumeMl);
        const endSyringeFill = syringeFillFromDrawVolume(drawVolumeMl, syringeMl);
        const endMedFill = medFillAfterReconstitution(waterMl, peptideAmount, peptideUnit);

        const waterStopper = staticTargets.waterStopper;
        const medStopper = staticTargets.medStopper;

        /** Start slightly above-left of the water vial for a curved approach. */
        const approachStart: NormPoint = {
          x: waterStopper.x - 18,
          y: waterStopper.y + HOVER_LIFT - 22,
        };

        const proxy = {
          /** Arc interpolation progress 0→1 within the current travel segment. */
          travelT: 0,
          hoverLift: HOVER_LIFT,
          dive: 0,
          wiggleY: 0,
          rotation: -18,
          waterFill: startWaterFill,
          medFill: startMedFill,
          syringeFill: 0,
          shadowOpacity: 0,
        };

        let medPowder = true;
        let motionFrom = approachStart;
        let motionTo = waterStopper;
        let motionArc = APPROACH_ARC;

        const applyFillLayers = () => {
          const waterOffset = vialLiquidOffsetY(proxy.waterFill, {
            interiorHeight: HEXARELIN_SRC.interiorHeight,
          });
          dom.setWaterLiquidY?.(waterOffset);
          dom.setWaterSurfaceY?.(waterOffset);

          const medOffset = vialLiquidOffsetY(proxy.medFill, {
            powder: medPowder,
            interiorHeight: HEXARELIN_SRC.interiorHeight,
          });
          dom.setMedLiquidY?.(medOffset);
          dom.setMedSurfaceY?.(medOffset);

          if (dom.medLiquidLayer && !medPowder) {
            dom.medLiquidLayer.setAttribute("opacity", proxy.medFill > 0.04 ? "1" : "0");
          }

          const plungerOffset = syringeFillOffsetY(proxy.syringeFill);
          const liquid = syringeLiquidLayout(proxy.syringeFill);
          dom.setSyringePlungerY?.(plungerOffset);
          dom.setSyringeLiquidY?.(liquid.y);
          dom.setSyringeLiquidHeight?.(liquid.height);

          if (dom.syringeLiquidLayer) {
            const layer = dom.syringeLiquidLayer as HTMLElement & SVGElement;
            // Clear any CSS opacity so the SVG attribute can take effect.
            if (layer.style) layer.style.opacity = "";
            layer.setAttribute("opacity", proxy.syringeFill > 0.008 ? "1" : "0");
          }
        };

        const tipTargetY = () => {
          const activeStopperY = lerp(motionFrom.y, motionTo.y, proxy.travelT);
          const hoverTip = activeStopperY + proxy.hoverLift;
          const insertTip = activeStopperY + CAP_INSERT_PX;
          return hoverTip + (insertTip - hoverTip) * proxy.dive + proxy.wiggleY;
        };

        const updateFrame = () => {
          if (cancelled) return;
          const pos = arcPoint(motionFrom, motionTo, proxy.travelT, motionArc);
          dom.setSyringeX(pos.x - staticTargets.tipAtZero.x);
          dom.setSyringeY(tipTargetY() - staticTargets.tipAtZero.y);
          applyFillLayers();

          if (dom.syringeRotator) {
            dom.syringeRotator.style.transform = `translate(-50%, -50%) rotate(${proxy.rotation}deg)`;
          }

          if (dom.contactShadow) {
            const shadowX = pos.x - 28;
            const shadowY = tipTargetY() + 18;
            dom.contactShadow.style.left = `${shadowX}px`;
            dom.contactShadow.style.top = `${shadowY}px`;
            dom.contactShadow.style.opacity = String(proxy.shadowOpacity);
          }
        };

        if (dom.medLiquidLayer) {
          dom.medLiquidLayer.setAttribute("opacity", "0");
          (dom.medLiquidLayer as HTMLElement).style.transform = "";
        }
        if (dom.medPowderLayer) {
          (dom.medPowderLayer as HTMLElement).style.transform = "";
        }
        if (dom.syringeLiquidLayer) {
          dom.syringeLiquidLayer.setAttribute("opacity", "0");
        }

        proxy.syringeFill = 0;
        motionFrom = approachStart;
        motionTo = waterStopper;
        motionArc = APPROACH_ARC;
        proxy.travelT = 0;
        applyFillLayers();
        updateFrame();

        const t0 = 0;
        const tApproachEnd = t0 + STAGE.approachWater;
        const tDrawStart = tApproachEnd;
        const tDrawEnd = tDrawStart + STAGE.drawWater;
        const tWithdrawStart = tDrawEnd + STAGE.drawPause;
        const tTravelStart = tWithdrawStart + STAGE.withdrawWater;
        const tTravelEnd = tTravelStart + STAGE.travelMed;
        const tInjectStart = tTravelEnd;
        const tInjectEnd = tInjectStart + STAGE.inject;
        const tSettleEnd = tInjectEnd + STAGE.settle;

        tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          onComplete: () => {
            setDone(true);
            window.setTimeout(() => {
              if (!completed.current) {
                completed.current = true;
                onComplete();
              }
            }, 550);
          },
        });

        // ── 1. Approach + insert water vial (~900ms) ──
        tl.to(
          proxy,
          {
            travelT: 1,
            rotation: -8,
            shadowOpacity: 0.55,
            duration: STAGE.approachWater * 0.72,
            ease: "power2.inOut",
            onUpdate: updateFrame,
          },
          t0,
        )
          .call(() => {
            setWaterActive(true);
            setMedActive(false);
          }, undefined, t0)
          .to(
            proxy,
            {
              hoverLift: -4,
              dive: 1,
              rotation: 0,
              duration: STAGE.approachWater * 0.28,
              ease: "power3.inOut",
              onUpdate: updateFrame,
            },
            t0 + STAGE.approachWater * 0.72,
          )

          // ── 2. Water extraction (~1200ms) + pause ──
          .to(
            proxy,
            {
              waterFill: endWaterFill,
              syringeFill: endSyringeFill,
              duration: STAGE.drawWater,
              ease: "power1.inOut",
              onUpdate: updateFrame,
            },
            tDrawStart,
          )
          .to({}, { duration: STAGE.drawPause }, tDrawEnd)
          .to(
            proxy,
            {
              dive: 0,
              hoverLift: HOVER_LIFT,
              duration: STAGE.withdrawWater,
              ease: "power3.out",
              onUpdate: updateFrame,
            },
            tWithdrawStart,
          )

          // ── 3. Travel to medication vial (~880ms) ──
          .call(
            () => {
              motionFrom = waterStopper;
              motionTo = medStopper;
              motionArc = TRAVEL_ARC;
              proxy.travelT = 0;
              setWaterActive(false);
              setMedActive(true);
            },
            undefined,
            tTravelStart,
          )
          .to(
            proxy,
            {
              travelT: 1,
              rotation: 8,
              hoverLift: HOVER_LIFT - 4,
              duration: STAGE.travelMed * 0.78,
              ease: "power2.inOut",
              onUpdate: updateFrame,
            },
            tTravelStart,
          )
          .to(
            proxy,
            {
              hoverLift: -4,
              dive: 1,
              rotation: 2,
              duration: STAGE.travelMed * 0.22,
              ease: "power3.inOut",
              onUpdate: updateFrame,
            },
            tTravelStart + STAGE.travelMed * 0.78,
          )

          // ── 4. Injection + reconstitution (~1200ms) + settle (~300ms) ──
          .call(
            () => {
              medPowder = false;
              proxy.medFill = 0.06;
              if (dom.medPowderLayer) {
                gsap.to(dom.medPowderLayer, {
                  attr: { opacity: 0 },
                  duration: STAGE.inject * 0.42,
                  ease: "power1.out",
                  force3D: false,
                });
              }
              if (dom.medLiquidLayer) {
                gsap.fromTo(
                  dom.medLiquidLayer,
                  { attr: { opacity: 0 } },
                  {
                    attr: { opacity: 1 },
                    duration: STAGE.inject * 0.38,
                    ease: "power1.out",
                    force3D: false,
                  },
                );
              }
              applyFillLayers();
            },
            undefined,
            tInjectStart,
          )
          .to(
            proxy,
            {
              syringeFill: 0,
              medFill: endMedFill,
              duration: STAGE.inject,
              ease: "power1.inOut",
              onUpdate: updateFrame,
            },
            tInjectStart,
          )

          // Soft settling + payoff glow in med vial
          .to(
            proxy,
            {
              wiggleY: 1.5,
              rotation: 0,
              duration: 0.16,
              yoyo: true,
              repeat: 2,
              ease: "sine.inOut",
              onUpdate: updateFrame,
            },
            tInjectEnd,
          )
          .to(
            dom.medGlow,
            {
              opacity: 0.72,
              duration: STAGE.settle * 0.55,
              ease: "power2.out",
            },
            tInjectEnd,
          )
          .to(
            dom.medGlow,
            {
              opacity: 0.38,
              duration: STAGE.settle * 0.45,
              ease: "sine.inOut",
            },
            tInjectEnd + STAGE.settle * 0.55,
          )

          // Withdraw needle — settle
          .to(
            proxy,
            {
              dive: 0,
              hoverLift: HOVER_LIFT - 2,
              wiggleY: 0,
              shadowOpacity: 0.35,
              duration: STAGE.withdrawFinal,
              ease: "power3.inOut",
              onUpdate: updateFrame,
            },
            tSettleEnd,
          )
          .to(
            dom.medGlow,
            {
              opacity: 0.22,
              duration: STAGE.withdrawFinal,
              ease: "sine.out",
            },
            tSettleEnd,
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
    { scope: stageRef, dependencies: [onComplete, syringeMl, peptideUnit, waterMl, peptideAmount] },
  );

  const sceneWaterFill = waterFillFromVolume(waterMl);
  const sceneMedFill = medPowderFillFromAmount(peptideAmount, peptideUnit);

  return (
    <div className="mx-auto mt-2 w-full min-w-0 max-w-sm sm:max-w-md md:max-w-lg">
      <p
        className="mb-3 px-1 text-center text-xs font-medium text-[color:var(--dash-text)] sm:mb-4 sm:text-[13px]"
        aria-live="polite"
      >
        {status}
      </p>

      <div
        ref={stageRef}
        className="dashboard-glass-card relative mx-auto w-full overflow-hidden rounded-2xl px-2 pb-4 pt-5 sm:px-6 sm:pb-5 sm:pt-6 md:px-8"
      >
        <DrawScene
          sceneRef={sceneRef}
          syringeWrapRef={syringeWrapRef}
          syringeMl={syringeMl}
          peptideUnit={peptideUnit}
          waterFill={sceneWaterFill}
          medFill={sceneMedFill}
          waterActive={waterActive}
          medActive={medActive}
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
