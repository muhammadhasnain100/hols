/**
 * Marker-based geometry for calculator vial + syringe alignment.
 *
 * During the draw animation, static targets are measured once and fill levels
 * are applied imperatively (GSAP + direct DOM transforms) for smooth motion.
 */

export type NormPoint = { x: number; y: number };

/** Must stay in sync with AssetVial viewBox / interior constants. */
export const VIAL_GEOMETRY = {
  viewBoxHeight: 205,
  interiorTop: 76,
  interiorHeight: 95,
  /** Approx. needle target; live alignment uses data-vial-stopper markers. */
  stopperY: 19,
  powderSurfaceY: 165,
} as const;

/**
 * Plunger travel in viewBox units (rubber tip travel inside barrel).
 * Must stay in sync with SyringeArt — thumb pad is drawn with thumbStemGap
 * so empty (fully in) still shows a short stem above the finger flanges.
 */
/** Must stay in sync with SyringeArt plunger travel. */
export const SYRINGE_BARREL_TRAVEL = 188;

/** Barrel interior where liquid is drawn (viewBox units, needle-down syringe). */
export const SYRINGE_BARREL = {
  liquidX: 26,
  liquidWidth: 28,
  interiorTop: 102,
  interiorBottom: 302,
  interiorHeight: 200,
} as const;

export type StaticDrawTargets = {
  waterStopper: NormPoint;
  medStopper: NormPoint;
  /**
   * Needle tip position in scene coordinates while the syringe wrap transform is identity (x=0, y=0).
   * Wrap translation should be `targetTip - tipAtZero`.
   */
  tipAtZero: NormPoint;
};

export type DrawTargets = StaticDrawTargets & {
  waterLiquid: NormPoint;
  medLiquid: NormPoint;
};

function centerRelativeTo(el: Element, origin: DOMRect): NormPoint {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - origin.left,
    y: rect.top + rect.height / 2 - origin.top,
  };
}

/** Vertical translate (viewBox / local SVG units) for liquid / powder inside a vial. */
export function vialLiquidOffsetY(
  fillRatio: number,
  options: { powder?: boolean; empty?: boolean; interiorHeight?: number } = {},
): number {
  const height = options.interiorHeight ?? VIAL_GEOMETRY.interiorHeight;
  if (options.powder) return 0;
  if (options.empty) return height - 6;
  const clamped = Math.min(0.95, Math.max(0.06, fillRatio));
  return (1 - clamped) * height;
}

/** Map a viewBox Y coordinate on the vial SVG to scene-local pixels. */
export function vialViewBoxYToScene(vialRoot: Element, viewBoxY: number, sceneRect: DOMRect): number {
  const vialRect = vialRoot.getBoundingClientRect();
  const scale = vialRect.height / VIAL_GEOMETRY.viewBoxHeight;
  return vialRect.top - sceneRect.top + viewBoxY * scale;
}

/** Scene-local Y of the liquid / powder surface for a vial. */
export function vialLiquidSurfaceSceneY(
  vialRoot: Element,
  fillRatio: number,
  sceneRect: DOMRect,
  options: { powder?: boolean; empty?: boolean } = {},
): number {
  const viewBoxY = options.powder
    ? VIAL_GEOMETRY.powderSurfaceY
    : VIAL_GEOMETRY.interiorTop + 1 + vialLiquidOffsetY(fillRatio, options);
  return vialViewBoxYToScene(vialRoot, viewBoxY, sceneRect);
}

export function syringeFillOffsetY(fillRatio: number): number {
  const clamped = Math.min(0.98, Math.max(0, fillRatio));
  /** Empty = plunger pushed down toward needle; full = plunger pulled back up. */
  return (1 - clamped) * SYRINGE_BARREL_TRAVEL;
}

/** Liquid column grows upward from the needle end as the plunger is pulled back. */
export function syringeLiquidLayout(fillRatio: number): { y: number; height: number } {
  const clamped = Math.min(0.98, Math.max(0, fillRatio));
  const height = clamped * SYRINGE_BARREL.interiorHeight;
  const y = SYRINGE_BARREL.interiorBottom - height;
  return { y, height };
}

/** Convert a vertical delta in SVG viewBox units to screen pixels for HTML wrappers. */
export function svgViewBoxDeltaToScreenY(element: Element | null, viewBoxDelta: number): number {
  if (!element) return viewBoxDelta;
  const svg = element.closest("svg");
  if (!svg) return viewBoxDelta;
  const rect = svg.getBoundingClientRect();
  const viewHeight = svg.viewBox.baseVal.height || Number(svg.getAttribute("height")) || 1;
  if (!viewHeight) return viewBoxDelta;
  return (viewBoxDelta / viewHeight) * rect.height;
}

/** Imperative translateY on an SVG layer using viewBox user units (not CSS px). */
export function svgLayerTranslateYSetter(element: Element | null): ((y: number) => void) | null {
  if (!element) return null;
  return (y: number) => {
    // Clear any CSS transform GSAP may have left (breaks SVG clipPath).
    const el = element as HTMLElement & SVGElement;
    if (el.style) {
      el.style.transform = "";
      el.style.translate = "";
      el.style.willChange = "";
    }
    element.setAttribute("transform", `translate(0 ${y})`);
  };
}

/** Set a numeric attribute on an SVG element (e.g. rect height / y). */
export function svgAttrSetter(
  element: Element | null,
  attr: "y" | "height" | "width" | "x",
): ((value: number) => void) | null {
  if (!element) return null;
  return (value: number) => {
    element.setAttribute(attr, String(value));
  };
}

export function measureStaticDrawTargets(scene: HTMLElement, wrap: HTMLElement): StaticDrawTargets | null {
  const waterStopper = scene.querySelector('[data-vial-root="water"] [data-vial-stopper]');
  const medStopper = scene.querySelector('[data-vial-root="med"] [data-vial-stopper]');
  const needleTip = wrap.querySelector("[data-needle-tip]");
  if (!waterStopper || !medStopper || !needleTip) return null;

  const sceneRect = scene.getBoundingClientRect();

  return {
    waterStopper: centerRelativeTo(waterStopper, sceneRect),
    medStopper: centerRelativeTo(medStopper, sceneRect),
    tipAtZero: centerRelativeTo(needleTip, sceneRect),
  };
}

export function measureDrawTargets(scene: HTMLElement, wrap: HTMLElement): DrawTargets | null {
  const staticTargets = measureStaticDrawTargets(scene, wrap);
  if (!staticTargets) return null;

  const waterLiquid = scene.querySelector('[data-vial-root="water"] [data-vial-liquid-surface]');
  const medLiquid = scene.querySelector('[data-vial-root="med"] [data-vial-liquid-surface]');
  if (!waterLiquid || !medLiquid) return null;

  const sceneRect = scene.getBoundingClientRect();

  return {
    ...staticTargets,
    waterLiquid: centerRelativeTo(waterLiquid, sceneRect),
    medLiquid: centerRelativeTo(medLiquid, sceneRect),
  };
}

export function syringePositionForStopper(
  stopper: NormPoint,
  tipAtZero: NormPoint,
  insertPx = 0,
): NormPoint {
  return {
    x: stopper.x - tipAtZero.x,
    y: stopper.y - tipAtZero.y + insertPx,
  };
}

export function syringePositionForLiquid(
  stopper: NormPoint,
  liquidSurface: NormPoint,
  tipAtZero: NormPoint,
  penetratePx = 5,
): NormPoint {
  return {
    x: stopper.x - tipAtZero.x,
    y: liquidSurface.y - tipAtZero.y + penetratePx,
  };
}
