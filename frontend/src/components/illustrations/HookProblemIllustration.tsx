export function HookProblemIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 480 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden
    >
      <rect width="480" height="360" rx="24" fill="#F4F8FB" />

      <rect x="32" y="48" width="140" height="96" rx="12" fill="white" stroke="#8DC3E1" strokeWidth="1.5" />
      <rect x="44" y="64" width="72" height="6" rx="3" fill="#3853A4" opacity="0.25" />
      <rect x="44" y="78" width="96" height="4" rx="2" fill="#383838" opacity="0.12" />
      <rect x="44" y="88" width="88" height="4" rx="2" fill="#383838" opacity="0.12" />
      <rect x="44" y="98" width="76" height="4" rx="2" fill="#383838" opacity="0.12" />
      <rect x="44" y="108" width="84" height="4" rx="2" fill="#383838" opacity="0.12" />
      <circle cx="152" cy="60" r="8" fill="#DDE466" opacity="0.6" />

      <rect x="248" y="72" width="120" height="88" rx="12" fill="white" stroke="#8DC3E1" strokeWidth="1.5" />
      <circle cx="272" cy="98" r="10" fill="#3853A4" opacity="0.15" />
      <rect x="290" y="92" width="56" height="5" rx="2.5" fill="#3853A4" opacity="0.2" />
      <rect x="262" y="112" width="88" height="4" rx="2" fill="#383838" opacity="0.1" />
      <rect x="262" y="122" width="72" height="4" rx="2" fill="#383838" opacity="0.1" />
      <rect x="262" y="132" width="80" height="4" rx="2" fill="#383838" opacity="0.1" />

      <rect x="88" y="180" width="160" height="112" rx="12" fill="white" stroke="#152744" strokeWidth="1.5" opacity="0.85" />
      <rect x="104" y="196" width="48" height="48" rx="8" fill="#152744" opacity="0.08" />
      <path d="M120 212h16M120 220h24M120 228h20" stroke="#152744" strokeWidth="2" strokeLinecap="round" opacity="0.2" />
      <rect x="164" y="200" width="68" height="5" rx="2.5" fill="#152744" opacity="0.3" />
      <rect x="164" y="214" width="56" height="4" rx="2" fill="#383838" opacity="0.12" />
      <rect x="164" y="226" width="64" height="4" rx="2" fill="#383838" opacity="0.12" />
      <rect x="164" y="238" width="48" height="4" rx="2" fill="#383838" opacity="0.12" />
      <rect x="164" y="258" width="72" height="20" rx="6" fill="#DDE466" opacity="0.35" />

      <rect x="300" y="200" width="100" height="72" rx="10" fill="white" stroke="#8DC3E1" strokeWidth="1.5" transform="rotate(6 350 236)" />
      <rect x="312" y="216" width="64" height="4" rx="2" fill="#383838" opacity="0.12" transform="rotate(6 344 218)" />
      <rect x="310" y="228" width="56" height="4" rx="2" fill="#383838" opacity="0.12" transform="rotate(6 338 230)" />
      <rect x="308" y="240" width="60" height="4" rx="2" fill="#383838" opacity="0.12" transform="rotate(6 338 242)" />

      <circle cx="400" cy="120" r="28" fill="#3853A4" opacity="0.08" />
      <text x="400" y="126" textAnchor="middle" fill="#3853A4" fontSize="22" fontWeight="600" opacity="0.35">
        ?
      </text>

      <path
        d="M180 280c40-20 80-20 120 0"
        stroke="#8DC3E1"
        strokeWidth="1.5"
        strokeDasharray="4 6"
        opacity="0.5"
      />
      <circle cx="60" cy="300" r="6" fill="#8DC3E1" opacity="0.4" />
      <circle cx="420" cy="290" r="5" fill="#DDE466" opacity="0.5" />
    </svg>
  );
}
