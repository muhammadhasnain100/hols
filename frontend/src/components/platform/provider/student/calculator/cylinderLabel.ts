/**
 * Label plate geometry that reads as paper wrapped on a vertical cylinder —
 * bowed top/bottom edges + slight side bend, paired with a dark→light→dark
 * horizontal fill for wrap shading.
 */

/** Path for a cylindrical label plate in SVG user units. */
export function cylinderLabelPath(
  x: number,
  y: number,
  w: number,
  h: number,
  bulge = 3.2,
): string {
  const x2 = x + w;
  const y2 = y + h;
  const mx = x + w / 2;
  const side = bulge * 0.4;
  // Top: center sits slightly lower (front of cylinder nearer / slight top view).
  // Bottom: center sits slightly higher. Sides bend gently with the bottle.
  return [
    `M ${x} ${y + bulge * 0.55}`,
    `Q ${mx} ${y - bulge * 0.2} ${x2} ${y + bulge * 0.55}`,
    `Q ${x2 + side} ${y + h * 0.5} ${x2} ${y2 - bulge * 0.55}`,
    `Q ${mx} ${y2 + bulge * 0.2} ${x} ${y2 - bulge * 0.55}`,
    `Q ${x - side} ${y + h * 0.5} ${x} ${y + bulge * 0.55}`,
    `Z`,
  ].join(" ");
}
