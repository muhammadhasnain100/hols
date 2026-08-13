/**
 * Syringe artwork adapted from the provided vector SVG (horizontal 45° reference),
 * remapped to a vertical needle-down local coordinate system so GSAP plunger
 * (translateY) and liquid (y/height) animation keep working.
 */

import { useLayoutEffect, useRef, type CSSProperties, type ReactNode } from "react";

type SyringeArtProps = {
  uid: string;
  showNeedle?: boolean;
  showBarrel?: boolean;
  showLiquid?: boolean;
  active?: boolean;
  needleDown?: boolean;
  plungerTransform: string;
  plungerMotionStyle?: CSSProperties;
  liquidLayerStyle?: CSSProperties;
  /** SVG presentation opacity (GSAP-safe). Prefer this over CSS opacity. */
  liquidLayerOpacity?: number;
  liquidFill: { y: number; height: number };
  liquidNode?: ReactNode;
  /** When true, React leaves y/height/transform alone after mount for GSAP. */
  gsapOwned?: boolean;
};

/** Must stay in sync with calculatorGeometry SYRINGE_BARREL / TRAVEL. */
export const SYRINGE_ART = {
  cx: 40,
  barrelX: 22,
  barrelW: 36,
  barrelY: 94,
  barrelH: 208,
  flangeY: 88,
  interiorX: 26,
  interiorW: 28,
  interiorTop: 102,
  interiorBottom: 302,
  interiorH: 200,
  hubY: 302,
  needleY: 332,
  needleH: 70,
  tipY: 404,
  /**
   * Stem gap (viewBox units) kept between thumb pad bottom and finger flanges
   * when the plunger is fully depressed (empty). Keeps the thumb from looking
   * glued flush to the barrel.
   */
  thumbStemGap: 14,
  /** Room for thumb pad when plunger is fully pulled back. */
  viewTop: -146,
  viewBottom: 412,
  /**
   * Thumb pad local Y (top/bottom). Offset "backwards" (more negative) by
   * thumbStemGap so even at max depression a short stem shows above the flanges.
   */
  thumbTop: -142,
  thumbBottom: -126,
  /** Plunger shaft top (connects thumb pad to rubber head). */
  shaftTop: -124,
  shaftH: 210,
} as const;

