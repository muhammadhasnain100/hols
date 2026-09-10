/**
 * Purpose-built horizontal syringe illustration for the calculator overview
 * AND the reconstitution animation. Drawn natively left→right (needle right),
 * plunger and liquid are grouped so GSAP can animate them imperatively.
 *
 *   [thumb][shaft ┃ flanges ┃ piston][────── barrel ──────][hub][── needle ──▶
 *
 * Default (static) pose is EMPTY — piston resting at the hub end of the barrel,
 * shaft fully inserted, thumb pad flush with the finger flanges. From there,
 * `plungerTransform=translate(-N 0)` pulls the plunger LEFT as it fills.
 *
 * viewBox: 0 0 520 120
 */

import type { CSSProperties, ReactNode } from "react";

export const HSYR_GEOMETRY = {
  viewW: 520,
  viewH: 120,
  /** Vertical mid-line (barrel axis). */
  axisY: 60,
  /** Barrel interior — liquid column lives here. */
  interior: { x: 172, y: 44, w: 200, h: 32 },
  /** Piston (rubber head) rest position when the syringe is EMPTY (all the
   *  way toward the hub). Full retraction pulls it left toward interior.x. */
  pistonWidth: 16,
  pistonEmptyX: 356,
  pistonFullX: 172,
  /** Plunger travel from empty → full, in SVG X units. */
  plungerTravel: 184,
  /**
   * Thumb pad rest X (EMPTY pose): pressed right up against the finger flanges
   * so no shaft is visible outside the barrel. As the plunger retracts (barrel
   * fills), GSAP translates the plunger group LEFT, exposing the shaft.
   */
  thumbCenterX: 131,
  /** Finger flanges (fixed on the barrel). */
  flangeX: 149,
  flangeXR: 172,
  /** Barrel outer bounds. */
  barrel: { x: 165, y: 38, w: 215, h: 44 },
} as const;

type HorizontalSyringeArtProps = {
  uid: string;
  /** Static fill ratio (0..1). Ignored when `gsapOwned` — GSAP seeds empty. */
  fillRatio?: number;
  showLiquid?: boolean;
  active?: boolean;
  /**
   * When true, plunger + liquid are seeded to empty and left for GSAP to drive
   * via the exported data-attrs (`data-syringe-plunger-layer`,
   * `data-syringe-liquid-layer`, `data-syringe-liquid-fill`).
   */
  gsapOwned?: boolean;
  /**
   * Draw-scene depth split: metal needle under vial caps, barrel above them.
   */
  part?: "full" | "needle" | "barrel";
  className?: string;
  style?: CSSProperties;
  /** Optional label to render below (unused; consumer usually renders their own). */
  children?: ReactNode;
};

/**
 * Horizontal plunger X offset for a given fill ratio.
 * Empty (0) → 0 (plunger flush with flanges).
 * Full (1) → -plungerTravel (plunger fully retracted to the left).
 */
export function hsyrPlungerOffsetX(fillRatio: number): number {
  const clamped = Math.min(0.98, Math.max(0, fillRatio));
  return -clamped * HSYR_GEOMETRY.plungerTravel;
}

/**
 * Liquid rect x/width for a given fill ratio.
 *
 * The liquid column ALWAYS sits flush against the retracting piston's right
 * face and extends toward the hub — physically the water enters through the
 * needle (hub / RIGHT side of the native horizontal pose), pushing against
 * the piston as it is drawn back. So visually the column grows leftward
 * from the hub end as the plunger retracts.
 *
 *   empty (fill=0):  ▓▓▓▓▓▓▓▓ piston at right, no liquid drawn
 *   half  (fill=½):  ░░░░ piston mid-barrel, water fills right half
 *   full  (fill=1):  ░░░░░░░░ piston at left, water fills full interior
 *
 * Uses `plungerTravel` (interior width minus piston width) so the liquid
 * width matches the exact space vacated by the piston, keeping the column
 * flush with the piston's right face across the sweep.
 */
export function hsyrLiquidLayout(fillRatio: number): { x: number; width: number } {
  const clamped = Math.min(0.98, Math.max(0, fillRatio));
  const width = HSYR_GEOMETRY.plungerTravel * clamped;
  const interiorRight = HSYR_GEOMETRY.interior.x + HSYR_GEOMETRY.interior.w;
  return { x: interiorRight - width, width };
}

