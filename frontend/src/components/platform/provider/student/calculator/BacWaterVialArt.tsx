/**
 * Vector bac-water vial matched to the Hospira 30 mL product photo:
 * wide cylinder, rounded shoulders, short neck, pink flip-cap, silver crimp,
 * white label + magenta product band. HOLS mark sits in the white header.
 */

import type { ReactNode, Ref } from "react";

export const BAC_WATER_SRC = {
  viewW: 160,
  viewH: 210,
  cx: 80,
  stopperY: 16,
  interiorTop: 92,
  interiorHeight: 100,
} as const;

type BacWaterVialArtProps = {
  uid: string;
  showBack?: boolean;
  showFront?: boolean;
  frontGlass?: boolean;
  empty?: boolean;
  gsapDriven?: boolean;
  fillOffsetY?: number;
  liquidLayer: ReactNode;
  liquidLayerRef?: Ref<SVGGElement>;
  surfaceRef?: Ref<SVGCircleElement>;
};

/** Wide multi-dose bottle body (photo proportions). */
const BODY_PATH =
  "M38 76 C38 64 48 52 64 46 L64 40 C64 37 68 35 80 35 C92 35 96 37 96 40 L96 46 C112 52 122 64 122 76 L122 188 C122 200 110 206 80 206 C50 206 38 200 38 188 Z";

const MAGENTA = "#D80073";
const MAGENTA_DEEP = "#A8005A";

