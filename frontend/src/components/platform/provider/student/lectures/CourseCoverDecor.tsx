import type { CourseCoverPalette } from "@/components/platform/provider/student/lectures/courseCover";

type CourseCoverDecorProps = {
  uid: string;
  palette: CourseCoverPalette;
  /** Stable slot for subtle variation (0–2). */
  slot?: number;
};

/**
 * Non-vial cover accent — open-book / library motif with soft brand ribbon.
 * Used for guides, sales, training, and admin courses where a peptide vial is off-theme.
 */
export function CourseCoverDecor({ uid, palette, slot = 0 }: CourseCoverDecorProps) {
  const ribbonGrad = `cover-ribbon-${uid}`;
  const bookGrad = `cover-book-${uid}`;
  const glowGrad = `cover-glow-${uid}`;
  const spineGrad = `cover-spine-${uid}`;
  const tilt = -3 + slot * 2.5;

  return (
    <svg
      viewBox="0 0 120 140"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      className="lecture-cover-decor h-full w-full overflow-visible"
      aria-hidden
    >
      <defs>
        <linearGradient id={ribbonGrad} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={palette.lime} stopOpacity="0.42" />
          <stop offset="55%" stopColor={palette.sky} stopOpacity="0.28" />
          <stop offset="100%" stopColor={palette.mid} stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id={bookGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.ink} stopOpacity="0.18" />
          <stop offset="100%" stopColor={palette.navy} stopOpacity="0.38" />
        </linearGradient>
        <linearGradient id={spineGrad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={palette.mid} stopOpacity="0.7" />
          <stop offset="100%" stopColor={palette.navy} stopOpacity="0.85" />
        </linearGradient>
        <radialGradient id={glowGrad} cx="50%" cy="42%" r="62%">
          <stop offset="0%" stopColor={palette.sky} stopOpacity="0.28" />
          <stop offset="40%" stopColor={palette.lime} stopOpacity="0.12" />
          <stop offset="100%" stopColor={palette.mid} stopOpacity="0" />
        </radialGradient>
        <filter id={`cover-decor-shadow-${uid}`} x="-30%" y="-15%" width="160%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" floodColor="#05071a" floodOpacity="0.45" />
        </filter>
      </defs>

      <g transform={`rotate(${tilt} 60 70)`} filter={`url(#cover-decor-shadow-${uid})`}>
        {/* Soft brand halo — baby blue primary, lime accent */}
        <ellipse cx="62" cy="68" rx="52" ry="58" fill={`url(#${glowGrad})`} />

        {/* Abstract ribbon sweep */}
        <path
          d="M16 26 C38 14 74 20 100 36 C90 50 58 56 32 48 C26 42 20 34 16 26 Z"
          fill={`url(#${ribbonGrad})`}
          opacity="0.9"
        />
        <path
          d="M20 30 C42 22 68 26 94 40"
          fill="none"
          stroke={palette.lime}
          strokeOpacity="0.32"
          strokeWidth="1.2"
        />

        {/* Open book — left page */}
        <path
          d="M26 50 C26 50 26 118 26 118 C26 124 34 128 42 126 L56 118 L56 56 C46 52 34 50 26 50 Z"
          fill={`url(#${bookGrad})`}
          stroke={palette.sky}
          strokeOpacity="0.32"
          strokeWidth="0.8"
        />
        {/* Open book — right page */}
        <path
          d="M94 50 C94 50 94 118 94 118 C94 124 86 128 78 126 L62 118 L62 56 C72 52 84 50 94 50 Z"
          fill={`url(#${bookGrad})`}
          stroke={palette.sky}
          strokeOpacity="0.32"
          strokeWidth="0.8"
        />
        {/* Spine / gutter */}
        <path
          d="M56 56 L58 118 L62 118 L62 56 Z"
          fill={`url(#${spineGrad})`}
        />
        <ellipse cx="59" cy="56" rx="3.5" ry="1.4" fill={palette.lime} opacity="0.4" />

        {/* Page lines — left */}
        {[70, 80, 90, 100].map((y) => (
          <line
            key={`l-${y}`}
            x1="32"
            y1={y}
            x2="50"
            y2={y - 1}
            stroke={palette.ink}
            strokeOpacity="0.14"
            strokeWidth="0.7"
          />
        ))}
        {/* Page lines — right */}
        {[70, 80, 90, 100].map((y) => (
          <line
            key={`r-${y}`}
            x1="88"
            y1={y}
            x2="70"
            y2={y - 1}
            stroke={palette.ink}
            strokeOpacity="0.14"
            strokeWidth="0.7"
          />
        ))}

        {/* Document cue — folded corner on right page */}
        <path
          d="M80 62 L90 62 L90 72 L80 62 Z"
          fill={palette.lime}
          opacity="0.24"
        />
        <path
          d="M80 62 L90 72"
          stroke={palette.lime}
          strokeOpacity="0.4"
          strokeWidth="0.6"
        />

        {/* Library seal */}
        <circle cx="60" cy="108" r="9" fill={palette.mid} opacity="0.5" />
        <circle cx="60" cy="108" r="6.5" fill="none" stroke={palette.lime} strokeOpacity="0.5" strokeWidth="0.9" />
        <circle cx="60" cy="108" r="4" fill="none" stroke={palette.sky} strokeOpacity="0.25" strokeWidth="0.5" />
        <text
          x="60"
          y="110.5"
          textAnchor="middle"
          fontFamily="var(--font-primary-stack, Arial, Helvetica, sans-serif)"
          fontSize="5.5"
          fontWeight="800"
          letterSpacing="-0.3"
          fill={palette.lime}
          opacity="0.85"
        >
          H
        </text>
      </g>
    </svg>
  );
}