export function SyringeArt({
  uid,
  showNeedle = true,
  showBarrel = true,
  showLiquid = false,
  active = false,
  needleDown = false,
  plungerTransform,
  plungerMotionStyle,
  liquidLayerStyle,
  liquidLayerOpacity,
  liquidFill,
  liquidNode,
  gsapOwned = false,
}: SyringeArtProps) {
  const barrelGrad = `syr-barrel-${uid}`;
  const plungerGrad = `syr-plunger-${uid}`;
  const rubberGrad = `syr-rubber-${uid}`;
  const hubGrad = `syr-hub-${uid}`;
  const needleGrad = `syr-needle-${uid}`;
  const liquidGrad = `syr-liq-${uid}`;
  const liquidShine = `syr-liq-shine-${uid}`;
  const clipId = `syr-clip-${uid}`;
  const shadowId = `syr-shadow-${uid}`;
  const glowId = `syr-glow-${uid}`;

  const { cx, tipY } = SYRINGE_ART;
  const needleShaftY = needleDown ? SYRINGE_ART.needleY : 330;
  const needleShaftH = needleDown ? SYRINGE_ART.needleH : 42;
  const tip = needleDown ? tipY : 377;

  const liquidFillRef = useRef<SVGRectElement>(null);
  const liquidLayerRef = useRef<SVGGElement>(null);
  const plungerRef = useRef<SVGGElement>(null);

  /** Seed GSAP-owned geometry once — later React renders must not clobber animated attrs. */
  useLayoutEffect(() => {
    if (!gsapOwned) return;
    const fill = liquidFillRef.current;
    if (fill) {
      fill.setAttribute("y", String(liquidFill.y));
      fill.setAttribute("height", String(Math.max(0, liquidFill.height)));
    }
    const layer = liquidLayerRef.current;
    if (layer && liquidLayerOpacity != null) {
      layer.style.opacity = "";
      layer.setAttribute("opacity", String(liquidLayerOpacity));
    }
    const plunger = plungerRef.current;
    if (plunger) {
      plunger.style.transform = "";
      plunger.setAttribute("transform", plungerTransform);
    }
    // intentionally mount-only
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gsapOwned]);

  return (
    <>
      <defs>
        <linearGradient id={barrelGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="15%" stopColor="#e0f2fe" stopOpacity="0.18" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.06" />
          <stop offset="85%" stopColor="#bae6fd" stopOpacity="0.14" />
          <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={plungerGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f8fafc" />
          <stop offset="50%" stopColor="#e2e8f0" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>
        <linearGradient id={rubberGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="50%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id={hubGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="50%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#0369a1" />
        </linearGradient>
        <linearGradient id={needleGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#94a3b8" />
          <stop offset="50%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#64748b" />
        </linearGradient>
        {/* Solid bac-water blue — must read clearly through the glass barrel. */}
        <linearGradient id={liquidGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4AA3DE" />
          <stop offset="0.4" stopColor="#2B6FB8" />
          <stop offset="1" stopColor="#163A7A" />
        </linearGradient>
        <linearGradient id={liquidShine} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.22" />
          <stop offset="0.4" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <clipPath id={clipId}>
          <rect
            x={SYRINGE_ART.interiorX}
            y={SYRINGE_ART.interiorTop - 4}
            width={SYRINGE_ART.interiorW}
            height={SYRINGE_ART.interiorH + 8}
            rx="2.5"
          />
        </clipPath>
        <filter id={shadowId} x="-40%" y="-5%" width="180%" height="115%">
          <feDropShadow
            dx="0"
            dy="4"
            stdDeviation="4"
            floodColor="#0f172a"
            floodOpacity="0.15"
          />
        </filter>
        <radialGradient id={glowId} cx="50%" cy="45%" r="50%">
          <stop offset="0" stopColor="rgba(47,107,181,0.28)" />
          <stop offset="1" stopColor="rgba(20,38,68,0)" />
        </radialGradient>
      </defs>

      {active && showBarrel ? (
        <ellipse cx={cx} cy="195" rx="28" ry="88" fill={`url(#${glowId})`} opacity="0.75" />
      ) : null}

      <g filter={showBarrel ? `url(#${shadowId})` : undefined}>
        {showNeedle ? (
          <g>
            {/* Blue plastic hub */}
            <path
              d="M31 302 L49 302 L46.5 322 L33.5 322 Z"
              fill={`url(#${hubGrad})`}
              stroke="#0284c7"
              strokeWidth="0.7"
            />
            <rect x="34" y="318" width="12" height="8" rx="1" fill={`url(#${hubGrad})`} />

            {/* Steel cannula */}
            <rect
              x="37.5"
              y={needleShaftY}
              width="5"
              height={needleShaftH}
              rx="1"
              fill={`url(#${needleGrad})`}
            />
            <path
              d={`M37.5 ${tip - 5} L42.5 ${tip - 5} L40 ${tip + 0.5} Z`}
              fill="#64748b"
            />
            <line
              x1="40"
              y1={tip - 7}
              x2="40"
              y2={tip - 1}
              stroke="#ffffff"
              strokeWidth="0.5"
              opacity="0.4"
            />
          </g>
        ) : null}

        {showBarrel ? (
          <g>
            {/* Glass barrel */}
            <rect
              x={SYRINGE_ART.barrelX}
              y={SYRINGE_ART.barrelY}
              width={SYRINGE_ART.barrelW}
              height={SYRINGE_ART.barrelH}
              rx="3"
              fill={`url(#${barrelGrad})`}
              stroke="#94a3b8"
              strokeWidth="1.5"
            />

            {/* Finger flanges */}
            <path
              d="M8 88 H72 Q75 88 75 92.5 V94.5 Q75 97 72 97 H8 Q5 97 5 94.5 V92.5 Q5 88 8 88 Z"
              fill={`url(#${plungerGrad})`}
              stroke="#64748b"
              strokeWidth="1"
            />
            <path
              d="M14 82 C10 82 10 88 14 88 Z"
              fill={`url(#${plungerGrad})`}
              stroke="#94a3b8"
              strokeWidth="0.8"
            />
            <path
              d="M66 82 C70 82 70 88 66 88 Z"
              fill={`url(#${plungerGrad})`}
              stroke="#94a3b8"
              strokeWidth="0.8"
            />

            {/* Tapered luer neck into hub */}
            <path
              d="M28 298 L52 298 L49 310 L31 310 Z"
              fill={`url(#${barrelGrad})`}
              stroke="#64748b"
              strokeWidth="0.9"
            />

            {/* Glass highlights */}
            <line
              x1="26"
              y1="100"
              x2="26"
              y2="290"
              stroke="#ffffff"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.75"
            />
            <line
              x1="30"
              y1="104"
              x2="30"
              y2="275"
              stroke="#ffffff"
              strokeWidth="1"
              strokeLinecap="round"
              opacity="0.45"
            />
            <line
              x1="52"
              y1="108"
              x2="52"
              y2="285"
              stroke="#ffffff"
              strokeWidth="1.4"
              strokeLinecap="round"
              opacity="0.35"
            />

            {showLiquid ? (
              <g clipPath={`url(#${clipId})`}>
                <g
                  ref={liquidLayerRef}
                  data-syringe-liquid-layer
                  style={liquidLayerStyle}
                  opacity={gsapOwned ? undefined : liquidLayerOpacity}
                >
                  {liquidNode ?? (
                    <>
                      {/* Solid blue body — GSAP animates y/height when gsapOwned. */}
                      <rect
                        ref={liquidFillRef}
                        data-syringe-liquid-fill
                        x={SYRINGE_ART.interiorX}
                        width={SYRINGE_ART.interiorW}
                        fill="#2B6FB8"
                        {...(gsapOwned
                          ? {}
                          : {
                              y: liquidFill.y,
                              height: Math.max(0, liquidFill.height),
                            })}
                      />
                      {!gsapOwned && liquidFill.height > 2 ? (
                        <rect
                          x={SYRINGE_ART.interiorX}
                          y={liquidFill.y}
                          width={SYRINGE_ART.interiorW}
                          height={Math.max(0, liquidFill.height)}
                          fill={`url(#${liquidGrad})`}
                          opacity="0.85"
                        />
                      ) : null}
                      {!gsapOwned && liquidFill.height > 6 ? (
                        <rect
                          x={SYRINGE_ART.interiorX}
                          y={liquidFill.y}
                          width={SYRINGE_ART.interiorW}
                          height={Math.min(22, liquidFill.height)}
                          fill={`url(#${liquidShine})`}
                        />
                      ) : null}
                    </>
                  )}
                </g>
              </g>
            ) : null}

            {/* Measurement ticks — kept inside the barrel glass (x 22–58) */}
            <g stroke="#0f172a" strokeLinecap="round" opacity="0.9">
              {[0, 1, 2, 3, 4].map((i) => {
                const y = 118 + i * 38;
                return (
                  <g key={`maj-${i}`}>
                    <line x1="40" y1={y} x2="52" y2={y} strokeWidth={i === 4 ? 1.5 : 1.25} />
                    <text
                      x="39"
                      y={y + 2.2}
                      textAnchor="end"
                      fontFamily="var(--font-secondary-stack, Arial, sans-serif)"
                      fontSize="5"
                      fontWeight="700"
                      fill="#0f172a"
                    >
                      {(i + 1) * 2}
                    </text>
                  </g>
                );
              })}
              {Array.from({ length: 16 }).map((_, i) => {
                const y = 118 + i * 9.5;
                if (i % 4 === 0) return null;
                const mid = i % 2 === 0;
                return (
                  <line
                    key={`min-${i}`}
                    x1={mid ? 44 : 47}
                    y1={y}
                    x2="52"
                    y2={y}
                    strokeWidth={mid ? 0.95 : 0.7}
                  />
                );
              })}
            </g>

            {/* Plunger assembly — travels in Y (empty = toward needle) */}
            <g
              ref={plungerRef}
              data-syringe-plunger-layer
              transform={gsapOwned ? undefined : plungerTransform}
              style={plungerMotionStyle}
            >
              {/* Thumb press — held back by thumbStemGap so a stem shows above flanges when empty */}
              <path
                d={`M14 ${SYRINGE_ART.thumbTop} C10 ${SYRINGE_ART.thumbTop} 10 ${SYRINGE_ART.thumbBottom} 14 ${SYRINGE_ART.thumbBottom} L66 ${SYRINGE_ART.thumbBottom} C70 ${SYRINGE_ART.thumbBottom} 70 ${SYRINGE_ART.thumbTop} 66 ${SYRINGE_ART.thumbTop} Z`}
                fill={`url(#${plungerGrad})`}
                stroke="#94a3b8"
                strokeWidth="1"
              />
              <ellipse
                cx={cx}
                cy={SYRINGE_ART.thumbTop}
                rx="24"
                ry="3.5"
                fill="#ffffff"
                opacity="0.4"
              />

              {/* Shaft + ribs — extends up to the retracted thumb pad */}
              <rect
                x="33"
                y={SYRINGE_ART.shaftTop}
                width="14"
                height={SYRINGE_ART.shaftH}
                rx="2"
                fill={`url(#${plungerGrad})`}
              />
              <rect
                x="35.5"
                y={SYRINGE_ART.shaftTop}
                width="3"
                height={SYRINGE_ART.shaftH}
                fill="#ffffff"
                opacity="0.45"
              />
              <line x1="28" y1="-48" x2="52" y2="-48" stroke="#cbd5e1" strokeWidth="2.5" />
              <line x1="28" y1="2" x2="52" y2="2" stroke="#cbd5e1" strokeWidth="2.5" />

              {/* Rubber piston head */}
              <rect x="25" y="88" width="30" height="14" rx="2" fill={`url(#${rubberGrad})`} />
              <rect x="27" y="84" width="26" height="8" rx="1.5" fill={`url(#${rubberGrad})`} />
              <line x1="28" y1="88" x2="52" y2="88" stroke="#000000" strokeWidth="1.2" />
              <line x1="28" y1="94" x2="52" y2="94" stroke="#000000" strokeWidth="1.2" />
            </g>
          </g>
        ) : null}
      </g>
    </>
  );
}
