"use client";

/**
 * Reconstitution syringe animation.
 *
 * Positioning model (important):
 * We animate the syringe WRAP PIVOT (center of the rotator box) + rotation.
 * The needle tip is derived from that: tip = pivot + rotate(tipRel, rotation).
 *
 * Why not tip-chasing? When the syringe is horizontal, aiming the tip at a
 * vial stopper parks the long barrel across both vials (the "bridge" bug).
 * Pivot-centering keeps the body over the active vial / travel lane.
 *
 * Rotation: 0° = native horizontal (needle right), 90° = needle straight down.
 */

import { memo, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { CalculatorReconScene } from "@/components/platform/provider/student/calculator/CalculatorReconScene";
import {
  medFillAfterReconstitution,
  medPowderFillFromAmount,
  reconstitutionDrawVolumeMl,
  syringeFillFromDrawVolume,
  waterFillFromVolume,
} from "@/components/platform/provider/student/calculator/calculatorFillLevels";
import {
  measureStaticDrawTargets,
  svgAttrSetter,
  svgLayerTranslateYSetter,
  svgLayersTranslateXSetter,
  vialLiquidOffsetY,
} from "@/components/platform/provider/student/calculator/calculatorGeometry";
import { BAC_WATER_SRC } from "@/components/platform/provider/student/calculator/BacWaterVialArt";
import { HEXARELIN_SRC } from "@/components/platform/provider/student/calculator/HexarelinVialArt";
import {
  hsyrLiquidLayout,
  hsyrPlungerOffsetX,
} from "@/components/platform/provider/student/calculator/HorizontalSyringeArt";
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

const STAGE = {
  intro: 0.55,
  rotateDownWater: 0.7,
  insertWater: 0.35,
  draw: 1.1,
  drawPause: 0.18,
  withdrawWater: 0.28,
  lift: 0.3,
  flatten: 0.4,
  slide: 0.75,
  rotateDownMed: 0.7,
  insertMed: 0.32,
  inject: 1.1,
  settle: 0.35,
  withdrawMed: 0.4,
  fadeOut: 0.3,
} as const;

const ROT_H = 0;
const ROT_V = 90;
const INSERT = 8;

type Pt = { x: number; y: number };

function rotateVec(v: Pt, deg: number): Pt {
  const rad = (deg * Math.PI) / 180;
  const c = Math.cos(rad);
  const s = Math.sin(rad);
  return { x: v.x * c - v.y * s, y: v.x * s + v.y * c };
}

/** Pivot so the needle tip sits on `tip` at the given rotation. */
function pivotForTip(tip: Pt, tipRel: Pt, rotation: number): Pt {
  const r = rotateVec(tipRel, rotation);
  return { x: tip.x - r.x, y: tip.y - r.y };
}

type Dom = {
  waterColumn: HTMLElement | null;
  medColumn: HTMLElement | null;
  waterLiquidLayer: HTMLElement | null;
  medLiquidLayer: HTMLElement | null;
  medPowderLayer: HTMLElement | null;
  waterSurfaceMarker: HTMLElement | null;
  medSurfaceMarker: HTMLElement | null;
  syringeLiquidLayer: HTMLElement | null;
  syringeLiquidFill: SVGRectElement | null;
  syringePlungerLayers: NodeListOf<HTMLElement> | null;
  syringeRotator: HTMLElement | null;
  contactShadow: HTMLElement | null;
  medGlow: HTMLElement | null;
  setWaterLiquidY: ((v: number) => void) | null;
  setWaterSurfaceY: ((v: number) => void) | null;
  setMedLiquidY: ((v: number) => void) | null;
  setMedSurfaceY: ((v: number) => void) | null;
  setSyringeLiquidX: ((v: number) => void) | null;
  setSyringeLiquidWidth: ((v: number) => void) | null;
  setSyringePlungerX: ((v: number) => void) | null;
  setWrapX: (v: number) => void;
  setWrapY: (v: number) => void;
};

function queryDom(scene: HTMLElement, wrap: HTMLElement): Dom | null {
  const waterRoot = scene.querySelector('[data-vial-root="water"]');
  const medRoot = scene.querySelector('[data-vial-root="med"]');
  if (!waterRoot || !medRoot) return null;

  const waterLiquidLayer = waterRoot.querySelector<HTMLElement>("[data-vial-liquid-layer]");
  const medLiquidLayer = medRoot.querySelector<HTMLElement>("[data-vial-liquid-layer]");
  const medPowderLayer = medRoot.querySelector<HTMLElement>("[data-vial-powder-layer]");
  const waterSurfaceMarker = waterRoot.querySelector<HTMLElement>("[data-vial-liquid-surface]");
  const medSurfaceMarker = medRoot.querySelector<HTMLElement>("[data-vial-liquid-surface]");
  const syringeLiquidLayer = wrap.querySelector<HTMLElement>("[data-syringe-liquid-layer]");
  const syringeLiquidFill = wrap.querySelector<SVGRectElement>("[data-syringe-liquid-fill]");
  const syringePlungerLayers = wrap.querySelectorAll<HTMLElement>("[data-syringe-plunger-layer]");
  const syringeRotator = wrap.querySelector<HTMLElement>("[data-syringe-rotator]");
  const contactShadow = scene.querySelector<HTMLElement>("[data-syringe-contact-shadow]");
  const waterColumn = scene.querySelector<HTMLElement>('[data-vial-column="water"]');
  const medColumn = scene.querySelector<HTMLElement>('[data-vial-column="med"]');

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
    waterColumn,
    medColumn,
    waterLiquidLayer,
    medLiquidLayer,
    medPowderLayer,
    waterSurfaceMarker,
    medSurfaceMarker,
    syringeLiquidLayer,
    syringeLiquidFill,
    syringePlungerLayers,
    syringeRotator,
    contactShadow,
    medGlow,
    setWaterLiquidY: svgLayerTranslateYSetter(waterLiquidLayer),
    setWaterSurfaceY: svgLayerTranslateYSetter(waterSurfaceMarker),
    setMedLiquidY: svgLayerTranslateYSetter(medLiquidLayer),
    setMedSurfaceY: svgLayerTranslateYSetter(medSurfaceMarker),
    setSyringeLiquidX: svgAttrSetter(syringeLiquidFill, "x"),
    setSyringeLiquidWidth: svgAttrSetter(syringeLiquidFill, "width"),
    setSyringePlungerX: svgLayersTranslateXSetter(syringePlungerLayers),
    setWrapX: gsap.quickSetter(wrap, "x", "px") as (v: number) => void,
    setWrapY: gsap.quickSetter(wrap, "y", "px") as (v: number) => void,
  };
}