export function BacWaterVialArt({
  uid,
  showBack = true,
  showFront = true,
  frontGlass = false,
  empty = false,
  gsapDriven = false,
  fillOffsetY = 0,
  liquidLayer,
  liquidLayerRef,
  surfaceRef,
}: BacWaterVialArtProps) {
  const { cx, stopperY, interiorTop, interiorHeight } = BAC_WATER_SRC;
  const fillTransform = gsapDriven ? undefined : `translate(0 ${fillOffsetY})`;
  const glassGrad = `bw-glass-${uid}`;
  const glassEdge = `bw-edge-${uid}`;
  const neckGrad = `bw-neck-${uid}`;
  const metalGrad = `bw-metal-${uid}`;
  const metalVert = `bw-metal-v-${uid}`;
  const capGrad = `bw-cap-${uid}`;
  const bottleClip = `bw-clip-${uid}`;

  return (
    <g shapeRendering="geometricPrecision">
      <defs>
        <linearGradient id={glassGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6b7280" stopOpacity="0.35" />
          <stop offset="8%" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="22%" stopColor="#e5e7eb" stopOpacity="0.2" />
          <stop offset="48%" stopColor="#ffffff" stopOpacity="0.08" />
          <stop offset="78%" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="100%" stopColor="#6b7280" stopOpacity="0.32" />
        </linearGradient>
        <linearGradient id={glassEdge} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
          <stop offset="70%" stopColor="#9ca3af" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#111827" stopOpacity="0.2" />
        </linearGradient>
        {/* Clear neck — mostly see-through with soft edge highlights. */}
        <linearGradient id={neckGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.22" />
          <stop offset="18%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="45%" stopColor="#e2e8f0" stopOpacity="0.08" />
          <stop offset="72%" stopColor="#ffffff" stopOpacity="0.42" />
          <stop offset="100%" stopColor="#94a3b8" stopOpacity="0.2" />
        </linearGradient>
        <linearGradient id={metalGrad} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#7a7a7a" />
          <stop offset="15%" stopColor="#f3f3f3" />
          <stop offset="35%" stopColor="#b0b0b0" />
          <stop offset="55%" stopColor="#ffffff" />
          <stop offset="75%" stopColor="#a8a8a8" />
          <stop offset="100%" stopColor="#6e6e6e" />
        </linearGradient>
        <linearGradient id={metalVert} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
          <stop offset="55%" stopColor="#c4c4c4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#6b6b6b" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={capGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ff4fa0" />
          <stop offset="40%" stopColor={MAGENTA} />
          <stop offset="100%" stopColor={MAGENTA_DEEP} />
        </linearGradient>
        <clipPath id={bottleClip}>
          <path d={BODY_PATH} />
        </clipPath>
      </defs>

      {showBack ? (
        <>
          <ellipse cx={cx} cy="204" rx="46" ry="4.5" fill="#0f172a" opacity="0.16" />
          <g clipPath={`url(#${bottleClip})`}>
            <g
              ref={liquidLayerRef}
              data-vial-liquid-layer
              transform={
                gsapDriven
                  ? undefined
                  : empty
                    ? `translate(0 ${interiorHeight - 6})`
                    : fillTransform
              }
              opacity={empty ? 0 : 1}
            >
              {liquidLayer}
            </g>
          </g>
          <circle data-vial-stopper cx={cx} cy={stopperY} r="2.5" fill="transparent" />
          <circle
            ref={surfaceRef}
            data-vial-liquid-surface
            cx={cx}
            cy={interiorTop + 1}
            r="2"
            fill="transparent"
            transform={
              gsapDriven
                ? undefined
                : empty
                  ? `translate(0 ${interiorHeight - 6})`
                  : fillTransform
            }
          />
        </>
      ) : null}

      {showFront ? (
        <g opacity={frontGlass ? 0.97 : 1}>
          {/* Clear glass body */}
          <path
            d={BODY_PATH}
            fill={`url(#${glassGrad})`}
            stroke="#9ca3af"
            strokeOpacity="0.55"
            strokeWidth="1.4"
          />
          <path
            d="M40 176 C40 194 54 202 80 202 C106 202 120 194 120 176 L120 184 C120 198 106 206 80 206 C54 206 40 198 40 184 Z"
            fill={`url(#${glassEdge})`}
            opacity="0.7"
          />

          {/* Glass edge highlights — drawn under the label so text stays crisp */}
          <g clipPath={`url(#${bottleClip})`} pointerEvents="none">
            <path
              d="M46 50 C44 78 44 100 45 118 L45 118 C45 118 52 118 56 118 L56 100 C56 78 58 58 64 48 Z"
              fill="#ffffff"
              opacity="0.28"
            />
            <path
              d="M46 172 C45 180 45 190 45 196 C45 202 54 204 64 204 L64 204 C56 198 56 184 56 172 Z"
              fill="#ffffff"
              opacity="0.22"
            />
            <path
              d="M108 52 C116 72 118 100 118 118 L104 118 C104 100 106 72 106 52 Z"
              fill="#ffffff"
              opacity="0.16"
            />
            <path
              d="M118 172 C118 184 118 196 112 202 C106 204 100 204 96 204 L96 172 Z"
              fill="#ffffff"
              opacity="0.14"
            />
          </g>

          {/* Label on top of glass shine */}
          <rect x="44" y="88" width="72" height="98" rx="2.5" fill="#ffffff" />
          <rect
            x="44"
            y="88"
            width="72"
            height="98"
            rx="2.5"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="0.8"
          />

          <text
            x="50"
            y="108"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="7.2"
            fontWeight="800"
            fill="#111827"
          >
            HOLS
            <tspan fill="#3853A4">.</tspan>
          </text>
          <text
            x="50"
            y="116"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="3.3"
            fontWeight="600"
            fill="#3853A4"
          >
            house of life science
          </text>

          {/* Magenta band — no volume / measurement copy */}
          <rect x="44" y="122" width="72" height="48" fill={MAGENTA} />
          <text
            x="80"
            y="140"
            textAnchor="middle"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="6.4"
            fontWeight="800"
            letterSpacing="0.1"
            fill="#0a0a0a"
          >
            BACTERIOSTATIC
          </text>
          <text
            x="80"
            y="154"
            textAnchor="middle"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="11"
            fontWeight="800"
            letterSpacing="0.3"
            fill="#0a0a0a"
          >
            WATER
          </text>
          <text
            x="80"
            y="164"
            textAnchor="middle"
            fontFamily="Arial, Helvetica, sans-serif"
            fontSize="4"
            fontWeight="500"
            fill="#1f2937"
          >
            for Injection, USP
          </text>

          {/* Neck — translucent glass (see-through, soft rim highlights) */}
          <rect
            x="69"
            y="33"
            width="22"
            height="20"
            rx="2.5"
            fill={`url(#${neckGrad})`}
            stroke="#cbd5e1"
            strokeOpacity="0.55"
            strokeWidth="0.85"
          />
          <rect
            x="72.5"
            y="35"
            width="15"
            height="16"
            rx="1.8"
            fill="#ffffff"
            opacity="0.1"
          />
          <ellipse cx={cx} cy="35" rx="11" ry="2" fill="#ffffff" opacity="0.42" />
          <ellipse cx={cx} cy="51.5" rx="10.5" ry="1.8" fill="#94a3b8" opacity="0.18" />
          <line
            x1="71"
            y1="36"
            x2="71"
            y2="50"
            stroke="#ffffff"
            strokeWidth="1.4"
            strokeOpacity="0.45"
            strokeLinecap="round"
          />
          <line
            x1="89"
            y1="37"
            x2="89"
            y2="49"
            stroke="#ffffff"
            strokeWidth="1"
            strokeOpacity="0.28"
            strokeLinecap="round"
          />

          {/* Aluminum crimp — short ridged band */}
          <rect
            x="58"
            y="20"
            width="44"
            height="16"
            rx="2.5"
            fill={`url(#${metalGrad})`}
            stroke="#8a8a8a"
            strokeWidth="0.7"
          />
          <rect x="58" y="20" width="44" height="16" rx="2.5" fill={`url(#${metalVert})`} />
          <g opacity="0.28" stroke="#4b5563" strokeWidth="0.55">
            {Array.from({ length: 14 }).map((_, i) => {
              const x = 61 + i * 2.85;
              return <line key={x} x1={x} y1="22" x2={x} y2="34" />;
            })}
          </g>
          <rect x="58" y="21.5" width="44" height="2" rx="1" fill="#ffffff" opacity="0.45" />

          {/* Pink flip-cap — flat disc matching photo */}
          <ellipse cx={cx} cy="12" rx="28" ry="7.5" fill={`url(#${capGrad})`} />
          <rect x="52" y="12" width="56" height="10" fill={`url(#${capGrad})`} />
          <ellipse cx={cx} cy="22" rx="28" ry="4" fill={MAGENTA_DEEP} opacity="0.55" />
          <ellipse cx={cx} cy="11" rx="22" ry="3.2" fill="#ff9bc8" opacity="0.35" />
        </g>
      ) : null}
    </g>
  );
}

export function BacWaterLiquidFill() {
  const { interiorTop, interiorHeight, cx } = BAC_WATER_SRC;
  return (
    <>
      <rect
        x="42"
        y={interiorTop}
        width="76"
        height={interiorHeight + 14}
        fill="#c5e8f5"
        opacity="0.32"
      />
      <rect
        x="42"
        y={interiorTop}
        width="76"
        height={interiorHeight + 14}
        fill="#f7fcfe"
        opacity="0.25"
      />
      <ellipse cx={cx} cy={interiorTop + 1} rx="34" ry="3.5" fill="#ffffff" opacity="0.5" />
    </>
  );
}