export function HorizontalSyringeArt({
  uid,
  fillRatio = 0,
  showLiquid = false,
  active = false,
  gsapOwned = false,
  part = "full",
  className,
  style,
}: HorizontalSyringeArtProps) {
  const barrelGrad = `hsyr-barrel-${uid}`;
  const glassSheen = `hsyr-sheen-${uid}`;
  const metalGrad = `hsyr-metal-${uid}`;
  const rubberGrad = `hsyr-rubber-${uid}`;
  const hubGrad = `hsyr-hub-${uid}`;
  const needleGrad = `hsyr-needle-${uid}`;
  const thumbGrad = `hsyr-thumb-${uid}`;
  const liquidGrad = `hsyr-liq-${uid}`;
  const liquidShine = `hsyr-liq-shine-${uid}`;
  const shadowId = `hsyr-shadow-${uid}`;
  const clipId = `hsyr-clip-${uid}`;
  const glowId = `hsyr-glow-${uid}`;
  const partClipId = `hsyr-part-clip-${uid}`;

  const staticFill = gsapOwned ? 0 : Math.min(0.98, Math.max(0, fillRatio));
  const liquid = hsyrLiquidLayout(staticFill);
  const plungerX = gsapOwned ? 0 : hsyrPlungerOffsetX(staticFill);

  const showLiquidNow = showLiquid && (gsapOwned || staticFill > 0);
  // Hub ends ~440; metal needle starts there. Split so only the shaft goes under caps.
  // Barrel clip MUST extend left of x=0 — full plunger retract moves the thumb
  // pad to ~x=-53 (r=18), and a clip at x=0 was swallowing the ball.
  const partClipRect =
    part === "needle"
      ? { x: 438, y: 0, w: 82, h: 120 }
      : part === "barrel"
        ? { x: -96, y: 0, w: 536, h: 120 }
        : null;

  return (
    <svg
      viewBox={`0 0 ${HSYR_GEOMETRY.viewW} ${HSYR_GEOMETRY.viewH}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      className={className}
      // `overflow: visible` lets the plunger draw OUTSIDE the viewBox when it
      // retracts (thumb pad crosses SVG x=0 as syringeFill approaches 1). The
      // parent rotator/wrap uses default overflow so the extended draw shows
      // through; scene/card boundaries govern the ultimate clipping.
      style={{ overflow: "visible", ...style }}
      role="img"
      aria-hidden
    >
      <defs>
        <linearGradient id={barrelGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="18%" stopColor="#e0f2fe" stopOpacity="0.22" />
          <stop offset="55%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="88%" stopColor="#bae6fd" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.28" />
        </linearGradient>
        <linearGradient id={glassSheen} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="12%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="88%" stopColor="#ffffff" stopOpacity="0" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="0.28" />
        </linearGradient>

        <linearGradient id={metalGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="45%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        <radialGradient id={thumbGrad} cx="0.35" cy="0.35" r="0.7">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="55%" stopColor="#dbe3ec" />
          <stop offset="100%" stopColor="#94a3b8" />
        </radialGradient>

        <linearGradient id={rubberGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>

        <linearGradient id={hubGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="55%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>

        <linearGradient id={needleGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>

        <linearGradient id={liquidGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d7f0fa" stopOpacity="0.82" />
          <stop offset="0.35" stopColor="#8fd0ea" stopOpacity="0.9" />
          <stop offset="0.75" stopColor="#5bb4d8" stopOpacity="0.94" />
          <stop offset="1" stopColor="#3d9bc4" stopOpacity="0.96" />
        </linearGradient>
        <linearGradient id={liquidShine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.4" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>

        <clipPath id={clipId}>
          <rect
            x={HSYR_GEOMETRY.interior.x}
            y={HSYR_GEOMETRY.interior.y}
            width={HSYR_GEOMETRY.interior.w}
            height={HSYR_GEOMETRY.interior.h}
            rx="3"
          />
        </clipPath>

        <filter id={shadowId} x="-3%" y="-30%" width="106%" height="160%">
          <feDropShadow
            dx="0"
            dy="3"
            stdDeviation="4"
            floodColor="#0f172a"
            floodOpacity="0.16"
          />
        </filter>

        <radialGradient id={glowId} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="rgba(47,107,181,0.28)" />
          <stop offset="1" stopColor="rgba(20,38,68,0)" />
        </radialGradient>

        {partClipRect ? (
          <clipPath id={partClipId}>
            <rect
              x={partClipRect.x}
              y={partClipRect.y}
              width={partClipRect.w}
              height={partClipRect.h}
            />
          </clipPath>
        ) : null}
      </defs>

      {active && part !== "needle" ? (
        <ellipse
          cx={HSYR_GEOMETRY.viewW / 2}
          cy={HSYR_GEOMETRY.viewH / 2}
          rx="220"
          ry="34"
          fill={`url(#${glowId})`}
          opacity="0.85"
        />
      ) : null}

      <g
        filter={part === "needle" ? undefined : `url(#${shadowId})`}
        clipPath={partClipRect ? `url(#${partClipId})` : undefined}
      >
        {/*
         * =============== PLUNGER BACK (thumb + shaft) ===============
         * Drawn BEFORE the barrel so the shaft is hidden by the barrel
         * body when the plunger is depressed. As the plunger retracts,
         * the shaft slides LEFT out of the barrel and becomes visible
         * between the thumb pad and the finger flanges.
         *
         * Uses `data-syringe-plunger-layer` (same attr as the piston
         * group below) so GSAP moves both in lock-step via a single
         * `querySelectorAll` sweep.
         */}
        <g
          data-syringe-plunger-layer
          transform={gsapOwned ? "translate(0 0)" : `translate(${plungerX} 0)`}
        >
          {/* Plunger shaft — extends from thumb → piston. Anchored so its
              right edge sits at the piston in the empty pose; when translated
              left, the shaft exposes to the LEFT of the flanges. */}
          <rect
            x={HSYR_GEOMETRY.thumbCenterX + 18}
            y={HSYR_GEOMETRY.axisY - 5}
            width={HSYR_GEOMETRY.pistonEmptyX - (HSYR_GEOMETRY.thumbCenterX + 18)}
            height="10"
            fill={`url(#${metalGrad})`}
            stroke="#94a3b8"
            strokeWidth="0.6"
          />
          <line
            x1={HSYR_GEOMETRY.thumbCenterX + 18}
            y1={HSYR_GEOMETRY.axisY - 5}
            x2={HSYR_GEOMETRY.pistonEmptyX}
            y2={HSYR_GEOMETRY.axisY - 5}
            stroke="#ffffff"
            strokeOpacity="0.7"
            strokeWidth="1.1"
          />
          <line
            x1={HSYR_GEOMETRY.thumbCenterX + 18}
            y1={HSYR_GEOMETRY.axisY + 5}
            x2={HSYR_GEOMETRY.pistonEmptyX}
            y2={HSYR_GEOMETRY.axisY + 5}
            stroke="#334155"
            strokeOpacity="0.35"
            strokeWidth="0.8"
          />

          {/* Thumb pad — sits directly at the flange edge when empty. */}
          <circle
            cx={HSYR_GEOMETRY.thumbCenterX}
            cy={HSYR_GEOMETRY.axisY}
            r="18"
            fill={`url(#${thumbGrad})`}
            stroke="#94a3b8"
            strokeWidth="1"
          />
          <ellipse
            cx={HSYR_GEOMETRY.thumbCenterX - 2}
            cy={HSYR_GEOMETRY.axisY}
            rx="9"
            ry="6"
            fill="#0f172a"
            opacity="0.08"
          />
          <ellipse
            cx={HSYR_GEOMETRY.thumbCenterX - 5}
            cy={HSYR_GEOMETRY.axisY - 4}
            rx="5"
            ry="2"
            fill="#ffffff"
            opacity="0.65"
          />
        </g>

        {/* ============== FINGER FLANGES (fixed — cover any shaft peeking past) ============== */}
        <path
          d={`M155 15
              Q${HSYR_GEOMETRY.flangeX} 15 ${HSYR_GEOMETRY.flangeX} 22
              L${HSYR_GEOMETRY.flangeX} 98
              Q${HSYR_GEOMETRY.flangeX} 105 155 105
              L${HSYR_GEOMETRY.flangeXR} 105
              Q${HSYR_GEOMETRY.flangeXR} 88 ${HSYR_GEOMETRY.flangeXR} 15 Z`}
          fill={`url(#${metalGrad})`}
          stroke="#64748b"
          strokeWidth="1"
        />
        <rect x="151" y="18" width="4" height="84" fill="#ffffff" opacity="0.42" />

        {/* ============== BARREL (opaque back — hides the shaft inside) ============== */}
        <rect
          x={HSYR_GEOMETRY.barrel.x}
          y={HSYR_GEOMETRY.barrel.y}
          width={HSYR_GEOMETRY.barrel.w}
          height={HSYR_GEOMETRY.barrel.h}
          rx="3.5"
          // Solid pale glass fill hides the shaft that runs THROUGH the barrel
          // when the plunger is depressed. The transparent glass sheen is
          // layered back on top after the piston + tick marks.
          fill="#f1f7fb"
          stroke="#94a3b8"
          strokeWidth="1.6"
        />
        <rect
          x={HSYR_GEOMETRY.barrel.x}
          y={HSYR_GEOMETRY.barrel.y}
          width={HSYR_GEOMETRY.barrel.w}
          height={HSYR_GEOMETRY.barrel.h}
          rx="3.5"
          fill={`url(#${barrelGrad})`}
        />
        <rect
          x={HSYR_GEOMETRY.barrel.x}
          y={HSYR_GEOMETRY.barrel.y + 2}
          width={HSYR_GEOMETRY.barrel.w}
          height="8"
          rx="2"
          fill="#ffffff"
          opacity="0.32"
        />
        <rect
          x={HSYR_GEOMETRY.barrel.x}
          y={HSYR_GEOMETRY.barrel.y + HSYR_GEOMETRY.barrel.h - 8}
          width={HSYR_GEOMETRY.barrel.w}
          height="6"
          fill="#0f172a"
          opacity="0.08"
        />
        <rect x={HSYR_GEOMETRY.barrel.x + 2} y="42" width="2" height="36" fill="#ffffff" opacity="0.55" />
        <rect x={HSYR_GEOMETRY.barrel.x + HSYR_GEOMETRY.barrel.w - 4} y="42" width="2" height="36" fill="#0f172a" opacity="0.12" />

        {/* ============== LIQUID (barrel-clipped, on top of the opaque back) ============== */}
        {showLiquidNow ? (
          <g
            clipPath={`url(#${clipId})`}
            data-syringe-liquid-layer
            opacity={gsapOwned ? 0 : 1}
          >
            <rect
              data-syringe-liquid-fill
              x={liquid.x}
              y={HSYR_GEOMETRY.interior.y}
              width={liquid.width}
              height={HSYR_GEOMETRY.interior.h}
              fill={`url(#${liquidGrad})`}
            />
            {/*
             * Advancing edge highlight — sits on the LEFT face of the liquid
             * column (piston side). As water enters from the hub / needle end
             * on the RIGHT and the piston retracts LEFT, the leading edge
             * that "chases" the piston is the left boundary of the column.
             */}
            <rect
              x={liquid.x}
              y={HSYR_GEOMETRY.interior.y + 2}
              width="3"
              height={HSYR_GEOMETRY.interior.h - 4}
              fill="#ffffff"
              opacity="0.4"
            />
            {/* Top light band */}
            <rect
              x={liquid.x}
              y={HSYR_GEOMETRY.interior.y}
              width={liquid.width}
              height="10"
              fill={`url(#${liquidShine})`}
            />
          </g>
        ) : null}

        {/*
         * =============== PLUNGER FRONT (piston only) ===============
         * Drawn AFTER the liquid so the rubber head sits on top of the
         * water column. Same `data-syringe-plunger-layer` attribute, so
         * `querySelectorAll('[data-syringe-plunger-layer]')` catches
         * BOTH groups and GSAP translates them identically.
         */}
        <g
          data-syringe-plunger-layer
          transform={gsapOwned ? "translate(0 0)" : `translate(${plungerX} 0)`}
        >
          <rect
            x={HSYR_GEOMETRY.pistonEmptyX}
            y={HSYR_GEOMETRY.axisY - 20}
            width={HSYR_GEOMETRY.pistonWidth}
            height="40"
            rx="1.5"
            fill={`url(#${rubberGrad})`}
          />
          <rect
            x={HSYR_GEOMETRY.pistonEmptyX}
            y={HSYR_GEOMETRY.axisY - 15}
            width={HSYR_GEOMETRY.pistonWidth}
            height="3"
            fill="#000000"
            opacity="0.55"
          />
          <rect
            x={HSYR_GEOMETRY.pistonEmptyX}
            y={HSYR_GEOMETRY.axisY + 12}
            width={HSYR_GEOMETRY.pistonWidth}
            height="3"
            fill="#000000"
            opacity="0.55"
          />
          <rect
            x={HSYR_GEOMETRY.pistonEmptyX + 2}
            y={HSYR_GEOMETRY.axisY - 18}
            width="2"
            height="36"
            fill="#ffffff"
            opacity="0.18"
          />
        </g>

        {/* ============== GLASS SHEEN + TICK MARKS (drawn last, on top of piston) ============== */}
        <rect
          x={HSYR_GEOMETRY.barrel.x}
          y={HSYR_GEOMETRY.barrel.y}
          width={HSYR_GEOMETRY.barrel.w}
          height={HSYR_GEOMETRY.barrel.h}
          fill={`url(#${glassSheen})`}
          opacity="0.55"
          pointerEvents="none"
        />

        <g stroke="#0f172a" strokeLinecap="round" opacity="0.9">
          {[0.25, 0.5, 0.75, 1].map((t) => {
            const x = 175 + t * 195;
            const labelled = t === 0.5 || t === 1;
            return (
              <g key={`maj-${t}`}>
                <line
                  x1={x}
                  y1="42"
                  x2={x}
                  y2={labelled ? 52 : 49}
                  strokeWidth={labelled ? 1.5 : 1.1}
                />
                {labelled ? (
                  <text
                    x={x}
                    y="63.5"
                    textAnchor="middle"
                    fontFamily="var(--font-secondary-stack, Arial, sans-serif)"
                    fontSize="10.5"
                    fontWeight="700"
                    fill="#0f172a"
                    stroke="none"
                    textRendering="geometricPrecision"
                  >
                    {t === 1 ? "1" : "½"}
                  </text>
                ) : null}
              </g>
            );
          })}
          {[0.1, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.9].map((t) => {
            const x = 175 + t * 195;
            return (
              <line
                key={`min-${t}`}
                x1={x}
                y1="42"
                x2={x}
                y2="46"
                strokeWidth="0.7"
              />
            );
          })}
        </g>

        {/* ============== LUER TAPER + HUB + NEEDLE (fixed) ============== */}
        <path
          d="M380 45
             L400 54
             L400 66
             L380 75 Z"
          fill={`url(#${barrelGrad})`}
          stroke="#64748b"
          strokeWidth="0.9"
        />
        <rect x="380" y="45" width="4" height="30" fill="#ffffff" opacity="0.18" />

        <rect
          x="400"
          y="50"
          width="34"
          height="20"
          rx="2.2"
          fill={`url(#${hubGrad})`}
          stroke="#0284c7"
          strokeWidth="0.7"
        />
        <g stroke="#0369a1" strokeOpacity="0.4" strokeWidth="0.6">
          <line x1="406" y1="52" x2="406" y2="68" />
          <line x1="412" y1="52" x2="412" y2="68" />
          <line x1="418" y1="52" x2="418" y2="68" />
          <line x1="424" y1="52" x2="424" y2="68" />
        </g>
        <rect x="400" y="51.5" width="34" height="3" rx="1.5" fill="#ffffff" opacity="0.45" />
        <rect x="434" y="53" width="6" height="14" rx="1.5" fill={`url(#${hubGrad})`} />

        {/* Metal needle shaft + tip */}
        <rect
          x="440"
          y="57.5"
          width="66"
          height="5"
          rx="1.2"
          fill={`url(#${needleGrad})`}
        />
        <line
          x1="442"
          y1="59"
          x2="504"
          y2="59"
          stroke="#ffffff"
          strokeOpacity="0.6"
          strokeWidth="0.6"
        />
        <path d="M506 57.5 L506 62.5 L515 60.2 Z" fill="#64748b" />
        <line
          x1="506"
          y1="58"
          x2="514"
          y2="60.2"
          stroke="#ffffff"
          strokeOpacity="0.55"
          strokeWidth="0.6"
        />

        {/* ============== NEEDLE TIP marker (used by animation to align) ============== */}
        <circle cx="515" cy="60.2" r="0.001" fill="none" data-syringe-tip />
      </g>
    </svg>
  );
}