const DrawScene = memo(function DrawScene({
  sceneRef,
  syringeWrapRef,
  syringeMl,
  peptideUnit,
  waterFill,
  medFill,
}: {
  sceneRef: RefObject<HTMLDivElement | null>;
  syringeWrapRef: RefObject<HTMLDivElement | null>;
  syringeMl: SyringeSizeMl;
  peptideUnit: MassUnit;
  waterFill: number;
  medFill: number;
}) {
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
      waterActive
      medActive={false}
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
  const [status, setStatus] = useState("Positioning syringe over bacteriostatic water…");
  const [done, setDone] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const syringeWrapRef = useRef<HTMLDivElement>(null);
  const completed = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      const t1 = window.setTimeout(() => setStatus("Preparing dose calculation…"), 0);
      const t2 = window.setTimeout(() => {
        if (!completed.current) {
          completed.current = true;
          onComplete();
        }
      }, 320);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
  }, [onComplete]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const timer = window.setTimeout(() => {
      const node = stageRef.current;
      if (!node) return;
      const narrow = window.matchMedia("(max-width: 767px)").matches;
      node.scrollIntoView({
        behavior: "smooth",
        block: narrow ? "nearest" : "center",
        inline: "nearest",
      });
    }, 80);
    return () => window.clearTimeout(timer);
  }, []);

  useGSAP(
    () => {
      registerGsap();
      if (prefersReducedMotion() || !syringeWrapRef.current || !sceneRef.current) return;

      let tl: gsap.core.Timeline | null = null;
      let cancelled = false;

      const startTimeline = () => {
        if (cancelled || !syringeWrapRef.current || !sceneRef.current) return;

        const sceneEl = sceneRef.current;
        const wrapEl = syringeWrapRef.current;
        const dom = queryDom(sceneEl, wrapEl);
        if (!dom) return;

        // Identity pose for measurement — tipRel is measured at rotation 0°.
        gsap.set(wrapEl, { x: 0, y: 0, force3D: true, opacity: 1 });
        if (dom.syringeRotator) {
          gsap.set(dom.syringeRotator, { clearProps: "transform" });
          dom.syringeRotator.style.transformOrigin = "center center";
          dom.syringeRotator.style.transform = "translate(-50%, -50%) rotate(0deg)";
        }
        if (dom.contactShadow) gsap.set(dom.contactShadow, { opacity: 0, scale: 0.85 });

        const targets = measureStaticDrawTargets(sceneEl, wrapEl);
        if (!targets) return;

        const wrapRect = wrapEl.getBoundingClientRect();
        const sceneRect = sceneEl.getBoundingClientRect();
        const pivot0: Pt = {
          x: wrapRect.left + wrapRect.width / 2 - sceneRect.left,
          y: wrapRect.top + wrapRect.height / 2 - sceneRect.top,
        };
        const tipRel: Pt = {
          x: targets.tipAtZero.x - pivot0.x,
          y: targets.tipAtZero.y - pivot0.y,
        };

        const water = targets.waterStopper;
        const med = targets.medStopper;

        // How far the tip sits below the pivot when needle-down.
        const tipDrop = Math.abs(rotateVec(tipRel, ROT_V).y) || Math.abs(tipRel.x);

        /** Hover / insert pivots — tip locked onto the vial stopper. */
        const waterHover = pivotForTip(
          { x: water.x, y: water.y - 18 },
          tipRel,
          ROT_V,
        );
        const waterInsert = pivotForTip(
          { x: water.x, y: water.y + INSERT },
          tipRel,
          ROT_V,
        );
        const medHover = pivotForTip(
          { x: med.x, y: med.y - 18 },
          tipRel,
          ROT_V,
        );
        const medInsert = pivotForTip(
          { x: med.x, y: med.y + INSERT },
          tipRel,
          ROT_V,
        );

        /**
         * Horizontal travel lane — stay at the same pivot height as waterHover.
         * Lifting higher than that pushes the retracted plunger outside the card
         * (overflow clips it so the syringe looks "hidden behind" the card).
         */
        const travelY = waterHover.y;
        const waterFlat: Pt = { x: water.x, y: travelY };
        const medFlat: Pt = { x: med.x, y: travelY };

        // Intro: horizontal, pivot above water (body sits over the bottle).
        const waterIntro: Pt = {
          x: water.x,
          y: Math.max(waterHover.y + tipDrop * 0.15, water.y - Math.min(48, tipDrop * 0.28)),
        };

        const drawMl = reconstitutionDrawVolumeMl(waterMl, syringeMl);
        const startWater = waterFillFromVolume(waterMl);
        const startMed = medPowderFillFromAmount(peptideAmount, peptideUnit);
        const endSyringe = syringeFillFromDrawVolume(drawMl, syringeMl);
        const endMed = medFillAfterReconstitution(waterMl, peptideAmount, peptideUnit);

        const proxy = {
          pivotX: waterIntro.x,
          pivotY: waterIntro.y,
          rotation: ROT_H,
          waterFill: startWater,
          waterOpacity: 1,
          medFill: startMed,
          syringeFill: 0,
          wrapOpacity: 1,
          shadowOpacity: 0,
        };

        let medPowder = true;

        const focus = (which: "water" | "med") => {
          const on = which === "water" ? dom.waterColumn : dom.medColumn;
          const off = which === "water" ? dom.medColumn : dom.waterColumn;
          if (on) {
            gsap.to(on, {
              opacity: 1,
              filter: "brightness(1) saturate(1)",
              duration: 0.3,
              overwrite: "auto",
            });
          }
          if (off) {
            gsap.to(off, {
              opacity: 0.55,
              filter: "brightness(0.94) saturate(0.88)",
              duration: 0.3,
              overwrite: "auto",
            });
          }
        };

        const applyFills = () => {
          const waterEmpty = proxy.waterFill <= 0.02;
          const wOff = vialLiquidOffsetY(proxy.waterFill, {
            interiorHeight: BAC_WATER_SRC.interiorHeight,
            empty: waterEmpty,
          });
          dom.setWaterLiquidY?.(wOff);
          dom.setWaterSurfaceY?.(wOff);
          if (dom.waterLiquidLayer) {
            dom.waterLiquidLayer.setAttribute(
              "opacity",
              String(Math.max(0, Math.min(1, proxy.waterOpacity))),
            );
          }

          const mOff = vialLiquidOffsetY(proxy.medFill, {
            powder: medPowder,
            interiorHeight: HEXARELIN_SRC.interiorHeight,
          });
          dom.setMedLiquidY?.(mOff);
          dom.setMedSurfaceY?.(mOff);
          if (dom.medLiquidLayer && !medPowder) {
            dom.medLiquidLayer.setAttribute("opacity", proxy.medFill > 0.04 ? "1" : "0");
          }

          const plungerX = hsyrPlungerOffsetX(proxy.syringeFill);
          const liquid = hsyrLiquidLayout(proxy.syringeFill);
          dom.setSyringePlungerX?.(plungerX);
          dom.setSyringeLiquidX?.(liquid.x);
          dom.setSyringeLiquidWidth?.(liquid.width);
          if (dom.syringeLiquidLayer) {
            const layer = dom.syringeLiquidLayer as HTMLElement & SVGElement;
            if (layer.style) layer.style.opacity = "";
            layer.setAttribute("opacity", proxy.syringeFill > 0.008 ? "1" : "0");
          }
        };

        const updateFrame = () => {
          if (cancelled) return;
          dom.setWrapX(proxy.pivotX - pivot0.x);
          dom.setWrapY(proxy.pivotY - pivot0.y);
          applyFills();

          if (dom.syringeRotator) {
            dom.syringeRotator.style.transform = `translate(-50%, -50%) rotate(${proxy.rotation}deg)`;
          }
          wrapEl.style.opacity = String(Math.max(0, Math.min(1, proxy.wrapOpacity)));

          if (dom.contactShadow) {
            const tip = rotateVec(tipRel, proxy.rotation);
            dom.contactShadow.style.left = `${proxy.pivotX + tip.x - 28}px`;
            dom.contactShadow.style.top = `${proxy.pivotY + tip.y + 18}px`;
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

        applyFills();
        updateFrame();

        // Absolute timeline offsets
        let t = 0;
        const mark = (d: number) => {
          const start = t;
          t += d;
          return start;
        };
        const tIntro = mark(STAGE.intro);
        const tRotWater = mark(STAGE.rotateDownWater);
        const tInsWater = mark(STAGE.insertWater);
        const tDraw = mark(STAGE.draw);
        const tPause = mark(STAGE.drawPause);
        const tWdWater = mark(STAGE.withdrawWater);
        const tTravel = mark(STAGE.lift + STAGE.flatten);
        const tSlide = mark(STAGE.slide);
        const tRotMed = mark(STAGE.rotateDownMed);
        const tInsMed = mark(STAGE.insertMed);
        const tInject = mark(STAGE.inject);
        const tSettle = mark(STAGE.settle);
        const tWdMed = mark(STAGE.withdrawMed);
        const tFade = mark(STAGE.fadeOut);
        void tPause;

        const say = (label: string) => () => {
          if (!cancelled) setStatus(label);
        };

        tl = gsap.timeline({
          defaults: { ease: "power2.inOut" },
          onComplete: () => {
            setDone(true);
            window.setTimeout(() => {
              if (completed.current) return;
              completed.current = true;
              if (typeof window !== "undefined") {
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
              onComplete();
            }, 450);
          },
        });

        tl.call(say("Positioning syringe over bacteriostatic water…"), undefined, tIntro)
          .call(() => focus("water"), undefined, tIntro)
          .to(
            proxy,
            {
              pivotX: waterIntro.x,
              pivotY: waterIntro.y,
              rotation: ROT_H,
              wrapOpacity: 1,
              duration: STAGE.intro,
              ease: "power2.out",
              onUpdate: updateFrame,
            },
            tIntro,
          )

          // Rotate needle-down over water
          .call(say("Rotating syringe down toward the bacteriostatic bottle…"), undefined, tRotWater)
          .to(
            proxy,
            {
              pivotX: waterHover.x,
              pivotY: waterHover.y,
              rotation: ROT_V,
              shadowOpacity: 0.35,
              duration: STAGE.rotateDownWater,
              onUpdate: updateFrame,
            },
            tRotWater,
          )

          // Insert into water stopper
          .to(
            proxy,
            {
              pivotX: waterInsert.x,
              pivotY: waterInsert.y,
              shadowOpacity: 0.55,
              duration: STAGE.insertWater,
              ease: "power3.inOut",
              onUpdate: updateFrame,
            },
            tInsWater,
          )

          // Draw
          .call(say("Drawing bacteriostatic water into the syringe…"), undefined, tDraw)
          .to(
            proxy,
            {
              waterFill: 0,
              waterOpacity: 0,
              syringeFill: endSyringe,
              duration: STAGE.draw,
              ease: "power1.inOut",
              onUpdate: updateFrame,
            },
            tDraw,
          )

          // Withdraw from water
          .to(
            proxy,
            {
              pivotX: waterHover.x,
              pivotY: waterHover.y,
              duration: STAGE.withdrawWater,
              ease: "power3.out",
              onUpdate: updateFrame,
            },
            tWdWater,
          )

          // Flatten in place above water (no extra lift — keeps plunger inside the card)
          .call(say("Moving syringe to the medication vial…"), undefined, tTravel)
          .call(() => focus("med"), undefined, tTravel)
          .to(
            proxy,
            {
              pivotX: waterFlat.x,
              pivotY: waterFlat.y,
              rotation: ROT_H,
              shadowOpacity: 0,
              duration: STAGE.lift + STAGE.flatten,
              ease: "power2.inOut",
              onUpdate: updateFrame,
            },
            tTravel,
          )

          // Slide — pivot moves from water to med at the same safe height
          .to(
            proxy,
            {
              pivotX: medFlat.x,
              pivotY: medFlat.y,
              rotation: ROT_H,
              duration: STAGE.slide,
              ease: "power2.inOut",
              onUpdate: updateFrame,
            },
            tSlide,
          )

          // Rotate needle-down over med
          .call(say("Rotating syringe down over the medication vial…"), undefined, tRotMed)
          .to(
            proxy,
            {
              pivotX: medHover.x,
              pivotY: medHover.y,
              rotation: ROT_V,
              shadowOpacity: 0.35,
              duration: STAGE.rotateDownMed,
              onUpdate: updateFrame,
            },
            tRotMed,
          )

          // Insert into med
          .to(
            proxy,
            {
              pivotX: medInsert.x,
              pivotY: medInsert.y,
              shadowOpacity: 0.55,
              duration: STAGE.insertMed,
              ease: "power3.inOut",
              onUpdate: updateFrame,
            },
            tInsMed,
          )

          // Inject + reconstitute
          .call(say("Injecting water and reconstituting…"), undefined, tInject)
          .call(
            () => {
              medPowder = false;
              proxy.medFill = 0.06;
              if (dom.medPowderLayer) {
                gsap.to(dom.medPowderLayer, {
                  attr: { opacity: 0 },
                  duration: STAGE.inject * 0.4,
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
                    duration: STAGE.inject * 0.35,
                    ease: "power1.out",
                    force3D: false,
                  },
                );
              }
              applyFills();
            },
            undefined,
            tInject,
          )
          .to(
            proxy,
            {
              syringeFill: 0,
              medFill: endMed,
              duration: STAGE.inject,
              ease: "power1.inOut",
              onUpdate: updateFrame,
            },
            tInject,
          )

          // Settle glow — rotation stays vertical (no flick)
          .to(
            dom.medGlow,
            { opacity: 0.7, duration: STAGE.settle * 0.55, ease: "power2.out" },
            tSettle,
          )
          .to(
            dom.medGlow,
            { opacity: 0.35, duration: STAGE.settle * 0.45, ease: "sine.inOut" },
            tSettle + STAGE.settle * 0.55,
          )

          // Withdraw straight up, still needle-down
          .call(say("Reconstitution complete"), undefined, tWdMed)
          .to(
            proxy,
            {
              pivotX: medHover.x,
              pivotY: medHover.y - 16,
              rotation: ROT_V,
              shadowOpacity: 0,
              duration: STAGE.withdrawMed,
              ease: "power3.inOut",
              onUpdate: updateFrame,
            },
            tWdMed,
          )

          // Fade syringe out cleanly
          .to(
            proxy,
            {
              wrapOpacity: 0,
              duration: STAGE.fadeOut,
              ease: "power1.in",
              onUpdate: updateFrame,
            },
            tFade,
          )
          .to(
            dom.medGlow,
            { opacity: 0.2, duration: STAGE.fadeOut, ease: "sine.out" },
            tFade,
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
    <div className="mx-auto mt-2 w-full min-w-0">
      <p
        className="mb-2 break-words px-1 text-center text-[11px] font-medium leading-snug text-[color:var(--dash-text)] sm:mb-4 sm:text-base"
        aria-live="polite"
      >
        {status}
      </p>

      <div
        ref={stageRef}
        className="dashboard-glass-card relative mx-auto w-full min-w-0 overflow-hidden rounded-2xl px-1 pb-2 pt-2 sm:px-10 sm:pb-5 sm:pt-5 md:px-12 md:pt-6"
      >
        <DrawScene
          sceneRef={sceneRef}
          syringeWrapRef={syringeWrapRef}
          syringeMl={syringeMl}
          peptideUnit={peptideUnit}
          waterFill={sceneWaterFill}
          medFill={sceneMedFill}
        />

        {done ? (
          <div className="absolute inset-x-0 bottom-2 flex justify-center sm:bottom-3">
            <span className="rounded-full bg-[#5BA8A6]/15 px-3 py-1 text-[11px] font-semibold tracking-wide text-[#3D8A87]">
              Ready
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
