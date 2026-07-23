/**
 * Marker-based geometry for calculator vial + syringe alignment.
 *
 * The vial SVG paints an invisible `[data-vial-stopper]` node at the needle-entry
 * point, and the syringe SVG paints an invisible `[data-needle-tip]` node at the
 * needle tip. We simply read their live screen positions with
 * `getBoundingClientRect`, so alignment stays correct regardless of artwork,
 * scale, rotation, or responsive sizing.
 */

export type NormPoint = { x: number; y: number };

export type DrawTargets = {
  /** Water-vial stopper, relative to the scene box. */
  water: NormPoint;
  /** Medication-vial stopper, relative to the scene box. */
  med: NormPoint;
  /** Needle tip, relative to the syringe wrapper's untransformed origin. */
  needleOffset: NormPoint;
};

function centerRelativeTo(el: Element, origin: DOMRect): NormPoint {
  const rect = el.getBoundingClientRect();
  return {
    x: rect.left + rect.width / 2 - origin.left,
    y: rect.top + rect.height / 2 - origin.top,
  };
}

export function measureDrawTargets(scene: HTMLElement, wrap: HTMLElement): DrawTargets | null {
  const waterStopper = scene.querySelector('[data-vial-root="water"] [data-vial-stopper]');
  const medStopper = scene.querySelector('[data-vial-root="med"] [data-vial-stopper]');
  const needleTip = wrap.querySelector("[data-needle-tip]");
  if (!waterStopper || !medStopper || !needleTip) return null;

  const sceneRect = scene.getBoundingClientRect();
  const wrapRect = wrap.getBoundingClientRect();

  return {
    water: centerRelativeTo(waterStopper, sceneRect),
    med: centerRelativeTo(medStopper, sceneRect),
    needleOffset: centerRelativeTo(needleTip, wrapRect),
  };
}

/** Place the syringe wrapper so the needle tip lands on a vial stopper. */
export function syringePositionForStopper(
  stopper: NormPoint,
  needleOffset: NormPoint,
  insertPx = 0,
): NormPoint {
  return {
    x: stopper.x - needleOffset.x,
    y: stopper.y - needleOffset.y + insertPx,
  };
}
