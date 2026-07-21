/**
 * SVG-normalized geometry for calculator vial + syringe alignment.
 *
 * Draw animation math:
 * 1. Measure vial stopper from painted `object-contain` area.
 * 2. Find syringe needle tip in painted content BEFORE CSS rotation.
 * 3. Apply +45° around rotator center.
 * 4. Solve tip X so rotated tip lands on vertical center line:
 *      (tipX - 0.5) * contentW = (tipY - 0.5) * contentH   (since tan 45° = 1)
 */

export type NormPoint = { x: number; y: number };

type ContentRect = {
  left: number;
  top: number;
  width: number;
  height: number;
};

export const VIAL_SVG = {
  viewBoxWidth: 50.765,
  viewBoxHeight: 100.13,
  /** Rubber stopper center in SVG viewBox (normalized). */
  stopper: { x: 0.5, y: 0.082 } satisfies NormPoint,
} as const;

export const SYRINGE_SVG = {
  viewBoxWidth: 976.71,
  viewBoxHeight: 1000.6,
  horizontalCssRotationDeg: -45,
  drawCssRotationDeg: 45,
  /** Needle hub vertical position in painted syringe content (before CSS rotation). */
  drawNeedleTipYInContent: 0.638,
} as const;

export function getObjectContainContentRect(
  img: HTMLImageElement,
  containerRect: DOMRect,
): ContentRect | null {
  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;
  if (!naturalWidth || !naturalHeight) return null;

  const boxWidth = containerRect.width;
  const boxHeight = containerRect.height;
  const imageAspect = naturalWidth / naturalHeight;
  const boxAspect = boxWidth / boxHeight;

  if (imageAspect > boxAspect) {
    const width = boxWidth;
    const height = boxWidth / imageAspect;
    return {
      left: containerRect.left,
      top: containerRect.top + (boxHeight - height) / 2,
      width,
      height,
    };
  }

  const height = boxHeight;
  const width = boxHeight * imageAspect;
  return {
    left: containerRect.left + (boxWidth - width) / 2,
    top: containerRect.top,
    width,
    height,
  };
}

/**
 * Given tip Y in painted content, return tip X so a +45° rotation around the
 * rotator center places the needle on the vertical center line.
 */
export function drawNeedleTipInContent(content: ContentRect): NormPoint {
  const tipY = SYRINGE_SVG.drawNeedleTipYInContent;
  const tipX = 0.5 + (content.height / content.width) * (tipY - 0.5);
  return { x: tipX, y: tipY };
}

export function rotateScreenPoint(
  point: NormPoint,
  pivot: NormPoint,
  degrees: number,
): NormPoint {
  const rad = (degrees * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  const dx = point.x - pivot.x;
  const dy = point.y - pivot.y;
  return {
    x: pivot.x + dx * cos - dy * sin,
    y: pivot.y + dx * sin + dy * cos,
  };
}

export function measureVialStopper(
  vialRoot: Element,
  sceneRect: DOMRect,
): NormPoint | null {
  const image = vialRoot.querySelector("[data-vial-image]") as HTMLImageElement | null;
  if (!image) return null;

  const containerRect = image.getBoundingClientRect();
  const content = getObjectContainContentRect(image, containerRect);
  if (!content) return null;

  const stopper = VIAL_SVG.stopper;

  return {
    x: content.left + content.width * stopper.x - sceneRect.left,
    y: content.top + content.height * stopper.y - sceneRect.top,
  };
}

export function measureNeedleOffsetInWrap(wrap: HTMLElement): NormPoint | null {
  const rotator = wrap.querySelector("[data-syringe-rotator]") as HTMLElement | null;
  const image = rotator?.querySelector("img") as HTMLImageElement | null;
  if (!rotator || !image) return null;

  const wrapRect = wrap.getBoundingClientRect();
  const rotatorRect = rotator.getBoundingClientRect();
  const content = getObjectContainContentRect(image, rotatorRect);
  if (!content) return null;

  const tip = drawNeedleTipInContent(content);
  const tipBeforeRotate = {
    x: content.left + content.width * tip.x,
    y: content.top + content.height * tip.y,
  };

  const pivot = {
    x: rotatorRect.left + rotatorRect.width / 2,
    y: rotatorRect.top + rotatorRect.height / 2,
  };

  const tipAfterRotate = rotateScreenPoint(
    tipBeforeRotate,
    pivot,
    SYRINGE_SVG.drawCssRotationDeg,
  );

  return {
    x: tipAfterRotate.x - wrapRect.left,
    y: tipAfterRotate.y - wrapRect.top,
  };
}

export type DrawTargets = {
  water: NormPoint;
  med: NormPoint;
  needleOffset: NormPoint;
};

export function measureDrawTargets(scene: HTMLElement, wrap: HTMLElement): DrawTargets | null {
  const sceneRect = scene.getBoundingClientRect();
  const waterRoot = scene.querySelector('[data-vial-root="water"]');
  const medRoot = scene.querySelector('[data-vial-root="med"]');
  const needleOffset = measureNeedleOffsetInWrap(wrap);

  if (!waterRoot || !medRoot || !needleOffset) return null;

  const water = measureVialStopper(waterRoot, sceneRect);
  const med = measureVialStopper(medRoot, sceneRect);

  if (!water || !med) return null;

  return { water, med, needleOffset };
}

/** Place syringe wrapper so the needle tip sits on a vial stopper. */
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
