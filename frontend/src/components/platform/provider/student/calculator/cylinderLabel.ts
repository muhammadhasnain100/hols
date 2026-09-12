/**
 * Label plate for a vertical cylinder, viewed mostly straight-on.
 *
 * Keep a soft rounded rect — do NOT bow top/bottom in opposite directions
 * (that reads as a puffy “eye”). Wrap is sold with horizontal edge-falloff
 * shading. Callers should size the plate to the bottle body walls and clip
 * to the bottle silhouette so L/R edges meet the glass.
 */

/** Path for a cylindrical label plate in SVG user units. */
export function cylinderLabelPath(
  x: number,
  y: number,
  w: number,
  h: number,
  /** Corner roundness — keep modest so the plate stays label-like. */
  radius = 4,
): string {
  const r = Math.min(radius, w / 4, h / 4);
  const x2 = x + w;
  const y2 = y + h;
  // Straight vertical sides — width is chosen to meet the cylinder walls;
  // bottle clip handles the true silhouette.
  return [
    `M ${x + r} ${y}`,
    `L ${x2 - r} ${y}`,
    `Q ${x2} ${y} ${x2} ${y + r}`,
    `L ${x2} ${y2 - r}`,
    `Q ${x2} ${y2} ${x2 - r} ${y2}`,
    `L ${x + r} ${y2}`,
    `Q ${x} ${y2} ${x} ${y2 - r}`,
    `L ${x} ${y + r}`,
    `Q ${x} ${y} ${x + r} ${y}`,
    `Z`,
  ].join(" ");
}
